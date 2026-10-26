//! Os únicos `git` que a interface pode pedir: leituras para a detecção de Região desatualizada
//! (spec §6) e a checagem de git da Nova Aventura. Qualquer outro formato nem desserializa.

use std::ffi::OsString;
use std::path::Path;
use std::time::Duration;

use serde::Deserialize;

use crate::erro::{Erro, Resultado};
use crate::processo;
use crate::projeto;
use crate::raizes::Raizes;

const LIMITE: Duration = Duration::from_secs(60);

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(tag = "tipo", rename_all = "snake_case", deny_unknown_fields)]
pub enum ComandoGit {
    /// `git rev-parse HEAD`: o commit atual (e se a pasta é um repositório com commits).
    /// (Variante com chaves vazias: assim campos extras também são recusados.)
    RevParseHead {},
    /// `git diff --numstat -z --find-renames <de> <ate> -- <caminhos>`: linhas mudadas por arquivo;
    /// com `-z`, um renomeado sai `a\td\t\0antigo\0novo\0` (sem aspas nem `{a => b}`).
    DiffNumstat {
        de: String,
        ate: String,
        caminhos: Vec<String>,
    },
    /// `git diff <de> <ate> -- <caminhos>`: o que mudou, para a Expedição sobre o que mudou.
    Diff {
        de: String,
        ate: String,
        caminhos: Vec<String>,
    },
    /// `git ls-files -z -- <caminhos>`: os arquivos commitados (vazio = o repositório todo).
    LsFiles { caminhos: Vec<String> },
}

/// Um commit: `HEAD` ou um hash (SHA-1 ou SHA-256, abreviado ou não). Nada de nomes de branch,
/// `HEAD~1`, `@{...}` ou opções disfarçadas.
fn validar_commit(r: &str) -> Resultado<()> {
    let hash = (4..=64).contains(&r.len()) && r.bytes().all(|b| b.is_ascii_hexdigit());
    if r == "HEAD" || hash {
        Ok(())
    } else {
        Err(Erro::ArgumentoRecusado(r.into()))
    }
}

/// Caminho relativo ao repositório, sem `..`, e sem pathspec mágico (`:(top)`, `:!...`).
fn validar_caminho(c: &str) -> Resultado<()> {
    if c.starts_with(':') || c.starts_with('-') {
        return Err(Erro::CaminhoRecusado(c.into()));
    }
    projeto::validar_relativo(c).map(|_| ())
}

impl ComandoGit {
    /// Os argumentos exatos do `git`, depois de validar cada pedaço que veio da interface.
    pub fn argumentos(&self) -> Resultado<Vec<OsString>> {
        // Leituras não reescrevem o índice e não chamam fsmonitor configurado no repositório.
        let mut args: Vec<OsString> = ["--no-optional-locks", "-c", "core.fsmonitor=false"]
            .map(OsString::from)
            .into();
        let mut junta = |partes: &[&str]| args.extend(partes.iter().map(OsString::from));
        match self {
            ComandoGit::RevParseHead {} => junta(&["rev-parse", "--verify", "HEAD"]),
            ComandoGit::DiffNumstat { de, ate, caminhos }
            | ComandoGit::Diff { de, ate, caminhos } => {
                validar_commit(de)?;
                validar_commit(ate)?;
                caminhos.iter().try_for_each(|c| validar_caminho(c))?;
                junta(&["diff", "--no-ext-diff", "--no-textconv", "--no-color"]);
                if matches!(self, ComandoGit::DiffNumstat { .. }) {
                    junta(&["--numstat", "-z", "--find-renames"]);
                }
                junta(&[de, ate, "--"]);
                junta(&caminhos.iter().map(String::as_str).collect::<Vec<_>>());
            }
            ComandoGit::LsFiles { caminhos } => {
                caminhos.iter().try_for_each(|c| validar_caminho(c))?;
                junta(&["ls-files", "-z", "--"]);
                junta(&caminhos.iter().map(String::as_str).collect::<Vec<_>>());
            }
        }
        Ok(args)
    }
}

/// Roda o comando com `current_dir` = raiz do Projeto e devolve o stdout.
pub fn rodar(raizes: &Raizes, raiz: &str, comando: &ComandoGit) -> Resultado<String> {
    let raiz = raizes.conferir(raiz)?;
    let args = comando.argumentos()?;
    let saida = processo::executar(Path::new("git"), &args, &raiz, None, LIMITE)?;
    Ok(saida.stdout)
}

#[cfg(test)]
mod testes {
    use super::*;

    fn texto(args: Vec<OsString>) -> Vec<String> {
        args.into_iter()
            .map(|a| a.into_string().unwrap())
            .skip(3)
            .collect()
    }

    fn de_json(json: &str) -> Result<ComandoGit, serde_json::Error> {
        serde_json::from_str(json)
    }

