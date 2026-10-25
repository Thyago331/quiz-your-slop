//! Roda um processo filho na pasta do Projeto, com tempo limite.

use std::ffi::OsString;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};

use crate::erro::{Erro, Resultado};

/// O que o processo escreveu, se terminou com sucesso.
#[derive(Debug)]
pub struct Saida {
    pub stdout: String,
}

/// `programa args...` com `current_dir` = `pasta`, o `entrada` no stdin e sem shell no meio.
pub fn executar(
    programa: &Path,
    args: &[OsString],
    pasta: &Path,
    entrada: Option<&str>,
    limite: Duration,
) -> Resultado<Saida> {
    let mut comando = Command::new(programa);
    comando
        .args(args)
        .current_dir(pasta)
        .stdin(if entrada.is_some() {
            Stdio::piped()
        } else {
            Stdio::null()
        })
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    sem_janela_de_console(&mut comando);

    let mut filho = comando.spawn()?;
    if let Some(texto) = entrada {
        // Escrever numa thread: um stdin grande não pode travar enquanto stdout enche.
        let mut stdin = filho.stdin.take().expect("stdin pedido como piped");
        let texto = texto.to_owned();
        thread::spawn(move || {
            let _ = stdin.write_all(texto.as_bytes());
        });
    }
    let stdout = ler_em_segundo_plano(filho.stdout.take());
    let stderr = ler_em_segundo_plano(filho.stderr.take());

    let inicio = Instant::now();
    let status = loop {
        if let Some(status) = filho.try_wait()? {
            break status;
        }
        if inicio.elapsed() >= limite {
            let _ = filho.kill();
            let _ = filho.wait();
            return Err(Erro::TempoEsgotado {
                segundos: limite.as_secs(),
            });
        }
        thread::sleep(Duration::from_millis(50));
    };

    let stdout = stdout.join().unwrap_or_default();
    let stderr = stderr.join().unwrap_or_default();
    if !status.success() {
        return Err(Erro::Falhou {
            codigo: status.code(),
            stderr: String::from_utf8_lossy(&stderr).into_owned(),
        });
    }
    Ok(Saida {
        stdout: String::from_utf8_lossy(&stdout).into_owned(),
    })
}

fn ler_em_segundo_plano<R: Read + Send + 'static>(fonte: Option<R>) -> thread::JoinHandle<Vec<u8>> {
    thread::spawn(move || {
        let mut bytes = Vec::new();
        if let Some(mut f) = fonte {
            let _ = f.read_to_end(&mut bytes);
        }
        bytes
    })
}

/// No Windows, um app gráfico que roda `git` ou um `.cmd` abriria uma janela de console.
#[cfg(windows)]
fn sem_janela_de_console(comando: &mut Command) {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x0800_0000;
    comando.creation_flags(CREATE_NO_WINDOW);
}

#[cfg(not(windows))]
fn sem_janela_de_console(_: &mut Command) {}

/// Os nomes de arquivo que `nome` pode ter no PATH: no Windows, as CLIs instaladas pelo npm são
/// `.cmd` (o `Command` só acharia `.exe` sozinho).
pub fn nomes_executaveis(nome: &str) -> Vec<String> {
    nomes_para(nome, cfg!(windows))
}

fn nomes_para(nome: &str, windows: bool) -> Vec<String> {
    if windows {
        ["exe", "cmd", "bat"]
            .iter()
            .map(|ext| format!("{nome}.{ext}"))
            .collect()
    } else {
        vec![nome.to_owned()]
    }
}

/// O primeiro executável chamado `nome` nas pastas do PATH.
pub fn achar_no_path(nome: &str) -> Option<PathBuf> {
    let path = std::env::var_os("PATH")?;
    achar_em(&nomes_executaveis(nome), std::env::split_paths(&path))
}

fn achar_em(nomes: &[String], pastas: impl Iterator<Item = PathBuf>) -> Option<PathBuf> {
    pastas
        .flat_map(|pasta| nomes.iter().map(move |n| pasta.join(n)).collect::<Vec<_>>())
        .find(|candidato| candidato.is_file())
}

#[cfg(test)]
mod testes {
    use super::*;

    #[test]
    fn nomes_por_plataforma() {
        let nomes = nomes_executaveis("claude");
        if cfg!(windows) {
            assert_eq!(nomes, ["claude.exe", "claude.cmd", "claude.bat"]);
        } else {
            assert_eq!(nomes, ["claude"]);
        }
    }

    #[test]
    fn acha_a_primeira_pasta_que_tem() {
        let base = std::env::temp_dir().join(format!("quiz-path-{}", std::process::id()));
        let (a, b) = (base.join("a"), base.join("b"));
        std::fs::create_dir_all(&a).unwrap();
        std::fs::create_dir_all(&b).unwrap();
        let nome = &nomes_executaveis("codex")[0];
        std::fs::write(b.join(nome), "").unwrap();
        assert_eq!(
            achar_em(
                &nomes_executaveis("codex"),
                [a.clone(), b.clone()].into_iter()
            ),
            Some(b.join(nome))
        );
        assert_eq!(
            achar_em(&nomes_executaveis("claude"), [a, b].into_iter()),
            None
        );
    }

    /// No Windows, o npm instala o Codex como `codex.cmd`; um `codex.exe` na mesma pasta vence.
    #[test]
    fn no_windows_acha_o_codex_cmd_do_npm() {
        let base = std::env::temp_dir().join(format!("quiz-path-win-{}", std::process::id()));
        let (npm, nativo) = (base.join("npm"), base.join("nativo"));
        std::fs::create_dir_all(&npm).unwrap();
        std::fs::create_dir_all(&nativo).unwrap();
        std::fs::write(npm.join("codex.cmd"), "").unwrap();
        // Sem extensão (o script de shell do npm) não serve no Windows.
        std::fs::write(npm.join("codex"), "").unwrap();
        let nomes = nomes_para("codex", true);
        assert_eq!(nomes, ["codex.exe", "codex.cmd", "codex.bat"]);
        assert_eq!(
            achar_em(&nomes, [npm.clone()].into_iter()),
            Some(npm.join("codex.cmd"))
        );
        std::fs::write(npm.join("codex.exe"), "").unwrap();
        assert_eq!(
            achar_em(&nomes, [npm.clone()].into_iter()),
            Some(npm.join("codex.exe"))
        );
        // Fora do Windows, só o nome puro.
        assert_eq!(
            achar_em(
                &nomes_para("codex", false),
                [nativo, npm.clone()].into_iter()
            ),
            Some(npm.join("codex"))
        );
    }

    #[cfg(unix)]
    #[test]
    fn executa_com_stdin_e_tempo_limite() {
        let pasta = std::env::temp_dir();
        let sh = Path::new("/bin/sh");
        let ok = executar(
            sh,
            &["-c".into(), "cat; pwd >/dev/null".into()],
            &pasta,
            Some("olá"),
            Duration::from_secs(5),
        );
        assert_eq!(ok.unwrap().stdout, "olá");

        let falha = executar(
            sh,
            &["-c".into(), "echo ruim >&2; exit 3".into()],
            &pasta,
            None,
            Duration::from_secs(5),
        );
        assert_eq!(
            falha.unwrap_err(),
            Erro::Falhou {
                codigo: Some(3),
                stderr: "ruim\n".into()
            }
        );

        let lento = executar(
            sh,
            &["-c".into(), "sleep 5".into()],
            &pasta,
            None,
            Duration::from_millis(200),
        );
        assert!(matches!(lento, Err(Erro::TempoEsgotado { .. })));
    }
}
