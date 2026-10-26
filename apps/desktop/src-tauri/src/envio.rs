//! O envio de progresso ao site (spec §8, §10): só números e ids opacos, com o token do chaveiro,
//! que nunca chega à interface. O Jogo não depende do site para jogar: sem rede, o envio fica
//! pendente e sai depois.
//!
//! A fila é um arquivo só, `<dados do app>/progresso/pendente.json`: como o site junta pelo maior
//! XP e estatísticas e, por Aventura, pelo último envio, só o resumo mais novo importa — um envio
//! antigo que não saiu já está contido no seguinte. Ao lado ficam `ultimo-envio.json` (o JSON
//! exato e a hora do último envio aceito, para a tela "O que é enviado") e `servidor.json` (o
//! progresso que o site devolveu por último, a base do XP do Jogador quando não há rede).
//!
//! O corpo chega da interface (montado por `montarEnvio`) e é relido aqui contra a mesma lista
//! permitida (`deny_unknown_fields`): o que vai para o site é esta struct serializada de novo,
//! então nenhum campo a mais passa, nem por engano.

use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use tauri::AppHandle;

use crate::comum::{em_segundo_plano, gravar_atomico, pasta_de_dados};

use crate::login::{cofre, site, ErroDeLogin};

/// XP e estatísticas vão para colunas `integer` do Postgres.
const INTEIRO_MAXIMO: u32 = i32::MAX as u32;
const MAXIMO_DE_AVENTURAS: usize = 100;
/// O mesmo limite de corpo do site.
pub const TAMANHO_MAXIMO: usize = 16_384;
const TITULO_MAXIMO: usize = 64;

const PASTA: &str = "progresso";
const PENDENTE: &str = "pendente.json";
const ULTIMO: &str = "ultimo-envio.json";
const SERVIDOR: &str = "servidor.json";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Classe {
    Backend,
    Frontend,
    Fullstack,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Estatisticas {
    pub expedicoes: u32,
    pub acertos: u32,
    pub contestacoes_vencidas: u32,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct AventuraEnviada {
    pub id: String,
    pub progresso: u8,
    pub classe: Classe,
}

/// O envio, na ordem de campos do `montarEnvio`: a serialização dá o mesmo JSON.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Envio {
    pub xp: u32,
    pub titulo: String,
    pub estatisticas: Estatisticas,
    pub aventuras: Vec<AventuraEnviada>,
}

fn recusa(motivo: &str) -> ErroDeLogin {
    ErroDeLogin::ArgumentoRecusado(motivo.into())
}

fn ehid(id: &str) -> bool {
    id == "tutorial" || crate::aventuras::validar_id(id).is_ok()
}

/// Relê o JSON contra a lista permitida (a conferência do Título contra o XP fica com o site).
pub fn ler(json: &str) -> Result<Envio, ErroDeLogin> {
    if json.len() > TAMANHO_MAXIMO {
        return Err(recusa("envio grande demais"));
    }
    let envio: Envio = serde_json::from_str(json).map_err(|e| recusa(&e.to_string()))?;
    let e = &envio.estatisticas;
    let contagens = [envio.xp, e.expedicoes, e.acertos, e.contestacoes_vencidas];
    if contagens.iter().any(|&n| n > INTEIRO_MAXIMO) {
        return Err(recusa("contagem grande demais"));
    }
    if e.contestacoes_vencidas > e.acertos {
        return Err(recusa("contestações vencidas já contam como acertos"));
    }
    let titulo = envio.titulo.chars().count();
    if titulo == 0 || titulo > TITULO_MAXIMO || envio.titulo.chars().any(char::is_control) {
        return Err(recusa("titulo"));
    }
    if envio.aventuras.len() > MAXIMO_DE_AVENTURAS {
        return Err(recusa("aventuras demais"));
    }
    let mut ids = std::collections::HashSet::new();
    for a in &envio.aventuras {
        if !ehid(&a.id) || a.progresso > 100 || !ids.insert(a.id.as_str()) {
            return Err(recusa("aventura"));
        }
    }
    Ok(envio)
}

/// O site já tem tudo o que este envio traria? (XP e estatísticas só sobem; cada Aventura igual.)
pub fn ja_contido(servidor: &Envio, envio: &Envio) -> bool {
    let (s, e) = (&servidor.estatisticas, &envio.estatisticas);
    envio.xp <= servidor.xp
        && e.expedicoes <= s.expedicoes
        && e.acertos <= s.acertos
        && e.contestacoes_vencidas <= s.contestacoes_vencidas
        && envio
            .aventuras
            .iter()
            .all(|a| servidor.aventuras.contains(a))
}

// Arquivos ------------------------------------------------------------------------------------

fn caminho(base: &Path, nome: &str) -> PathBuf {
    base.join(PASTA).join(nome)
}

fn gravar(base: &Path, nome: &str, conteudo: &str) -> Result<(), ErroDeLogin> {
    Ok(gravar_atomico(&caminho(base, nome), conteudo)?)
}

fn ler_arquivo(base: &Path, nome: &str) -> Result<Option<String>, ErroDeLogin> {
    match fs::read_to_string(caminho(base, nome)) {
        Ok(texto) => Ok(Some(texto)),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(e.into()),
    }
}

fn apagar(base: &Path, nome: &str) -> Result<(), ErroDeLogin> {
    match fs::remove_file(caminho(base, nome)) {
        Ok(()) => Ok(()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(e) => Err(e.into()),
    }
}

/// O envio pendente, se há um (e ainda passa na lista permitida).
pub fn pendente(base: &Path) -> Result<Option<String>, ErroDeLogin> {
    Ok(ler_arquivo(base, PENDENTE)?.filter(|j| ler(j).is_ok()))
}

/// O último envio aceito pelo site: o JSON exato e quando (ms desde 1970).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct UltimoEnvio {
    pub json: String,
    pub em: u64,
}

/// O que a tela "O que é enviado" mostra.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct EstadoDoEnvio {
    pub ultimo: Option<UltimoEnvio>,
    /// O envio que espera o site (sem rede ou sem conta).
    pub pendente: Option<String>,
    /// O progresso que o site devolveu por último.
    pub servidor: Option<Envio>,
}

