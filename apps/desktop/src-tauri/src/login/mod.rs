//! Login no Jogo desktop (spec §10). `entrar` abre o navegador na página de conexão do site e
//! espera o retorno num servidor de loopback temporário; o código que volta é trocado (com o
//! verificador PKCE) por um token, que fica no chaveiro do sistema. O token só circula aqui: a
//! interface recebe apenas se há sessão e o perfil mínimo.

pub(crate) mod cofre;
mod retorno;
pub(crate) mod site;

use std::net::TcpListener;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use base64::Engine;
use serde::Serialize;
use sha2::{Digest, Sha256};

use retorno::Desfecho;
use site::Perfil;

/// Quanto o Jogo espera o Jogador terminar o login no navegador.
const PRAZO_DO_LOGIN: Duration = Duration::from_secs(5 * 60);

/// O que os comandos de login devolvem ao recusar ou falhar, como `{ codigo, detalhe }`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "codigo", content = "detalhe", rename_all = "snake_case")]
pub enum ErroDeLogin {
    /// O Jogador cancelou no Jogo (ou começou outro login).
    Cancelado,
    /// O Jogador escolheu Cancelar na página do site.
    Recusado,
    TempoEsgotado {
        segundos: u64,
    },
    /// Idioma fora de pt/en/es.
    ArgumentoRecusado(String),
    /// A origem do site embutida no build não é aceitável.
    Configuracao(String),
    /// Não deu para abrir o navegador do sistema.
    Navegador(String),
    /// O site não respondeu.
    Rede(String),
    /// O site respondeu com um status de erro.
    Site {
        status: u16,
    },
    /// O chaveiro do sistema não está disponível ou recusou.
    Cofre(String),
    Io(String),
}

impl From<std::io::Error> for ErroDeLogin {
    fn from(e: std::io::Error) -> Self {
        ErroDeLogin::Io(e.to_string())
    }
}

/// A sessão como a interface a vê. `SemRede`: há token guardado, mas o site não respondeu agora.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "estado", rename_all = "snake_case")]
pub enum Sessao {
    Desconectado,
    Conectado { perfil: Perfil },
    SemRede,
}

/// O login em andamento, para o `cancelar_entrada` (e um segundo `entrar`) interromperem a espera.
static EM_ANDAMENTO: Mutex<Option<Arc<AtomicBool>>> = Mutex::new(None);

fn aleatorio() -> String {
    let mut bytes = [0u8; 32];
    getrandom::fill(&mut bytes).expect("o sistema não forneceu bytes aleatórios");
    URL_SAFE_NO_PAD.encode(bytes)
}

/// O desafio PKCE (S256) de um verificador.
fn desafio_de(verificador: &str) -> String {
    URL_SAFE_NO_PAD.encode(Sha256::digest(verificador.as_bytes()))
}

fn origem() -> Result<&'static str, ErroDeLogin> {
    site::origem_valida(site::ORIGEM_PADRAO)
}

/// A página que o navegador mostra no fim, no idioma do Jogo; o Jogador fecha a aba.
fn pagina(idioma: &str, deu_certo: bool) -> String {
    let (titulo, texto) = match (idioma, deu_certo) {
        ("en", true) => (
            "Connected",
            "You can go back to the Game and close this tab.",
        ),
        ("es", true) => ("Conectado", "Puedes volver al Juego y cerrar esta pestaña."),
        (_, true) => ("Conectado", "Pode voltar ao Jogo e fechar esta aba."),
        ("en", false) => ("Not connected", "Go back to the Game to try again."),
        ("es", false) => ("No conectado", "Vuelve al Juego para intentarlo de nuevo."),
        (_, false) => ("Não conectado", "Volte ao Jogo para tentar de novo."),
    };
    format!(
        "<!doctype html><html lang=\"{idioma}\"><meta charset=\"utf-8\"><title>Quiz your slop</title>\
         <body style=\"background:#0d0d1a;color:#f4f1de;font:20px monospace;display:grid;\
         place-items:center;min-height:90vh;text-align:center\"><main><h1>{titulo}</h1>\
         <p>{texto}</p></main></body></html>"
    )
}

/// Só a página de conexão do próprio site chega aqui: a interface não escolhe URL nenhuma.
fn abrir_no_navegador(url: &str) -> Result<(), ErroDeLogin> {
    open::that_detached(url).map_err(|e| ErroDeLogin::Navegador(e.to_string()))
}