    #[test]
    fn monta_os_comandos_permitidos() {
        let head = de_json(r#"{"tipo":"rev_parse_head"}"#).unwrap();
        assert_eq!(
            texto(head.argumentos().unwrap()),
            ["rev-parse", "--verify", "HEAD"]
        );

        let numstat = de_json(
            r#"{"tipo":"diff_numstat","de":"a1b2c3d","ate":"HEAD","caminhos":["src/a.ts","src/b.ts"]}"#,
        )
        .unwrap();
        assert_eq!(
            texto(numstat.argumentos().unwrap()),
            [
                "diff",
                "--no-ext-diff",
                "--no-textconv",
                "--no-color",
                "--numstat",
                "-z",
                "--find-renames",
                "a1b2c3d",
                "HEAD",
                "--",
                "src/a.ts",
                "src/b.ts"
            ]
        );

        let ls = ComandoGit::LsFiles { caminhos: vec![] };
        assert_eq!(texto(ls.argumentos().unwrap()), ["ls-files", "-z", "--"]);
    }

    #[test]
    fn sempre_com_as_travas_globais() {
        let args = ComandoGit::RevParseHead {}.argumentos().unwrap();
        assert_eq!(
            args[..3],
            ["--no-optional-locks", "-c", "core.fsmonitor=false"].map(OsString::from)
        );
    }

    #[test]
    fn recusa_subcomandos_fora_da_lista() {
        for json in [
            r#"{"tipo":"push"}"#,
            r#"{"tipo":"checkout","ref":"main"}"#,
            r#"{"tipo":"rev_parse_head","extra":"--output=/tmp/x"}"#,
            r#"{"args":["status"]}"#,
            r#""rev-parse HEAD""#,
        ] {
            assert!(de_json(json).is_err(), "{json}");
        }
    }

    #[test]
    fn recusa_refs_e_caminhos_perigosos() {
        let diff = |de: &str, caminho: &str| ComandoGit::Diff {
            de: de.into(),
            ate: "HEAD".into(),
            caminhos: vec![caminho.into()],
        };
        for de in [
            "--output=/tmp/x",
            "main",
            "HEAD~1",
            "HEAD@{1}",
            "abc",
            "a1b2c3d..HEAD",
            "",
        ] {
            assert!(
                matches!(
                    diff(de, "src/a.ts").argumentos(),
                    Err(Erro::ArgumentoRecusado(_))
                ),
                "{de}"
            );
        }
        for caminho in [
            "../fora",
            "/etc/passwd",
            ":(top)x",
            ":!src",
            "-p",
            "src/../..",
        ] {
            assert!(
                matches!(
                    diff("HEAD", caminho).argumentos(),
                    Err(Erro::CaminhoRecusado(_))
                ),
                "{caminho}"
            );
        }
        let ls = ComandoGit::LsFiles {
            caminhos: vec!["../fora".into()],
        };
        assert!(ls.argumentos().is_err());
    }

    #[test]
    fn roda_num_repositorio_de_verdade() {
        let raiz = std::env::temp_dir().join(format!("quiz-git-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&raiz);
        std::fs::create_dir_all(&raiz).unwrap();
        let git = |args: &[&str]| {
            let ok = std::process::Command::new("git")
                .args([
                    "-c",
                    "user.name=t",
                    "-c",
                    "user.email=t@t",
                    "-c",
                    "commit.gpgsign=false",
                ])
                .args(args)
                .current_dir(&raiz)
                .status()
                .unwrap()
                .success();
            assert!(ok, "{args:?}");
        };
        git(&["init", "-q"]);
        std::fs::write(raiz.join("a.ts"), "1\n").unwrap();
        git(&["add", "a.ts"]);
        git(&["commit", "-q", "-m", "um"]);

        let r = raiz.to_str().unwrap();
        let raizes = Raizes::nova();
        assert!(matches!(
            rodar(&raizes, r, &ComandoGit::RevParseHead {}),
            Err(Erro::RaizNaoPermitida(_))
        ));
        raizes.permitir(r);
        let rodar = |r: &str, c: &ComandoGit| rodar(&raizes, r, c);
        let head = rodar(r, &ComandoGit::RevParseHead {}).unwrap();
        assert_eq!(head.trim().len(), 40);
        let ls = rodar(r, &ComandoGit::LsFiles { caminhos: vec![] }).unwrap();
        assert_eq!(ls, "a.ts\0");

        std::fs::write(raiz.join("a.ts"), "1\n2\n").unwrap();
        git(&["commit", "-q", "-am", "dois"]);
        let numstat = rodar(
            r,
            &ComandoGit::DiffNumstat {
                de: head.trim().into(),
                ate: "HEAD".into(),
                caminhos: vec!["a.ts".into()],
            },
        )
        .unwrap();
        assert_eq!(numstat, "1\t0\ta.ts\0");

        // Renomeado (mesmo conteúdo) aparece como par antigo/novo, e um caminho só o mostra apagado.
        let dois = rodar(r, &ComandoGit::RevParseHead {}).unwrap();
        git(&["mv", "a.ts", "b.ts"]);
        git(&["commit", "-q", "-m", "tres"]);
        let numstat = |caminhos: Vec<String>| {
            rodar(
                r,
                &ComandoGit::DiffNumstat {
                    de: dois.trim().into(),
                    ate: "HEAD".into(),
                    caminhos,
                },
            )
            .unwrap()
        };
        assert_eq!(numstat(vec![".".into()]), "0\t0\t\0a.ts\0b.ts\0");
        assert_eq!(numstat(vec!["a.ts".into()]), "0\t2\ta.ts\0");
    }
}