pub fn estado(base: &Path) -> Result<EstadoDoEnvio, ErroDeLogin> {
    let ultimo = ler_arquivo(base, ULTIMO)?
        .and_then(|t| serde_json::from_str::<UltimoEnvio>(&t).ok())
        .filter(|u| ler(&u.json).is_ok());
    let servidor = ler_arquivo(base, SERVIDOR)?.and_then(|t| ler(&t).ok());
    Ok(EstadoDoEnvio {
        ultimo,
        pendente: pendente(base)?,
        servidor,
    })
}

// Sincronia -----------------------------------------------------------------------------------

/// O desfecho de uma sincronia, como a interface o vê.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "estado", rename_all = "snake_case")]
pub enum Sincronia {
    /// O site respondeu: `progresso` é o dele, já mesclado; `enviado` diz se houve PUT (sem nada
    /// novo, só se leu).
    Sincronizado { progresso: Envio, enviado: bool },
    /// O site não respondeu (ou caiu): o envio ficou pendente.
    SemRede,
    /// Sem conta conectada (ou o token venceu): o envio ficou pendente até o login.
    Desconectado,
}

fn agora_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

/// Falha de rede ou do site fora do ar fica para depois; 401 é token que não serve mais.
fn adiar(erro: ErroDeLogin) -> Result<Sincronia, ErroDeLogin> {
    match erro {
        ErroDeLogin::Rede(_) => Ok(Sincronia::SemRede),
        ErroDeLogin::Site { status } if status >= 500 => Ok(Sincronia::SemRede),
        ErroDeLogin::Site { status: 401 } => Ok(Sincronia::Desconectado),
        outro => Err(outro),
    }
}

fn do_site(corpo: &str) -> Result<Envio, ErroDeLogin> {
    ler(corpo).map_err(|_| ErroDeLogin::Io("o site respondeu fora do formato".into()))
}

