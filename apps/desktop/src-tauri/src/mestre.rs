//! A CLI do Mestre em modo headless e somente leitura (spec §7, docs/contrato-mestre.md).
//!
//! Os argumentos são fixos e montados aqui: a interface escolhe só a IA e manda o prompt e o
//! JSON Schema como dados. O prompt vai pelo stdin, nunca na linha de comando.

use std::ffi::OsString;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::Duration;

use serde::{Deserialize, Serialize};

use crate::erro::{Erro, Resultado};
use crate::processo;
use crate::raizes::Raizes;

/// Ler um Projeto grande para criar a Aventura leva minutos; mais que isso é travamento.
const LIMITE: Duration = Duration::from_secs(20 * 60);

/// As IAs que validam JSON Schema e têm modo somente leitura.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Deserialize)]
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
pub fn rodar(pedido: &PedidoMestre, raizes: &Raizes) -> Resultado<String> {
    let programa = processo::achar_no_path(pedido.ia.executavel())
        .ok_or_else(|| Erro::MestreAusente(pedido.ia.executavel().into()))?;
    rodar_com(&programa, pedido, raizes, &DETECCOES)
}

fn rodar_com(
    programa: &Path,
    pedido: &PedidoMestre,
    raizes: &Raizes,
    deteccoes: &Deteccoes,
) -> Resultado<String> {
    let raiz = raizes.conferir(&pedido.raiz)?;
    let extras = validar_extras(raizes, &raiz, &pedido.raizes_extras)?;
    if !pedido.schema.is_object() {
        return Err(Erro::ArgumentoRecusado("schema".into()));
    }
    // A Nova Aventura só oferece CLI com modo restrito, mas quem roda confere de novo.
    if let Deteccao::SemModoRestrito { faltando, .. } = deteccoes.da_sessao(pedido.ia, programa)? {
        return Err(Erro::SemModoRestrito { faltando });
    }
    let schema = pedido.schema.to_string();
    let pasta = PastaTemporaria::nova()?;
    let arquivos = Arquivos {
        schema: pasta.caminho().join("schema.json"),
        resposta: pasta.caminho().join("resposta.json"),
    };
    if pedido.ia == Ia::Codex {
        gravar_novo(&arquivos.schema, &schema)?;
    }
    let args = argumentos(pedido.ia, &raiz, &extras, &schema, &arquivos);
    let saida = processo::executar(programa, &args, &raiz, Some(&pedido.prompt), LIMITE)?;
    match pedido.ia {
        Ia::ClaudeCode => Ok(saida.stdout),
        // Sem última mensagem, a resposta é vazia: o Jogo recusa e tenta de novo.
        Ia::Codex => match fs::read_to_string(&arquivos.resposta) {
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(String::new()),
            r => Ok(r?),
        },
    }
}

/// Cria `caminho` e grava `conteudo`; recusa se já existe algo ali (arquivo ou symlink plantado).
fn gravar_novo(caminho: &Path, conteudo: &str) -> std::io::Result<()> {
    fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(caminho)?
        .write_all(conteudo.as_bytes())
}

/// As raízes dos outros repositórios: pastas permitidas, canônicas e diferentes da principal.
fn validar_extras(raizes: &Raizes, raiz: &Path, extras: &[String]) -> Resultado<Vec<PathBuf>> {
    let mut vistas = vec![raiz.to_path_buf()];
    for extra in extras {
        let canonica = raizes.conferir(extra)?;
        if vistas.contains(&canonica) {
            return Err(Erro::RaizInvalida(extra.clone()));
        }
        vistas.push(canonica);
    }
    Ok(vistas.split_off(1))
}