fn entrar_bloqueando(
    idioma: &str,
    cancelado: &AtomicBool,
    abrir: impl FnOnce(&str) -> Result<(), ErroDeLogin>,
) -> Result<Sessao, ErroDeLogin> {
    if !matches!(idioma, "pt" | "en" | "es") {
        return Err(ErroDeLogin::ArgumentoRecusado(idioma.into()));
    }
    let origem = origem()?;
    // Porta escolhida pelo sistema, só na interface de loopback.
    let ouvinte = TcpListener::bind(("127.0.0.1", 0))?;
    let porta = ouvinte.local_addr()?.port();
    let estado = aleatorio();
    let verificador = aleatorio();
    let url = site::url_de_conexao(origem, idioma, porta, &estado, &desafio_de(&verificador));
    abrir(&url)?;

    let (desfecho, conexao) = retorno::esperar(&ouvinte, &estado, PRAZO_DO_LOGIN, cancelado)?;
    // Daqui em diante, nenhuma outra conexão é aceita.
    drop(ouvinte);
    let resultado = match desfecho {
        Desfecho::Recusado => Err(ErroDeLogin::Recusado),
        Desfecho::Codigo(codigo) => site::trocar(origem, &codigo, &verificador).and_then(|token| {
            cofre::guardar(origem, &token)?;
            Ok(match site::eu(origem, &token) {
                Ok(perfil) => Sessao::Conectado { perfil },
                Err(_) => Sessao::SemRede,
            })
        }),
    };
    retorno::responder(conexao, 200, &pagina(idioma, resultado.is_ok()));
    resultado
}

fn sessao_bloqueando() -> Result<Sessao, ErroDeLogin> {
    let origem = origem()?;
    let Some(token) = cofre::ler(origem)? else {
        return Ok(Sessao::Desconectado);
    };
    match site::eu(origem, &token) {
        Ok(perfil) => Ok(Sessao::Conectado { perfil }),
        // Vencido ou revogado (por exemplo, Sair em outro lugar): o token guardado não serve mais.
        Err(ErroDeLogin::Site { status: 401 }) => {
            cofre::apagar(origem)?;
            Ok(Sessao::Desconectado)
        }
        // O Jogo não depende do servidor para jogar (spec §10): segue com o token para depois.
        Err(_) => Ok(Sessao::SemRede),
    }
}

fn sair_bloqueando() -> Result<Sessao, ErroDeLogin> {
    let origem = origem()?;
    if let Some(token) = cofre::ler(origem)? {
        // Sem rede, o token sai daqui mesmo assim; no servidor, ele vence sozinho.
        let _ = site::sair(origem, &token);
        cofre::apagar(origem)?;
    }
    Ok(Sessao::Desconectado)
}

async fn em_segundo_plano<T: Send + 'static>(
    tarefa: impl FnOnce() -> Result<T, ErroDeLogin> + Send + 'static,
) -> Result<T, ErroDeLogin> {
    tauri::async_runtime::spawn_blocking(tarefa)
        .await
        .map_err(|e| ErroDeLogin::Io(e.to_string()))?
}

/// Abre o navegador no login do site e espera o retorno (até 5 minutos).
#[tauri::command]
pub async fn entrar(idioma: String) -> Result<Sessao, ErroDeLogin> {
    let cancelado = Arc::new(AtomicBool::new(false));
    if let Some(anterior) = EM_ANDAMENTO
        .lock()
        .unwrap_or_else(|e| e.into_inner())
        .replace(cancelado.clone())
    {
        anterior.store(true, Ordering::SeqCst);
    }
    let meu = cancelado.clone();
    let resultado =
        em_segundo_plano(move || entrar_bloqueando(&idioma, &meu, abrir_no_navegador)).await;
    let mut atual = EM_ANDAMENTO.lock().unwrap_or_else(|e| e.into_inner());
    if atual.as_ref().is_some_and(|a| Arc::ptr_eq(a, &cancelado)) {
        *atual = None;
    }
    resultado
}

/// Interrompe o `entrar` em andamento (o botão Cancelar da tela de espera).
#[tauri::command]
pub fn cancelar_entrada() {
    if let Some(atual) = EM_ANDAMENTO
        .lock()
        .unwrap_or_else(|e| e.into_inner())
        .take()
    {
        atual.store(true, Ordering::SeqCst);
    }
}

/// Há sessão? Confere o token guardado no site; 401 apaga o token.
#[tauri::command]
pub async fn sessao_atual() -> Result<Sessao, ErroDeLogin> {
    em_segundo_plano(sessao_bloqueando).await
}

/// Revoga o token no site e o apaga do chaveiro.
#[tauri::command]
pub async fn sair() -> Result<Sessao, ErroDeLogin> {
    em_segundo_plano(sair_bloqueando).await
}

#[cfg(test)]
mod testes {
    use super::*;

    #[test]
    fn desafio_pkce_do_rfc_7636() {
        assert_eq!(
            desafio_de("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"),
            "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
        );
    }

    #[test]
    fn segredos_tem_32_bytes_em_base64url_e_nao_se_repetem() {
        let (a, b) = (aleatorio(), aleatorio());
        assert_eq!(a.len(), 43);
        assert!(a
            .bytes()
            .all(|c| c.is_ascii_alphanumeric() || c == b'-' || c == b'_'));
        assert_ne!(a, b);
    }

    #[test]
    fn idioma_fora_da_lista_e_recusado_antes_de_abrir_qualquer_coisa() {
        let cancelado = AtomicBool::new(false);
        let abrir = |_: &str| -> Result<(), ErroDeLogin> { panic!("não era para abrir") };
        assert_eq!(
            entrar_bloqueando("fr", &cancelado, abrir),
            Err(ErroDeLogin::ArgumentoRecusado("fr".into()))
        );
    }