/// Grava o envio como pendente e tenta entregá-lo: lê o progresso do site e só envia (PUT) se
/// houver algo novo. Deu certo, a fila esvazia e o envio vira o "último envio".
pub fn sincronizar(
    base: &Path,
    json: &str,
    origem: &str,
    token: Option<&str>,
) -> Result<Sincronia, ErroDeLogin> {
    let envio = ler(json)?;
    let exato = serde_json::to_string(&envio).map_err(|e| ErroDeLogin::Io(e.to_string()))?;
    gravar(base, PENDENTE, &exato)?;
    let Some(token) = token else {
        return Ok(Sincronia::Desconectado);
    };
    let servidor = match site::ler_progresso(origem, token) {
        Ok(corpo) => do_site(&corpo)?,
        Err(e) => return adiar(e),
    };
    let (progresso, enviado) = if ja_contido(&servidor, &envio) {
        (servidor, false)
    } else {
        match site::enviar_progresso(origem, token, &exato) {
            Ok(corpo) => (do_site(&corpo)?, true),
            Err(e) => return adiar(e),
        }
    };
    if enviado {
        let ultimo = UltimoEnvio {
            json: exato,
            em: agora_ms(),
        };
        let texto = serde_json::to_string(&ultimo).map_err(|e| ErroDeLogin::Io(e.to_string()))?;
        gravar(base, ULTIMO, &texto)?;
    }
    let texto = serde_json::to_string(&progresso).map_err(|e| ErroDeLogin::Io(e.to_string()))?;
    gravar(base, SERVIDOR, &texto)?;
    apagar(base, PENDENTE)?;
    Ok(Sincronia::Sincronizado { progresso, enviado })
}

/// Uma sincronia de cada vez: a do fim da Expedição e a periódica não se atropelam na fila.
static TRAVA: Mutex<()> = Mutex::new(());

/// Envia o resumo de progresso (o JSON de `montarEnvio`) ou o deixa pendente.
#[tauri::command]
pub async fn sincronizar_progresso(
    app: AppHandle,
    envio: String,
) -> Result<Sincronia, ErroDeLogin> {
    let base = pasta_de_dados::<ErroDeLogin>(&app)?;
    em_segundo_plano(move || {
        let _vez = TRAVA.lock().unwrap_or_else(|e| e.into_inner());
        let origem = site::origem_valida(site::ORIGEM_PADRAO)?;
        // Sem chaveiro, o envio fica pendente como se não houvesse conta.
        let token = cofre::ler(origem).unwrap_or(None);
        let resultado = sincronizar(&base, &envio, origem, token.as_deref())?;
        if token.is_some() && resultado == Sincronia::Desconectado {
            // O site recusou o token (vencido ou revogado): como no `sessao_atual`, ele sai daqui.
            cofre::apagar(origem)?;
        }
        Ok(resultado)
    })
    .await
}

/// O último envio, o pendente e o último progresso do site, para "O que é enviado".
#[tauri::command]
pub async fn estado_do_envio(app: AppHandle) -> Result<EstadoDoEnvio, ErroDeLogin> {
    let base = pasta_de_dados::<ErroDeLogin>(&app)?;
    em_segundo_plano(move || estado(&base)).await
}

#[cfg(test)]
mod testes {
    use super::*;
    use std::io::{BufRead, BufReader, Read, Write};
    use std::net::{TcpListener, TcpStream};
    use std::thread;

    const ID: &str = "0b7e6c1a-3f2d-4c5e-9a8b-7c6d5e4f3a2b";
    const ENVIO: &str = r#"{"xp":80,"titulo":"Comitador Cego","estatisticas":{"expedicoes":1,"acertos":4,"contestacoes_vencidas":0},"aventuras":[{"id":"0b7e6c1a-3f2d-4c5e-9a8b-7c6d5e4f3a2b","progresso":50,"classe":"backend"}]}"#;
    const ZERADO: &str = r#"{"xp":0,"titulo":"Comitador Cego","estatisticas":{"expedicoes":0,"acertos":0,"contestacoes_vencidas":0},"aventuras":[]}"#;
    const COM_TUTORIAL: &str = r#"{"xp":120,"titulo":"Comitador Cego","estatisticas":{"expedicoes":2,"acertos":6,"contestacoes_vencidas":0},"aventuras":[{"id":"tutorial","progresso":25,"classe":"fullstack"},{"id":"0b7e6c1a-3f2d-4c5e-9a8b-7c6d5e4f3a2b","progresso":50,"classe":"backend"}]}"#;