/// O comando como o Jogador o vê no aviso "O Mestre só pode LER": os mesmos argumentos de
/// `argumentos`, com as pastas reais e o schema e os arquivos de apoio como marcadores.
pub fn comando_para_exibir(
    raizes: &Raizes,
    ia: Ia,
    raiz: &str,
    extras: &[String],
) -> Resultado<String> {
    let raiz = raizes.conferir(raiz)?;
    let extras = validar_extras(raizes, &raiz, extras)?;
    let arquivos = Arquivos {
        schema: PathBuf::from("<schema.json>"),
        resposta: PathBuf::from("<resposta.json>"),
    };
    let args = argumentos(ia, &raiz, &extras, "<schema>", &arquivos);
    let mut partes = vec![ia.executavel().to_owned()];
    partes.extend(
        args.iter()
            .map(|a| citar(&a.to_string_lossy(), cfg!(windows))),
    );
    Ok(format!("{} < <prompt>", partes.join(" ")))
}

/// Aspas só onde o shell precisaria delas: no Windows, as aspas duplas do cmd/PowerShell (com `\"`
/// para a aspa dentro, como o Windows separa os argumentos); fora dele, as simples do sh.
fn citar(arg: &str, windows: bool) -> String {
    let permitidos: &str = if windows { "-_./,=:<>\\" } else { "-_./,=:<>" };
    let simples = !arg.is_empty()
        && arg
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || permitidos.contains(c));
    if simples {
        arg.to_owned()
    } else if windows {
        let mut saida = String::from('"');
        let mut barras = 0;
        for c in arg.chars() {
            match c {
                '\\' => barras += 1,
                '"' => {
                    // Barras antes de uma aspa dobram, e a aspa ganha a sua.
                    saida.push_str(&"\\".repeat(barras * 2 + 1));
                    saida.push('"');
                    barras = 0;
                }
                _ => {
                    saida.push_str(&"\\".repeat(barras));
                    saida.push(c);
                    barras = 0;
                }
            }
        }
        // As barras do fim dobram: senão escapariam a aspa que fecha.
        saida.push_str(&"\\".repeat(barras * 2));
        saida.push('"');
        saida
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

/// Os valores do modo restrito que a ajuda precisa listar (no Codex, o sandbox somente leitura).
fn valores_exigidos(ia: Ia) -> &'static [&'static str] {
    match ia {
        Ia::ClaudeCode => &[],
        Ia::Codex => &["read-only"],
    }
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
        Some(programa) => {
            // Detectar de novo (o Jogador pode ter atualizado a CLI) renova o que o
            // `rodar_mestre` usa.
            let d = detectar_com(&programa, ia)?;
            DETECCOES.guardar(ia, &programa, &d);
            Ok(d)
        }
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
        .chain(valores_exigidos(ia).iter().map(|v| (*v).to_owned()))
        .filter(|o| !conhecidas.contains(&o.as_str()))
        .collect();
    if faltando.is_empty() {
        Deteccao::Pronta { versao }
    } else {
        Deteccao::SemModoRestrito { versao, faltando }
    }
}

/// A pasta temporária desta chamada: nome aleatório, criada com exclusividade (ninguém a
/// pré-cria para plantar symlinks ou uma resposta falsa) e, no Unix, só do usuário (0700). Some
/// ao sair do escopo, com o que tiver dentro.
struct PastaTemporaria(tempfile::TempDir);

impl PastaTemporaria {
    fn nova() -> Resultado<Self> {
        let mut construtor = tempfile::Builder::new();
        construtor.prefix("quiz-your-slop-mestre-");
        // Sem isto, a pasta nasce com o umask (0755 em geral): legível por outros usuários.
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            construtor.permissions(fs::Permissions::from_mode(0o700));
        }
        Ok(Self(construtor.tempdir()?))
    }

    fn caminho(&self) -> &Path {
        self.0.path()
    }
}

/// O resultado da detecção de cada CLI nesta sessão, para o `rodar_mestre` não refazer a ajuda a
/// cada chamada. Vale para o executável detectado: outro no PATH é detectado de novo.
#[derive(Default)]
pub struct Deteccoes(Mutex<Vec<(Ia, PathBuf, Deteccao)>>);

static DETECCOES: Deteccoes = Deteccoes::nova();

impl Deteccoes {
    pub const fn nova() -> Self {
        Self(Mutex::new(Vec::new()))
    }

