//! A CLI do Mestre em modo headless e somente leitura (spec §7, docs/contrato-mestre.md).
//!
//! Os argumentos são fixos e montados aqui: a interface escolhe só a IA e manda o prompt e o
//! JSON Schema como dados. O prompt vai pelo stdin, nunca na linha de comando.

use std::ffi::OsString;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU32, Ordering};
use std::time::Duration;

use serde::Deserialize;

use crate::erro::{Erro, Resultado};
use crate::processo;
use crate::projeto;

/// Ler um Projeto grande para criar a Aventura leva minutos; mais que isso é travamento.
const LIMITE: Duration = Duration::from_secs(20 * 60);

/// As IAs que validam JSON Schema e têm modo somente leitura.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Ia {
    ClaudeCode,
    Codex,
}

impl Ia {
    pub fn executavel(self) -> &'static str {
        match self {
            Ia::ClaudeCode => "claude",
            Ia::Codex => "codex",
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PedidoMestre {
    pub ia: Ia,
    /// A pasta do Projeto, onde a CLI roda.
    pub raiz: String,
    /// Instruções do papel de Mestre + JSON de contexto da chamada.
    pub prompt: String,
    /// O JSON Schema da saída da chamada.
    pub schema: serde_json::Value,
}

/// Arquivos de apoio do Codex (schema e resposta), numa pasta temporária só desta chamada.
pub struct Arquivos {
    pub schema: PathBuf,
    pub resposta: PathBuf,
}

/// Só as ferramentas de leitura do Claude Code: sem edição, sem shell, sem rede.
const FERRAMENTAS_CLAUDE: &str = "Read,Grep,Glob";

/// Os argumentos exatos da CLI. `schema` já é o JSON compacto; `arquivos` só vale para o Codex.
pub fn argumentos(ia: Ia, raiz: &Path, schema: &str, arquivos: &Arquivos) -> Vec<OsString> {
    let mut args: Vec<OsString> = Vec::new();
    let mut junta = |partes: &[&str]| args.extend(partes.iter().map(OsString::from));
    match ia {
        Ia::ClaudeCode => {
            junta(&["-p", "--output-format", "json", "--json-schema", schema]);
            // --tools limita o que existe (vence permissões amplas nas configurações do Jogador);
            // --allowedTools aprova essas três sem perguntar.
            junta(&["--tools", FERRAMENTAS_CLAUDE]);
            junta(&["--allowedTools", FERRAMENTAS_CLAUDE]);
            // Nenhum servidor MCP configurado pelo Jogador entra na sessão.
            junta(&["--strict-mcp-config", "--no-session-persistence"]);
        }
        Ia::Codex => {
            junta(&["exec", "--sandbox", "read-only"]);
            // Nunca pedir para sair do sandbox, nem seguir regras que liberem comandos.
            junta(&["-c", "approval_policy=never", "--ignore-rules"]);
            junta(&["--ephemeral", "--color", "never"]);
            args.push("--cd".into());
            args.push(raiz.into());
            args.push("--output-schema".into());
            args.push(arquivos.schema.clone().into());
            args.push("--output-last-message".into());
            args.push(arquivos.resposta.clone().into());
            // `-`: as instruções vêm do stdin.
            args.push("-".into());
        }
    }
    args
}

/// Roda a chamada e devolve a resposta crua: o envelope JSON do Claude Code (com
/// `structured_output`) ou a última mensagem do Codex. Validar é com o Jogo, em TypeScript.
pub fn rodar(pedido: &PedidoMestre) -> Resultado<String> {
    let programa = processo::achar_no_path(pedido.ia.executavel())
        .ok_or_else(|| Erro::MestreAusente(pedido.ia.executavel().into()))?;
    rodar_com(&programa, pedido)
}

fn rodar_com(programa: &Path, pedido: &PedidoMestre) -> Resultado<String> {
    let raiz = projeto::validar_raiz(&pedido.raiz)?;
    if !pedido.schema.is_object() {
        return Err(Erro::ArgumentoRecusado("schema".into()));
    }
    let schema = pedido.schema.to_string();
    let pasta = PastaTemporaria::nova()?;
    let arquivos = Arquivos {
        schema: pasta.0.join("schema.json"),
        resposta: pasta.0.join("resposta.json"),
    };
    if pedido.ia == Ia::Codex {
        fs::write(&arquivos.schema, &schema)?;
    }
    let args = argumentos(pedido.ia, &raiz, &schema, &arquivos);
    let saida = processo::executar(programa, &args, &raiz, Some(&pedido.prompt), LIMITE)?;
    match pedido.ia {
        Ia::ClaudeCode => Ok(saida.stdout),
        Ia::Codex => Ok(fs::read_to_string(&arquivos.resposta)?),
    }
}

/// Some ao sair do escopo, com o que tiver dentro.
struct PastaTemporaria(PathBuf);

impl PastaTemporaria {
    fn nova() -> Resultado<Self> {
        static CONTADOR: AtomicU32 = AtomicU32::new(0);
        let n = CONTADOR.fetch_add(1, Ordering::Relaxed);
        let pasta =
            std::env::temp_dir().join(format!("quiz-your-slop-mestre-{}-{n}", std::process::id()));
        let _ = fs::remove_dir_all(&pasta);
        fs::create_dir_all(&pasta)?;
        Ok(Self(pasta))
    }
}

impl Drop for PastaTemporaria {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

#[cfg(test)]
mod testes {
    use super::*;

    fn arquivos() -> Arquivos {
        Arquivos {
            schema: PathBuf::from("/tmp/x/schema.json"),
            resposta: PathBuf::from("/tmp/x/resposta.json"),
        }
    }

    fn texto(args: Vec<OsString>) -> Vec<String> {
        args.into_iter().map(|a| a.into_string().unwrap()).collect()
    }

    #[test]
    fn claude_code_so_le() {
        let args = texto(argumentos(
            Ia::ClaudeCode,
            Path::new("/projeto"),
            r#"{"type":"object"}"#,
            &arquivos(),
        ));
        assert_eq!(
            args,
            [
                "-p",
                "--output-format",
                "json",
                "--json-schema",
                r#"{"type":"object"}"#,
                "--tools",
                "Read,Grep,Glob",
                "--allowedTools",
                "Read,Grep,Glob",
                "--strict-mcp-config",
                "--no-session-persistence"
            ]
        );
    }

    #[test]
    fn codex_em_sandbox_somente_leitura() {
        let args = texto(argumentos(
            Ia::Codex,
            Path::new("/projeto"),
            "{}",
            &arquivos(),
        ));
        assert_eq!(
            args,
            [
                "exec",
                "--sandbox",
                "read-only",
                "-c",
                "approval_policy=never",
                "--ignore-rules",
                "--ephemeral",
                "--color",
                "never",
                "--cd",
                "/projeto",
                "--output-schema",
                "/tmp/x/schema.json",
                "--output-last-message",
                "/tmp/x/resposta.json",
                "-"
            ]
        );
    }

    #[test]
    fn nada_que_libere_escrita_ou_shell() {
        for ia in [Ia::ClaudeCode, Ia::Codex] {
            let args = texto(argumentos(ia, Path::new("/p"), "{}", &arquivos()));
            for proibido in [
                "Bash",
                "Edit",
                "Write",
                "bypassPermissions",
                "--dangerously-skip-permissions",
                "workspace-write",
                "danger-full-access",
                "--full-auto",
                "--approve-for-me",
                "--dangerously-bypass-approvals-and-sandbox",
                "--add-dir",
            ] {
                assert!(
                    !args.iter().any(|a| a.contains(proibido)),
                    "{ia:?}: {proibido}"
                );
            }
        }
    }

    #[test]
    fn o_pedido_so_aceita_os_campos_conhecidos() {
        let ok: Result<PedidoMestre, _> = serde_json::from_str(
            r#"{"ia":"codex","raiz":"/p","prompt":"oi","schema":{"type":"object"}}"#,
        );
        assert_eq!(ok.unwrap().ia, Ia::Codex);
        for json in [
            r#"{"ia":"gemini","raiz":"/p","prompt":"oi","schema":{}}"#,
            r#"{"ia":"codex","raiz":"/p","prompt":"oi","schema":{},"args":["--full-auto"]}"#,
        ] {
            assert!(
                serde_json::from_str::<PedidoMestre>(json).is_err(),
                "{json}"
            );
        }
    }

    fn pedido(ia: Ia, raiz: &Path, schema: serde_json::Value) -> PedidoMestre {
        PedidoMestre {
            ia,
            raiz: raiz.to_str().unwrap().into(),
            prompt: "prompt do Mestre".into(),
            schema,
        }
    }

    #[test]
    fn recusa_schema_que_nao_e_objeto() {
        let raiz = std::env::temp_dir();
        let r = rodar_com(
            Path::new("/nao/existe"),
            &pedido(Ia::ClaudeCode, &raiz, serde_json::json!("x")),
        );
        assert_eq!(r.unwrap_err(), Erro::ArgumentoRecusado("schema".into()));
    }

    /// Uma CLI de mentira: o Claude devolve o stdin; o Codex grava o stdin no -o.
    #[cfg(unix)]
    #[test]
    fn roda_a_cli_com_o_prompt_no_stdin() {
        use std::os::unix::fs::PermissionsExt;
        let pasta = std::env::temp_dir().join(format!("quiz-mestre-{}", std::process::id()));
        let _ = fs::remove_dir_all(&pasta);
        fs::create_dir_all(&pasta).unwrap();
        let falso = pasta.join("ia");
        fs::write(
            &falso,
            "#!/bin/sh\n\
             saida=''\n\
             while [ $# -gt 0 ]; do\n\
               [ \"$1\" = --output-last-message ] && saida=\"$2\"\n\
               shift\n\
             done\n\
             if [ -n \"$saida\" ]; then cat > \"$saida\"; else cat; fi\n",
        )
        .unwrap();
        fs::set_permissions(&falso, fs::Permissions::from_mode(0o755)).unwrap();
        let schema = serde_json::json!({ "type": "object" });

        // Outro teste pode estar num fork() com o script ainda aberto ("Text file busy").
        let rodar_falso = |ia| loop {
            match rodar_com(&falso, &pedido(ia, &pasta, schema.clone())) {
                Err(Erro::Io(e)) if e.contains("busy") => std::thread::yield_now(),
                r => break r,
            }
        };
        assert_eq!(rodar_falso(Ia::ClaudeCode).unwrap(), "prompt do Mestre");
        assert_eq!(rodar_falso(Ia::Codex).unwrap(), "prompt do Mestre");
    }
}
