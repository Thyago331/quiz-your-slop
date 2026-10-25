//! A CLI do Mestre em modo headless e somente leitura (spec §7, docs/contrato-mestre.md).
//!
//! Os argumentos são fixos e montados aqui: a interface escolhe só a IA e manda o prompt e o
//! JSON Schema como dados. O prompt vai pelo stdin, nunca na linha de comando.

use std::ffi::OsString;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU32, Ordering};
use std::time::Duration;

use serde::{Deserialize, Serialize};

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
    /// Os outros repositórios de um Projeto com mais de um (a CLI roda no primeiro, `raiz`).
    #[serde(default)]
    pub raizes_extras: Vec<String>,
}

/// Arquivos de apoio do Codex (schema e resposta), numa pasta temporária só desta chamada.
pub struct Arquivos {
    pub schema: PathBuf,
    pub resposta: PathBuf,
}

/// Só as ferramentas de leitura do Claude Code: sem edição, sem shell, sem rede.
const FERRAMENTAS_CLAUDE: &str = "Read,Grep,Glob";

/// Os argumentos exatos da CLI. `schema` já é o JSON compacto; `arquivos` só vale para o Codex.
/// `extras` são as raízes canônicas dos outros repositórios do Projeto.
pub fn argumentos(
    ia: Ia,
    raiz: &Path,
    extras: &[PathBuf],
    schema: &str,
    arquivos: &Arquivos,
) -> Vec<OsString> {
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
            // Os outros repositórios do Projeto entram só para leitura (as ferramentas são as três
            // acima); sem isto o Claude Code nega ler fora da pasta onde roda.
            for extra in extras {
                args.push("--add-dir".into());
                args.push(extra.into());
            }
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
    let extras = validar_extras(&raiz, &pedido.raizes_extras)?;
    let args = argumentos(pedido.ia, &raiz, &extras, &schema, &arquivos);
    let saida = processo::executar(programa, &args, &raiz, Some(&pedido.prompt), LIMITE)?;
    match pedido.ia {
        Ia::ClaudeCode => Ok(saida.stdout),
        Ia::Codex => Ok(fs::read_to_string(&arquivos.resposta)?),
    }
}

/// As raízes dos outros repositórios: pastas que existem, canônicas e diferentes da principal.
fn validar_extras(raiz: &Path, extras: &[String]) -> Resultado<Vec<PathBuf>> {
    let mut vistas = vec![raiz.to_path_buf()];
    for extra in extras {
        let canonica = projeto::validar_raiz(extra)?;
        if vistas.contains(&canonica) {
            return Err(Erro::RaizInvalida(extra.clone()));
        }
        vistas.push(canonica);
    }
    Ok(vistas.split_off(1))
}

/// O comando como o Jogador o vê no aviso "O Mestre só pode LER": os mesmos argumentos de
/// `argumentos`, com as pastas reais e o schema e os arquivos de apoio como marcadores.
pub fn comando_para_exibir(ia: Ia, raiz: &str, extras: &[String]) -> Resultado<String> {
    let raiz = projeto::validar_raiz(raiz)?;
    let extras = validar_extras(&raiz, extras)?;
    let arquivos = Arquivos {
        schema: PathBuf::from("<schema.json>"),
        resposta: PathBuf::from("<resposta.json>"),
    };
    let args = argumentos(ia, &raiz, &extras, "<schema>", &arquivos);
    let mut partes = vec![ia.executavel().to_owned()];
    partes.extend(args.iter().map(|a| citar(&a.to_string_lossy())));
    Ok(format!("{} < <prompt>", partes.join(" ")))
}

/// Aspas só onde o shell precisaria delas.
fn citar(arg: &str) -> String {
    let simples = !arg.is_empty()
        && arg
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || "-_./,=:<>\\".contains(c));
    if simples {
        arg.to_owned()
    } else {
        format!("'{}'", arg.replace('\'', "'\\''"))
    }
}