    fn guardar(&self, ia: Ia, programa: &Path, deteccao: &Deteccao) {
        let mut lista = self.0.lock().unwrap_or_else(|e| e.into_inner());
        lista.retain(|(i, _, _)| *i != ia);
        lista.push((ia, programa.to_path_buf(), deteccao.clone()));
    }

    /// A detecção guardada de `programa`, ou uma nova (que fica guardada).
    fn da_sessao(&self, ia: Ia, programa: &Path) -> Resultado<Deteccao> {
        let guardada = self
            .0
            .lock()
            .unwrap_or_else(|e| e.into_inner())
            .iter()
            .find(|(i, p, _)| *i == ia && p == programa)
            .map(|(_, _, d)| d.clone());
        if let Some(d) = guardada {
            return Ok(d);
        }
        let d = detectar_com(programa, ia)?;
        self.guardar(ia, programa, &d);
        Ok(d)
    }
}

#[cfg(test)]
mod testes {
    use super::*;
    use crate::projeto;
    use std::sync::atomic::{AtomicU32, Ordering};

    /// As raízes dadas, como se o Jogador as tivesse escolhido.
    fn permitidas(raizes: &[&Path]) -> Raizes {
        let r = Raizes::nova();
        for raiz in raizes {
            r.permitir(raiz.to_str().unwrap());
        }
        r
    }

    /// `programa` já detectado com o modo restrito, para as duas IAs.
    fn prontas(programa: &Path) -> Deteccoes {
        let d = Deteccoes::nova();
        for ia in [Ia::ClaudeCode, Ia::Codex] {
            d.guardar(
                ia,
                programa,
                &Deteccao::Pronta {
                    versao: "teste".into(),
                },
            );
        }
        d
    }