    #[test]
    fn sem_navegador_o_login_falha_na_hora() {
        let cancelado = AtomicBool::new(false);
        let abrir = |_: &str| Err(ErroDeLogin::Navegador("sem xdg-open".into()));
        assert_eq!(
            entrar_bloqueando("pt", &cancelado, abrir),
            Err(ErroDeLogin::Navegador("sem xdg-open".into()))
        );
    }

    /// O "navegador" lê porta e estado da URL aberta e volta com o Cancelar da página do site.
    #[test]
    fn recusar_no_site_encerra_a_espera() {
        use std::io::{Read, Write};
        let cancelado = AtomicBool::new(false);
        let (url_tx, url_rx) = std::sync::mpsc::channel::<String>();
        let navegador = std::thread::spawn(move || {
            let url = url_rx.recv().unwrap();
            let query = url.split_once('?').unwrap().1;
            let valor = |nome: &str| {
                query
                    .split('&')
                    .find_map(|p| p.strip_prefix(&format!("{nome}=")))
                    .unwrap()
                    .to_string()
            };
            assert!(url.starts_with(&format!("{}/es/entrar/desktop?", site::ORIGEM_PADRAO)));
            assert_eq!(valor("desafio").len(), 43);
            let mut c =
                std::net::TcpStream::connect(("127.0.0.1", valor("porta").parse::<u16>().unwrap()))
                    .unwrap();
            let pedido = format!(
                "GET /retorno?erro=recusado&estado={} HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n",
                valor("estado")
            );
            c.write_all(pedido.as_bytes()).unwrap();
            let mut resposta = String::new();
            c.read_to_string(&mut resposta).unwrap();
            resposta
        });
        let resultado = entrar_bloqueando("es", &cancelado, |url| {
            url_tx.send(url.into()).unwrap();
            Ok(())
        });
        assert_eq!(resultado, Err(ErroDeLogin::Recusado));
        let resposta = navegador.join().unwrap();
        assert!(resposta.contains("Vuelve al Juego"), "{resposta}");
    }

    /// De ponta a ponta contra um site de verdade, com Postgres e o chaveiro do sistema. Em vez
    /// de abrir o navegador, grava a URL em `QUIZ_E2E_URL`; um navegador automatizado a abre,
    /// com sessão no site, e confirma a conexão (duas vezes). Rodar com
    /// `QUIZ_SITE_URL=http://localhost:3017 QUIZ_E2E_URL=/tmp/url cargo test -- --ignored`.
    #[test]
    #[ignore = "precisa do site rodando e de um navegador automatizado"]
    fn login_de_ponta_a_ponta() {
        let arquivo = std::env::var("QUIZ_E2E_URL").expect("defina QUIZ_E2E_URL");
        let entrar = || {
            let cancelado = AtomicBool::new(false);
            entrar_bloqueando("pt", &cancelado, |url| {
                std::fs::write(&arquivo, url)?;
                Ok(())
            })
        };
        let origem = origem().unwrap();

        let sessao = entrar().unwrap();
        assert!(matches!(sessao, Sessao::Conectado { .. }), "{sessao:?}");
        assert_eq!(sessao_bloqueando().unwrap(), sessao);
        // Revogado no servidor (como se fosse em outro lugar): o 401 apaga o token daqui.
        let token = cofre::ler(origem).unwrap().unwrap();
        site::sair(origem, &token).unwrap();
        assert_eq!(sessao_bloqueando().unwrap(), Sessao::Desconectado);
        assert_eq!(cofre::ler(origem).unwrap(), None);

        let sessao = entrar().unwrap();
        assert!(matches!(sessao, Sessao::Conectado { .. }), "{sessao:?}");
        let token = cofre::ler(origem).unwrap().unwrap();
        assert_eq!(sair_bloqueando().unwrap(), Sessao::Desconectado);
        assert_eq!(cofre::ler(origem).unwrap(), None);
        assert_eq!(
            site::eu(origem, &token),
            Err(ErroDeLogin::Site { status: 401 })
        );
    }

    #[test]
    fn a_sessao_vai_para_a_interface_sem_token() {
        let perfil = Perfil {
            login: "viajante".into(),
            nome: None,
            avatar_url: None,
        };
        assert_eq!(
            serde_json::to_value(Sessao::Conectado { perfil }).unwrap(),
            serde_json::json!({
                "estado": "conectado",
                "perfil": { "login": "viajante", "nome": null, "avatar_url": null }
            })
        );
        assert_eq!(
            serde_json::to_value(ErroDeLogin::TempoEsgotado { segundos: 300 }).unwrap(),
            serde_json::json!({ "codigo": "tempo_esgotado", "detalhe": { "segundos": 300 } })
        );
    }

    #[test]
    fn a_pagina_final_esta_no_idioma_do_jogo() {
        assert!(pagina("pt", true).contains("Pode voltar ao Jogo"));
        assert!(pagina("en", false).contains("try again"));
        assert!(pagina("es", true).contains("volver al Juego"));
    }
}