/// As opções longas que o modo restrito usa: a CLI precisa conhecer todas.
pub fn opcoes_exigidas(ia: Ia) -> Vec<String> {
    let arquivos = Arquivos {
        schema: PathBuf::from("s"),
        resposta: PathBuf::from("r"),
    };
    let extra = [PathBuf::from("/extra")];
    let mut opcoes: Vec<String> = Vec::new();
    for a in argumentos(ia, Path::new("/p"), &extra, "{}", &arquivos) {
        if let Ok(a) = a.into_string() {
            if a.starts_with("--") && !opcoes.contains(&a) {
                opcoes.push(a);
            }
        }
    }
    opcoes
}

/// Os argumentos fixos da ajuda onde as opções aparecem (no Codex, a do subcomando `exec`).
fn argumentos_da_ajuda(ia: Ia) -> &'static [&'static str] {
    match ia {
        Ia::ClaudeCode => &["--help"],
        Ia::Codex => &["exec", "--help"],
    }
}

/// O que a Nova Aventura mostra sobre uma CLI.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "estado", rename_all = "snake_case")]
pub enum Deteccao {
    /// Não está no PATH.
    Ausente,
    /// Existe, mas não tem todas as opções do modo restrito: o Jogo recusa.
    SemModoRestrito {
        versao: String,
        faltando: Vec<String>,
    },
    Pronta {
        versao: String,
    },
}

const LIMITE_DA_DETECCAO: Duration = Duration::from_secs(20);

/// `<cli> --version` e a ajuda, com argumentos fixos, na pasta temporária (nunca no Projeto).
pub fn detectar(ia: Ia) -> Resultado<Deteccao> {
    match processo::achar_no_path(ia.executavel()) {
        None => Ok(Deteccao::Ausente),
        Some(programa) => detectar_com(&programa, ia),
    }
}

fn detectar_com(programa: &Path, ia: Ia) -> Resultado<Deteccao> {
    let pasta = std::env::temp_dir();
    let rodar = |args: &[&str]| {
        let args: Vec<OsString> = args.iter().map(OsString::from).collect();
        processo::executar(programa, &args, &pasta, None, LIMITE_DA_DETECCAO).map(|s| s.stdout)
    };
    let versao = rodar(&["--version"])?.trim().to_owned();
    let ajuda = rodar(argumentos_da_ajuda(ia))?;
    Ok(avaliar(ia, versao, &ajuda))
}