    fn base(nome: &str) -> PathBuf {
        let b = std::env::temp_dir().join(format!("quiz-envio-{nome}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&b);
        b
    }

    /// Um pedido que o site de mentira recebeu.
    #[derive(Debug)]
    struct Pedido {
        linha: String,
        autorizacao: Option<String>,
        corpo: String,
    }

    fn ler_pedido(conexao: &mut TcpStream) -> Pedido {
        let mut leitor = BufReader::new(conexao.try_clone().unwrap());
        let mut linha = String::new();
        leitor.read_line(&mut linha).unwrap();
        let (mut tamanho, mut autorizacao) = (0usize, None);
        loop {
            let mut cabecalho = String::new();
            leitor.read_line(&mut cabecalho).unwrap();
            let cabecalho = cabecalho.trim_end();
            if cabecalho.is_empty() {
                break;
            }
            let (nome, valor) = cabecalho.split_once(": ").unwrap();
            match nome.to_ascii_lowercase().as_str() {
                "content-length" => tamanho = valor.parse().unwrap(),
                "authorization" => autorizacao = Some(valor.to_string()),
                _ => {}
            }
        }
        let mut corpo = vec![0; tamanho];
        leitor.read_exact(&mut corpo).unwrap();
        Pedido {
            linha: linha.trim_end().into(),
            autorizacao,
            corpo: String::from_utf8(corpo).unwrap(),
        }
    }

    /// Um site de mentira que responde, na ordem, cada `(status, corpo)` e devolve o que recebeu.
    fn site_de_mentira(respostas: Vec<(u16, String)>) -> (String, thread::JoinHandle<Vec<Pedido>>) {
        let ouvinte = TcpListener::bind("127.0.0.1:0").unwrap();
        let origem = format!("http://127.0.0.1:{}", ouvinte.local_addr().unwrap().port());
        let fio = thread::spawn(move || {
            let mut pedidos = vec![];
            for (status, corpo) in respostas {
                let (mut conexao, _) = ouvinte.accept().unwrap();
                pedidos.push(ler_pedido(&mut conexao));
                let resposta = format!(
                    "HTTP/1.1 {status} X\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{corpo}",
                    corpo.len()
                );
                conexao.write_all(resposta.as_bytes()).unwrap();
            }
            pedidos
        });
        (origem, fio)
    }

    /// Uma porta onde ninguém escuta.
    fn porta_fechada() -> String {
        let ouvinte = TcpListener::bind("127.0.0.1:0").unwrap();
        let porta = ouvinte.local_addr().unwrap().port();
        drop(ouvinte);
        format!("http://127.0.0.1:{porta}")
    }

    #[test]
    fn a_lista_permitida_recusa_campo_a_mais_em_qualquer_nivel() {
        assert!(ler(ENVIO).is_ok());
        assert!(ler(COM_TUTORIAL).is_ok());
        for ruim in [
            ENVIO.replace(r#""xp":80"#, r#""xp":80,"repo":"loja""#),
            ENVIO.replace(r#""acertos":4"#, r#""acertos":4,"x":1"#),
            ENVIO.replace(
                r#""classe":"backend""#,
                r#""classe":"backend","nome":"API""#,
            ),
            ENVIO.replace(ID, "loja-api"),
            ENVIO.replace(r#""progresso":50"#, r#""progresso":101"#),
            ENVIO.replace(r#""classe":"backend""#, r#""classe":"mago""#),
            ENVIO.replace(r#""xp":80"#, r#""xp":-1"#),
            ENVIO.replace(r#""xp":80"#, r#""xp":2147483648"#),
            ENVIO.replace(
                r#""contestacoes_vencidas":0"#,
                r#""contestacoes_vencidas":5"#,
            ),
            ENVIO.replace("Comitador Cego", ""),
            "[]".into(),
            "não é json".into(),
            format!(r#"{{"x":"{}"}}"#, "a".repeat(TAMANHO_MAXIMO)),
        ] {
            assert!(ler(&ruim).is_err(), "{ruim}");
        }
        let repetida = ENVIO.replace(
            r#"}]}"#,
            &format!(r#"}},{{"id":"{ID}","progresso":1,"classe":"backend"}}]}}"#),
        );
        assert!(ler(&repetida).is_err());
    }

    #[test]
    fn reserializar_da_o_mesmo_json_do_jogo() {
        assert_eq!(serde_json::to_string(&ler(ENVIO).unwrap()).unwrap(), ENVIO);
    }

    #[test]
    fn ja_contido_quando_o_site_tem_tudo() {
        let (envio, servidor) = (ler(ENVIO).unwrap(), ler(COM_TUTORIAL).unwrap());
        assert!(ja_contido(&servidor, &envio));
        assert!(!ja_contido(&envio, &servidor));
        let mut mudou = envio.clone();
        mudou.aventuras[0].progresso = 40;
        assert!(!ja_contido(&servidor, &mudou));
    }

    #[test]
    fn sem_conta_o_envio_fica_pendente() {
        let b = base("sem-conta");
        assert_eq!(
            sincronizar(&b, ENVIO, "http://127.0.0.1:9", None),
            Ok(Sincronia::Desconectado)
        );
        assert_eq!(pendente(&b).unwrap().as_deref(), Some(ENVIO));
        assert_eq!(estado(&b).unwrap().ultimo, None);
    }

    #[test]
    fn sem_rede_vira_sem_rede_e_o_mais_novo_fica_na_fila() {
        let b = base("sem-rede");
        let fechada = porta_fechada();
        assert_eq!(
            sincronizar(&b, ZERADO, &fechada, Some("qys_x")),
            Ok(Sincronia::SemRede)
        );
        assert_eq!(
            sincronizar(&b, ENVIO, &fechada, Some("qys_x")),
            Ok(Sincronia::SemRede)
        );
        // Um arquivo só: o mais novo.
        assert_eq!(pendente(&b).unwrap().as_deref(), Some(ENVIO));
        assert_eq!(fs::read_dir(b.join(PASTA)).unwrap().count(), 1);
    }

    #[test]
    fn site_fora_do_ar_tambem_e_sem_rede_e_401_e_desconectado() {
        for (status, esperado) in [
            (502, Ok(Sincronia::SemRede)),
            (503, Ok(Sincronia::SemRede)),
            (401, Ok(Sincronia::Desconectado)),
            (400, Err(ErroDeLogin::Site { status: 400 })),
        ] {
            let b = base(&format!("status-{status}"));
            let (origem, fio) = site_de_mentira(vec![(status, "{}".into())]);
            assert_eq!(sincronizar(&b, ENVIO, &origem, Some("qys_t")), esperado);
            fio.join().unwrap();
            assert_eq!(pendente(&b).unwrap().as_deref(), Some(ENVIO), "{status}");
        }
    }

    #[test]
    fn le_envia_com_bearer_e_guarda_o_json_exato_do_ultimo_envio() {
        let b = base("envia");
        let (origem, fio) = site_de_mentira(vec![(200, ZERADO.into()), (200, COM_TUTORIAL.into())]);
        let resultado = sincronizar(&b, ENVIO, &origem, Some("qys_token")).unwrap();
        assert_eq!(
            resultado,
            Sincronia::Sincronizado {
                progresso: ler(COM_TUTORIAL).unwrap(),
                enviado: true
            }
        );
        let pedidos = fio.join().unwrap();
        assert_eq!(pedidos[0].linha, "GET /api/progresso HTTP/1.1");
        assert_eq!(pedidos[1].linha, "PUT /api/progresso HTTP/1.1");
        for p in &pedidos {
            assert_eq!(p.autorizacao.as_deref(), Some("Bearer qys_token"));
        }
        assert_eq!(pedidos[1].corpo, ENVIO);

        let e = estado(&b).unwrap();
        assert_eq!(e.pendente, None);
        assert_eq!(e.ultimo.as_ref().map(|u| u.json.as_str()), Some(ENVIO));
        assert!(e.ultimo.unwrap().em > 1_700_000_000_000);
        assert_eq!(e.servidor, Some(ler(COM_TUTORIAL).unwrap()));
    }

    #[test]
    fn sem_nada_novo_so_le_e_nao_conta_como_envio() {
        let b = base("nada-novo");
        let (origem, fio) = site_de_mentira(vec![(200, COM_TUTORIAL.into())]);
        let resultado = sincronizar(&b, ENVIO, &origem, Some("qys_token")).unwrap();
        assert_eq!(
            resultado,
            Sincronia::Sincronizado {
                progresso: ler(COM_TUTORIAL).unwrap(),
                enviado: false
            }
        );
        assert_eq!(fio.join().unwrap().len(), 1);
        let e = estado(&b).unwrap();
        assert_eq!((e.pendente, e.ultimo), (None, None));
    }

    #[test]
    fn fila_offline_e_depois_entrega() {
        let b = base("fila");
        assert_eq!(
            sincronizar(&b, ENVIO, &porta_fechada(), Some("qys_t")),
            Ok(Sincronia::SemRede)
        );
        let (origem, fio) = site_de_mentira(vec![(200, ZERADO.into()), (200, ENVIO.into())]);
        let pendente = pendente(&b).unwrap().unwrap();
        assert!(matches!(
            sincronizar(&b, &pendente, &origem, Some("qys_t")),
            Ok(Sincronia::Sincronizado { enviado: true, .. })
        ));
        assert_eq!(fio.join().unwrap()[1].corpo, ENVIO);
        assert_eq!(super::pendente(&b).unwrap(), None);
    }

    #[test]
    fn resposta_estranha_do_site_nao_esvazia_a_fila() {
        let b = base("estranha");
        let (origem, fio) = site_de_mentira(vec![(200, r#"{"xp":1,"segredo":"x"}"#.into())]);
        assert!(matches!(
            sincronizar(&b, ENVIO, &origem, Some("qys_t")),
            Err(ErroDeLogin::Io(_))
        ));
        fio.join().unwrap();
        assert_eq!(pendente(&b).unwrap().as_deref(), Some(ENVIO));
    }

    /// De ponta a ponta contra um site de verdade (com Postgres), sem o chaveiro: o token vem de
    /// `QUIZ_E2E_TOKEN` e a fila fica em `QUIZ_E2E_PASTA`, que sobrevive entre as etapas. Cada
    /// rodada sincroniza `QUIZ_E2E_ENVIO` (ou, sem ele, o pendente) e imprime o desfecho:
    /// `QUIZ_SITE_URL=http://localhost:3019 QUIZ_E2E_TOKEN=qys_... QUIZ_E2E_PASTA=/tmp/fila \
    ///  QUIZ_E2E_ENVIO='{...}' cargo test sincronia_de_ponta_a_ponta -- --ignored --nocapture`.
    #[test]
    #[ignore = "precisa do site rodando e de um token de teste"]
    fn sincronia_de_ponta_a_ponta() {
        let var = |nome: &str| std::env::var(nome).unwrap_or_else(|_| panic!("defina {nome}"));
        let pasta = PathBuf::from(var("QUIZ_E2E_PASTA"));
        let envio = std::env::var("QUIZ_E2E_ENVIO")
            .ok()
            .or_else(|| pendente(&pasta).unwrap())
            .expect("nem QUIZ_E2E_ENVIO nem pendente");
        let origem = site::origem_valida(site::ORIGEM_PADRAO).unwrap();
        let resultado = sincronizar(&pasta, &envio, origem, Some(&var("QUIZ_E2E_TOKEN")));
        println!(
            "desfecho: {}",
            serde_json::to_string(&resultado.unwrap()).unwrap()
        );
        println!(
            "estado: {}",
            serde_json::to_string(&estado(&pasta).unwrap()).unwrap()
        );
    }

    #[test]
    fn envio_recusado_nao_grava_nada() {
        let b = base("recusado");
        assert!(sincronizar(&b, r#"{"xp":1}"#, "http://127.0.0.1:9", None).is_err());
        assert_eq!(estado(&b).unwrap().pendente, None);
    }
}