    /// `rodar_com` com a raiz do pedido permitida e a CLI já detectada como pronta.
    fn rodar_pronto(programa: &Path, pedido: &PedidoMestre) -> Resultado<String> {
        let raizes = permitidas(&[Path::new(&pedido.raiz)]);
        rodar_com(programa, pedido, &raizes, &prontas(programa))
    }

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
        let r = rodar_pronto(
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
            match rodar_pronto(&falso, &pedido(ia, &pasta, schema.clone())) {
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
        let raizes = permitidas(&[&a, &b]);
        let validar_extras = |raiz: &Path, extras: &[String]| validar_extras(&raizes, raiz, extras);
        // Uma pasta que existe mas não foi escolhida também fica de fora.
        let c = base.join("c");
        fs::create_dir_all(&c).unwrap();
        assert!(matches!(
            validar_extras(&raiz, &[s(&c)]),
            Err(Erro::RaizNaoPermitida(_))
        ));
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
        assert!(matches!(
            comando_para_exibir(&Raizes::nova(), Ia::ClaudeCode, r, &[]),
            Err(Erro::RaizNaoPermitida(_))
        ));
        let raizes = permitidas(&[&raiz]);
        let comando_para_exibir =
            |ia, r: &str, extras: &[String]| comando_para_exibir(&raizes, ia, r, extras);
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
        let sh = |a: &str| citar(a, false);
        assert_eq!(sh("Read,Grep,Glob"), "Read,Grep,Glob");
        assert_eq!(sh("/minha pasta"), "'/minha pasta'");
        assert_eq!(sh("it's"), "'it'\\''s'");
        // No sh, a barra invertida é escape: vai entre aspas.
        assert_eq!(sh(r"a\b"), r"'a\b'");
    }

    #[test]
    fn no_windows_cita_com_aspas_duplas() {
        let win = |a: &str| citar(a, true);
        assert_eq!(win("Read,Grep,Glob"), "Read,Grep,Glob");
        assert_eq!(win(r"C:\Users\ana\loja"), r"C:\Users\ana\loja");
        assert_eq!(win(r"C:\Minha Pasta\loja"), r#""C:\Minha Pasta\loja""#);
        assert_eq!(win("it's"), r#""it's""#);
        assert_eq!(win(r#"diz "oi""#), r#""diz \"oi\"""#);
        assert_eq!(win(r#"a\"b"#), r#""a\\\"b""#);
        assert_eq!(win(r"pasta com espaço\"), r#""pasta com espaço\\""#);
        assert_eq!(win(""), r#""""#);
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

    /// Recorte da ajuda real do `codex exec --help` (v0.149.1).
    const AJUDA_CODEX: &str = "Usage: codex exec [OPTIONS] [PROMPT]
  -c, --config <key=value>
  -s, --sandbox <SANDBOX_MODE>
          [possible values: read-only, workspace-write, danger-full-access]
  -C, --cd <DIR>
      --add-dir <DIR>
      --ephemeral
      --ignore-rules
      --output-schema <FILE>
      --color <COLOR>
  -o, --output-last-message <FILE>";

    #[test]
    fn codex_precisa_do_sandbox_somente_leitura_e_do_output_schema() {
        assert_eq!(
            avaliar(Ia::Codex, "codex-cli 0.149.1".into(), AJUDA_CODEX),
            Deteccao::Pronta {
                versao: "codex-cli 0.149.1".into()
            }
        );
        let sem_schema = AJUDA_CODEX.replace("--output-schema", "--json");
        assert_eq!(
            avaliar(Ia::Codex, "codex-cli 0.1.0".into(), &sem_schema),
            Deteccao::SemModoRestrito {
                versao: "codex-cli 0.1.0".into(),
                faltando: vec!["--output-schema".into()]
            }
        );
        let sem_read_only = AJUDA_CODEX.replace("read-only, ", "");
        assert_eq!(
            avaliar(Ia::Codex, "x".into(), &sem_read_only),
            Deteccao::SemModoRestrito {
                versao: "x".into(),
                faltando: vec!["read-only".into()]
            }
        );
        // O --add-dir do Codex é de escrita: não está entre as opções exigidas.
        assert!(!opcoes_exigidas(Ia::Codex).contains(&"--add-dir".to_owned()));
    }

    /// Um script de shell de mentira, numa pasta só dele.
    #[cfg(unix)]
    fn script(nome: &str, corpo: &str) -> PathBuf {
        use std::os::unix::fs::PermissionsExt;
        static N: AtomicU32 = AtomicU32::new(0);
        let n = N.fetch_add(1, Ordering::Relaxed);
        let pasta = std::env::temp_dir().join(format!("quiz-cli-{}-{n}", std::process::id()));
        let _ = fs::remove_dir_all(&pasta);
        fs::create_dir_all(&pasta).unwrap();
        let caminho = pasta.join(nome);
        fs::write(&caminho, format!("#!/bin/sh\n{corpo}")).unwrap();
        fs::set_permissions(&caminho, fs::Permissions::from_mode(0o755)).unwrap();
        caminho
    }

    /// Repete enquanto outro teste estiver num fork() com o script aberto ("Text file busy").
    #[cfg(unix)]
    fn sem_busy<T>(mut f: impl FnMut() -> Resultado<T>) -> Resultado<T> {
        loop {
            match f() {
                Err(Erro::Io(e)) if e.contains("busy") => std::thread::yield_now(),
                r => break r,
            }
        }
    }

    #[cfg(unix)]
    #[test]
    fn detecta_o_codex_pela_ajuda_do_exec() {
        let falso = script(
            "codex",
            &format!(
                "if [ \"$1\" = --version ]; then echo 'codex-cli 0.149.1'; exit 0; fi\n\
                 [ \"$1 $2\" = 'exec --help' ] || exit 2\n\
                 cat <<'FIM'\n{AJUDA_CODEX}\nFIM\n"
            ),
        );
        assert_eq!(
            sem_busy(|| detectar_com(&falso, Ia::Codex)).unwrap(),
            Deteccao::Pronta {
                versao: "codex-cli 0.149.1".into()
            }
        );
    }

    /// O schema vai num arquivo temporário que existe durante a chamada e some depois.
    #[cfg(unix)]
    #[test]
    fn o_schema_temporario_do_codex_some_depois_da_chamada() {
        let falso = script(
            "codex",
            "while [ $# -gt 0 ]; do\n\
               case \"$1\" in\n\
                 --output-schema) schema=\"$2\" ;;\n\
                 --output-last-message) saida=\"$2\" ;;\n\
               esac\n\
               shift\n\
             done\n\
             cat >/dev/null\n\
             { echo \"$schema\"; cat \"$schema\"; } > \"$saida\"\n",
        );
        let raiz = std::env::temp_dir();
        let schema = serde_json::json!({ "type": "object", "required": [] });
        let resposta =
            sem_busy(|| rodar_pronto(&falso, &pedido(Ia::Codex, &raiz, schema.clone()))).unwrap();
        let (caminho, conteudo) = resposta.split_once('\n').unwrap();
        assert_eq!(conteudo.trim(), schema.to_string());
        let caminho = Path::new(caminho);
        assert!(caminho.ends_with("schema.json"), "{caminho:?}");
        assert!(!caminho.exists());
        assert!(!caminho.parent().unwrap().exists());
    }

    #[cfg(unix)]
    #[test]
    fn a_pasta_temporaria_some_mesmo_quando_o_codex_falha() {
        let falso = script(
            "codex",
            "while [ $# -gt 0 ]; do\n\
               [ \"$1\" = --output-schema ] && echo \"$2\" >&2\n\
               shift\n\
             done\n\
             exit 1\n",
        );
        let raiz = std::env::temp_dir();
        let schema = serde_json::json!({ "type": "object" });
        let erro = sem_busy(|| rodar_pronto(&falso, &pedido(Ia::Codex, &raiz, schema.clone())))
            .unwrap_err();
        let Erro::Falhou { stderr, .. } = erro else {
            panic!("{erro:?}")
        };
        assert!(stderr.trim().ends_with("schema.json"), "{stderr}");
        assert!(!Path::new(stderr.trim()).exists(), "{stderr}");
    }

    #[cfg(unix)]
    #[test]
    fn codex_sem_ultima_mensagem_devolve_vazio() {
        let falso = script("codex", "cat >/dev/null\n");
        let raiz = std::env::temp_dir();
        let schema = serde_json::json!({ "type": "object" });
        let r = sem_busy(|| rodar_pronto(&falso, &pedido(Ia::Codex, &raiz, schema.clone())));
        assert_eq!(r.unwrap(), "");
    }

    /// Duas chamadas não usam a mesma pasta, o nome não dá para prever pelo pid e, no Unix, só o
    /// usuário entra nela.
    #[test]
    fn a_pasta_temporaria_e_privada_e_imprevisivel() {
        let (a, b) = (
            PastaTemporaria::nova().unwrap(),
            PastaTemporaria::nova().unwrap(),
        );
        assert_ne!(a.caminho(), b.caminho());
        let nome = a.caminho().file_name().unwrap().to_str().unwrap();
        assert!(nome.starts_with("quiz-your-slop-mestre-"), "{nome}");
        assert!(!nome.contains(&std::process::id().to_string()), "{nome}");
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let modo = fs::metadata(a.caminho()).unwrap().permissions().mode();
            assert_eq!(modo & 0o777, 0o700);
        }
        let caminho = a.caminho().to_path_buf();
        drop(a);
        assert!(!caminho.exists());
    }

    /// O schema é gravado num arquivo novo: um symlink (ou arquivo) já plantado ali é recusado e o
    /// alvo fica intocado.
    #[cfg(unix)]
    #[test]
    fn o_schema_nao_segue_symlink_plantado() {
        let pasta = PastaTemporaria::nova().unwrap();
        let alvo = pasta.caminho().join("alvo");
        fs::write(&alvo, "original").unwrap();
        let schema = pasta.caminho().join("schema.json");
        std::os::unix::fs::symlink(&alvo, &schema).unwrap();
        assert!(gravar_novo(&schema, "{}").is_err());
        assert_eq!(fs::read_to_string(&alvo).unwrap(), "original");
        let novo = pasta.caminho().join("novo.json");
        gravar_novo(&novo, "{}").unwrap();
        assert_eq!(fs::read_to_string(&novo).unwrap(), "{}");
        assert!(gravar_novo(&novo, "[]").is_err());
    }

    #[test]
    fn recusa_raiz_que_o_jogador_nao_escolheu() {
        let raiz = std::env::temp_dir();
        let falso = Path::new("/nao/existe");
        let p = pedido(
            Ia::ClaudeCode,
            &raiz,
            serde_json::json!({ "type": "object" }),
        );
        assert!(matches!(
            rodar_com(falso, &p, &Raizes::nova(), &prontas(falso)),
            Err(Erro::RaizNaoPermitida(_))
        ));
        let mut com_extra = p.clone();
        com_extra.raizes_extras = vec!["/home/u".into()];
        let raizes = permitidas(&[&raiz]);
        assert!(rodar_com(falso, &com_extra, &raizes, &prontas(falso)).is_err());
    }

    /// Uma CLI de mentira que conta quantas vezes a ajuda foi pedida e anota se o prompt chegou.
    #[cfg(unix)]
    fn cli_contada(ajuda: &str) -> (PathBuf, PathBuf) {
        static N: AtomicU32 = AtomicU32::new(0);
        let n = N.fetch_add(1, Ordering::Relaxed);
        let anotacoes =
            std::env::temp_dir().join(format!("quiz-cli-contada-{}-{n}", std::process::id()));
        let _ = fs::remove_dir_all(&anotacoes);
        fs::create_dir_all(&anotacoes).unwrap();
        let a = anotacoes.to_str().unwrap();
        let falso = script(
            "claude",
            &format!(
                "if [ \"$1\" = --version ]; then echo '9.9.9'; exit 0; fi\n\
                 if [ \"$1\" = --help ]; then echo x >> '{a}/ajuda'; echo '{ajuda}'; exit 0; fi\n\
                 cat > '{a}/prompt'; echo resposta\n"
            ),
        );
        (falso, anotacoes)
    }

    #[cfg(unix)]
    #[test]
    fn recusa_rodar_cli_sem_modo_restrito() {
        let (falso, anotacoes) = cli_contada("--allowedTools -p --output-format --add-dir");
        let raiz = std::env::temp_dir();
        let raizes = permitidas(&[&raiz]);
        let deteccoes = Deteccoes::nova();
        let p = pedido(
            Ia::ClaudeCode,
            &raiz,
            serde_json::json!({ "type": "object" }),
        );
        let erro = sem_busy(|| rodar_com(&falso, &p, &raizes, &deteccoes)).unwrap_err();
        let Erro::SemModoRestrito { faltando } = erro else {
            panic!("{erro:?}")
        };
        assert!(faltando.contains(&"--tools".to_owned()), "{faltando:?}");
        assert!(
            !anotacoes.join("prompt").exists(),
            "o prompt não pode chegar à CLI"
        );
    }

    #[cfg(unix)]
    #[test]
    fn a_deteccao_do_rodar_vale_pela_sessao() {
        let (falso, anotacoes) = cli_contada(
            "--tools --allowedTools --json-schema --output-format --strict-mcp-config \
             --no-session-persistence --add-dir -p",
        );
        let raiz = std::env::temp_dir();
        let raizes = permitidas(&[&raiz]);
        let deteccoes = Deteccoes::nova();
        let p = pedido(
            Ia::ClaudeCode,
            &raiz,
            serde_json::json!({ "type": "object" }),
        );
        for _ in 0..3 {
            let r = sem_busy(|| rodar_com(&falso, &p, &raizes, &deteccoes)).unwrap();
            assert_eq!(r.trim(), "resposta");
        }
        assert_eq!(fs::read_to_string(anotacoes.join("ajuda")).unwrap(), "x\n");
        assert_eq!(
            fs::read_to_string(anotacoes.join("prompt")).unwrap(),
            "prompt do Mestre"
        );
    }

    /// As CLIs instaladas nesta máquina: `cargo test -- --ignored detecta_as_clis_de_verdade`.
    #[test]
    #[ignore = "precisa do Claude Code e do Codex instalados"]
    fn detecta_as_clis_de_verdade() {
        for ia in [Ia::ClaudeCode, Ia::Codex] {
            let d = detectar(ia).unwrap();
            assert!(matches!(d, Deteccao::Pronta { .. }), "{ia:?}: {d:?}");
        }
    }
}