fn avaliar(ia: Ia, versao: String, ajuda: &str) -> Deteccao {
    let conhecidas: Vec<&str> = ajuda
        .split(|c: char| !(c.is_ascii_alphanumeric() || c == '-'))
        .collect();
    let faltando: Vec<String> = opcoes_exigidas(ia)
        .into_iter()
        .filter(|o| !conhecidas.contains(&o.as_str()))
        .collect();
    if faltando.is_empty() {
        Deteccao::Pronta { versao }
    } else {
        Deteccao::SemModoRestrito { versao, faltando }
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
            &[],
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
            &[],
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
            let args = texto(argumentos(ia, Path::new("/p"), &[], "{}", &arquivos()));
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
            raizes_extras: vec![],
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

    #[test]
    fn os_outros_repositorios_entram_so_com_add_dir() {
        let extras = [PathBuf::from("/loja-api")];
        let claude = texto(argumentos(
            Ia::ClaudeCode,
            Path::new("/loja-front"),
            &extras,
            "{}",
            &arquivos(),
        ));
        assert_eq!(claude[claude.len() - 2..], ["--add-dir", "/loja-api"]);
        // O sandbox read-only do Codex já lê fora da pasta: nada muda.
        let codex = texto(argumentos(
            Ia::Codex,
            Path::new("/loja-front"),
            &extras,
            "{}",
            &arquivos(),
        ));
        assert!(!codex.iter().any(|a| a == "--add-dir"));
    }

    #[test]
    fn raizes_extras_validas_e_sem_repeticao() {
        let base = std::env::temp_dir().join(format!("quiz-extras-{}", std::process::id()));
        let (a, b) = (base.join("a"), base.join("b"));
        fs::create_dir_all(&a).unwrap();
        fs::create_dir_all(&b).unwrap();
        let raiz = projeto::validar_raiz(a.to_str().unwrap()).unwrap();
        let s = |p: &Path| p.to_str().unwrap().to_owned();
        assert_eq!(
            validar_extras(&raiz, &[s(&b)]).unwrap(),
            [dunce::canonicalize(&b).unwrap()]
        );
        for ruim in [s(&a), s(&base.join("nao-existe")), String::new()] {
            assert!(
                validar_extras(&raiz, std::slice::from_ref(&ruim)).is_err(),
                "{ruim}"
            );
        }
        assert!(validar_extras(&raiz, &[s(&b), s(&b)]).is_err());
    }

    #[test]
    fn o_comando_exibido_e_o_mesmo_que_roda() {
        let raiz = std::env::temp_dir();
        let r = raiz.to_str().unwrap();
        let exibido = comando_para_exibir(Ia::ClaudeCode, r, &[]).unwrap();
        assert_eq!(
            exibido,
            "claude -p --output-format json --json-schema <schema> --tools Read,Grep,Glob \
             --allowedTools Read,Grep,Glob --strict-mcp-config --no-session-persistence < <prompt>"
        );
        let codex = comando_para_exibir(Ia::Codex, r, &[]).unwrap();
        assert!(
            codex.starts_with("codex exec --sandbox read-only"),
            "{codex}"
        );
        assert!(codex.contains("--output-schema <schema.json>"), "{codex}");
        assert!(comando_para_exibir(Ia::ClaudeCode, "/nao/existe", &[]).is_err());
    }

    #[test]
    fn citar_poe_aspas_so_quando_precisa() {
        assert_eq!(citar("Read,Grep,Glob"), "Read,Grep,Glob");
        assert_eq!(citar("/minha pasta"), "'/minha pasta'");
        assert_eq!(citar("it's"), "'it'\\''s'");
    }

    #[test]
    fn recusa_cli_sem_as_opcoes_do_modo_restrito() {
        let exigidas = opcoes_exigidas(Ia::ClaudeCode);
        assert!(exigidas.contains(&"--tools".to_owned()));
        assert!(exigidas.contains(&"--json-schema".to_owned()));
        assert!(exigidas.contains(&"--add-dir".to_owned()));
        let completa =
            "Options:\n  --allowedTools, --allowed-tools <tools...>\n  --tools <tools...>\n\
            --json-schema <schema>\n  -p, --print\n  --output-format <format>\n\
            --strict-mcp-config\n  --no-session-persistence\n  --add-dir <dirs...>";
        assert_eq!(
            avaliar(Ia::ClaudeCode, "2.1.310".into(), completa),
            Deteccao::Pronta {
                versao: "2.1.310".into()
            }
        );
        let antiga =
            "Options:\n  --allowedTools <tools...>\n  -p, --print\n  --output-format\n  --add-dir";
        assert_eq!(
            avaliar(Ia::ClaudeCode, "1.0.0".into(), antiga),
            Deteccao::SemModoRestrito {
                versao: "1.0.0".into(),
                faltando: vec![
                    "--json-schema".into(),
                    "--tools".into(),
                    "--strict-mcp-config".into(),
                    "--no-session-persistence".into()
                ]
            }
        );
    }

    /// Uma CLI de mentira que só sabe dizer a versão e a ajuda.
    #[cfg(unix)]
    #[test]
    fn detecta_pela_versao_e_pela_ajuda() {
        use std::os::unix::fs::PermissionsExt;
        let pasta = std::env::temp_dir().join(format!("quiz-detecta-{}", std::process::id()));
        let _ = fs::remove_dir_all(&pasta);
        fs::create_dir_all(&pasta).unwrap();
        let falso = pasta.join("claude");
        fs::write(
            &falso,
            "#!/bin/sh\n\
             if [ \"$1\" = --version ]; then echo '9.9.9 (Claude Code)'; exit 0; fi\n\
             echo '--tools --allowedTools --json-schema --output-format --strict-mcp-config'\n\
             echo '--no-session-persistence --add-dir -p'\n",
        )
        .unwrap();
        fs::set_permissions(&falso, fs::Permissions::from_mode(0o755)).unwrap();
        let r = loop {
            match detectar_com(&falso, Ia::ClaudeCode) {
                Err(Erro::Io(e)) if e.contains("busy") => std::thread::yield_now(),
                r => break r,
            }
        };
        assert_eq!(
            r.unwrap(),
            Deteccao::Pronta {
                versao: "9.9.9 (Claude Code)".into()
            }
        );
    }
}
