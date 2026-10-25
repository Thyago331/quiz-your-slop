//! O servidor de loopback temporário do login (spec §10): espera, em 127.0.0.1, o único
//! `GET /retorno?codigo=...&estado=...` que o site manda o navegador fazer. É HTTP mínimo e estrito:
//! só GET, só esse caminho, cabeçalho limitado, um pedido por conexão; o resto recebe erro e o
//! servidor continua esperando, até o prazo ou o cancelamento.

use std::io::{ErrorKind, Read, Write};
use std::net::{TcpListener, TcpStream};
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::{Duration, Instant};

use super::ErroDeLogin;

/// Maior pedido aceito (linha + cabeçalhos); um navegador manda bem menos que isso.
pub const LIMITE_DO_PEDIDO: usize = 8 * 1024;
/// Quanto cada conexão tem para mandar o pedido inteiro.
const ESPERA_DA_CONEXAO: Duration = Duration::from_secs(5);
/// De quanto em quanto tempo o laço olha o prazo e o cancelamento.
const PASSO: Duration = Duration::from_millis(100);

/// O que o site mandou de volta.
#[derive(Debug, PartialEq, Eq)]
pub enum Desfecho {
    /// O Jogador confirmou: o código de uso único, a trocar pelo token.
    Codigo(String),
    /// O Jogador escolheu Cancelar na página do site.
    Recusado,
}

/// Como um pedido foi julgado: aceito (fim da espera) ou recusado com um status HTTP.
#[derive(Debug, PartialEq, Eq)]
enum Julgamento {
    Aceito(Desfecho),
    Recusado(u16),
}

/// A primeira linha de um pedido HTTP, se o cabeçalho chegou inteiro e cabe no limite.
fn linha_do_pedido(bruto: &[u8]) -> Option<&str> {
    let fim = bruto.windows(4).position(|w| w == b"\r\n\r\n")?;
    let cabecalho = std::str::from_utf8(&bruto[..fim]).ok()?;
    cabecalho.split("\r\n").next()
}

/// Valor de um parâmetro que aparece exatamente uma vez na query.
fn parametro<'a>(query: &'a str, nome: &str) -> Result<Option<&'a str>, ()> {
    let mut achado = None;
    for par in query.split('&') {
        let (chave, valor) = par.split_once('=').unwrap_or((par, ""));
        if chave == nome {
            if achado.is_some() {
                return Err(());
            }
            achado = Some(valor);
        }
    }
    Ok(achado)
}

/// Os valores que o site devolve são base64url, sem nada a decodificar.
fn eh_base64url(valor: &str, minimo: usize, maximo: usize) -> bool {
    (minimo..=maximo).contains(&valor.len())
        && valor
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
}

fn julgar(bruto: &[u8], estado: &str) -> Julgamento {
    let Some(linha) = linha_do_pedido(bruto) else {
        return Julgamento::Recusado(400);
    };
    let mut partes = linha.split(' ');
    let (Some(metodo), Some(alvo), Some(versao), None) =
        (partes.next(), partes.next(), partes.next(), partes.next())
    else {
        return Julgamento::Recusado(400);
    };
    if !versao.starts_with("HTTP/1.") {
        return Julgamento::Recusado(400);
    }
    if metodo != "GET" {
        return Julgamento::Recusado(405);
    }
    let (caminho, query) = alvo.split_once('?').unwrap_or((alvo, ""));
    if caminho != "/retorno" {
        return Julgamento::Recusado(404);
    }
    let (Ok(recebido), Ok(codigo), Ok(erro)) = (
        parametro(query, "estado"),
        parametro(query, "codigo"),
        parametro(query, "erro"),
    ) else {
        return Julgamento::Recusado(400);
    };
    // O `estado` amarra o retorno a este login: sem ele, outra página poderia empurrar um código.
    if recebido != Some(estado) {
        return Julgamento::Recusado(400);
    }
    match (codigo, erro) {
        (Some(c), None) if eh_base64url(c, 43, 43) => {
            Julgamento::Aceito(Desfecho::Codigo(c.into()))
        }
        (None, Some("recusado")) => Julgamento::Aceito(Desfecho::Recusado),
        _ => Julgamento::Recusado(400),
    }
}

/// Lê o cabeçalho do pedido, sem passar do limite nem do tempo da conexão.
fn ler_pedido(conexao: &mut TcpStream) -> std::io::Result<Vec<u8>> {
    conexao.set_nonblocking(false)?;
    conexao.set_read_timeout(Some(ESPERA_DA_CONEXAO))?;
    let mut bruto = Vec::with_capacity(1024);
    let mut bloco = [0u8; 1024];
    let inicio = Instant::now();
    while bruto.len() <= LIMITE_DO_PEDIDO && inicio.elapsed() < ESPERA_DA_CONEXAO {
        let n = conexao.read(&mut bloco)?;
        if n == 0 {
            break;
        }
        bruto.extend_from_slice(&bloco[..n]);
        if bruto.windows(4).any(|w| w == b"\r\n\r\n") {
            break;
        }
    }
    bruto.truncate(LIMITE_DO_PEDIDO + 1);
    Ok(bruto)
}

/// Responde e fecha a conexão. A página não carrega nada de fora e não vaza a URL (com o código).
pub fn responder(mut conexao: TcpStream, status: u16, html: &str) {
    let motivo = match status {
        200 => "OK",
        404 => "Not Found",
        405 => "Method Not Allowed",
        _ => "Bad Request",
    };
    let resposta = format!(
        "HTTP/1.1 {status} {motivo}\r\n\
         Content-Type: text/html; charset=utf-8\r\n\
         Content-Length: {}\r\n\
         Cache-Control: no-store\r\n\
         Referrer-Policy: no-referrer\r\n\
         Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'\r\n\
         Connection: close\r\n\r\n{html}",
        html.len()
    );
    let _ = conexao.write_all(resposta.as_bytes());
    let _ = conexao.flush();
}

/// Espera o retorno com o `estado` certo. Devolve o desfecho e a conexão dele, para a resposta
/// final ao navegador sair depois da troca do código.
pub fn esperar(
    ouvinte: &TcpListener,
    estado: &str,
    prazo: Duration,
    cancelado: &AtomicBool,
) -> Result<(Desfecho, TcpStream), ErroDeLogin> {
    ouvinte.set_nonblocking(true)?;
    let fim = Instant::now() + prazo;
    loop {
        if cancelado.load(Ordering::SeqCst) {
            return Err(ErroDeLogin::Cancelado);
        }
        if Instant::now() >= fim {
            return Err(ErroDeLogin::TempoEsgotado {
                segundos: prazo.as_secs(),
            });
        }
        match ouvinte.accept() {
            Ok((mut conexao, _)) => {
                let Ok(bruto) = ler_pedido(&mut conexao) else {
                    continue;
                };
                match julgar(&bruto, estado) {
                    Julgamento::Aceito(desfecho) => return Ok((desfecho, conexao)),
                    Julgamento::Recusado(status) => responder(conexao, status, ""),
                }
            }
            Err(e) if e.kind() == ErrorKind::WouldBlock => thread::sleep(PASSO),
            Err(e) => return Err(e.into()),
        }
    }
}

#[cfg(test)]
mod testes {
    use super::*;
    use std::net::SocketAddr;

    const ESTADO: &str = "estado-de-teste_0123456789";
    const CODIGO: &str = "c0d1g0-de-teste_0123456789abcdefghijklmnopq";

    fn get(alvo: &str) -> Vec<u8> {
        format!("GET {alvo} HTTP/1.1\r\nHost: 127.0.0.1\r\nUser-Agent: teste\r\n\r\n").into_bytes()
    }

    #[test]
    fn aceita_o_retorno_com_o_estado_certo() {
        assert_eq!(CODIGO.len(), 43);
        let alvo = format!("/retorno?codigo={CODIGO}&estado={ESTADO}");
        assert_eq!(
            julgar(&get(&alvo), ESTADO),
            Julgamento::Aceito(Desfecho::Codigo(CODIGO.into()))
        );
        let recusa = format!("/retorno?erro=recusado&estado={ESTADO}");
        assert_eq!(
            julgar(&get(&recusa), ESTADO),
            Julgamento::Aceito(Desfecho::Recusado)
        );
    }

    #[test]
    fn recusa_estado_errado_ausente_ou_repetido() {
        for alvo in [
            format!("/retorno?codigo={CODIGO}&estado=outro-estado-qualquer"),
            format!("/retorno?codigo={CODIGO}"),
            format!("/retorno?codigo={CODIGO}&estado={ESTADO}&estado={ESTADO}"),
            format!("/retorno?codigo={CODIGO}&codigo={CODIGO}&estado={ESTADO}"),
        ] {
            assert_eq!(
                julgar(&get(&alvo), ESTADO),
                Julgamento::Recusado(400),
                "{alvo}"
            );
        }
    }

    #[test]
    fn recusa_outro_caminho_ou_metodo() {
        let q = format!("codigo={CODIGO}&estado={ESTADO}");
        assert_eq!(
            julgar(&get("/favicon.ico"), ESTADO),
            Julgamento::Recusado(404)
        );
        assert_eq!(
            julgar(&get(&format!("/retorno/?{q}")), ESTADO),
            Julgamento::Recusado(404)
        );
        let post = format!("POST /retorno?{q} HTTP/1.1\r\nHost: x\r\n\r\n");
        assert_eq!(julgar(post.as_bytes(), ESTADO), Julgamento::Recusado(405));
    }

    #[test]
    fn recusa_codigo_fora_do_formato_e_pedido_malformado() {
        for alvo in [
            format!("/retorno?codigo=curto&estado={ESTADO}"),
            format!("/retorno?codigo={CODIGO}%41&estado={ESTADO}"),
            format!("/retorno?codigo={CODIGO}&erro=recusado&estado={ESTADO}"),
            format!("/retorno?erro=outro&estado={ESTADO}"),
        ] {
            assert_eq!(
                julgar(&get(&alvo), ESTADO),
                Julgamento::Recusado(400),
                "{alvo}"
            );
        }
        for bruto in [
            &b"GET /retorno HTTP/1.1\r\n"[..],
            b"GET /retorno\r\n\r\n",
            b"GET  /retorno HTTP/1.1\r\n\r\n",
            b"GET /retorno SPDY/3\r\n\r\n",
            b"\xff\xfe\r\n\r\n",
        ] {
            assert_eq!(julgar(bruto, ESTADO), Julgamento::Recusado(400));
        }
    }

    fn ouvinte() -> (TcpListener, SocketAddr) {
        let ouvinte = TcpListener::bind("127.0.0.1:0").unwrap();
        let endereco = ouvinte.local_addr().unwrap();
        (ouvinte, endereco)
    }

    /// Manda um pedido cru e devolve a primeira linha da resposta.
    fn pedir(endereco: SocketAddr, bruto: &[u8]) -> String {
        let mut c = TcpStream::connect(endereco).unwrap();
        c.write_all(bruto).unwrap();
        let mut resposta = String::new();
        let _ = c.read_to_string(&mut resposta);
        resposta.lines().next().unwrap_or_default().to_string()
    }

    #[test]
    fn segue_esperando_depois_de_pedidos_errados() {
        let (ouvinte, endereco) = ouvinte();
        let cliente = thread::spawn(move || {
            let errado = format!("/retorno?codigo={CODIGO}&estado=de-outro-login-123");
            let respostas = [
                pedir(endereco, &get("/favicon.ico")),
                pedir(endereco, &get(&errado)),
                pedir(endereco, &vec![b'a'; LIMITE_DO_PEDIDO + 1]),
            ];
            let mut certo = TcpStream::connect(endereco).unwrap();
            certo
                .write_all(&get(&format!("/retorno?codigo={CODIGO}&estado={ESTADO}")))
                .unwrap();
            let mut final_ = String::new();
            certo.read_to_string(&mut final_).unwrap();
            (respostas, final_)
        });
        let cancelado = AtomicBool::new(false);
        let (desfecho, conexao) =
            esperar(&ouvinte, ESTADO, Duration::from_secs(10), &cancelado).unwrap();
        assert_eq!(desfecho, Desfecho::Codigo(CODIGO.into()));
        responder(conexao, 200, "<p>pode voltar</p>");
        let (respostas, final_) = cliente.join().unwrap();
        assert_eq!(
            respostas,
            [
                "HTTP/1.1 404 Not Found",
                "HTTP/1.1 400 Bad Request",
                "HTTP/1.1 400 Bad Request"
            ]
        );
        assert!(final_.starts_with("HTTP/1.1 200 OK\r\n"), "{final_}");
        assert!(final_.ends_with("<p>pode voltar</p>"));
    }

    #[test]
    fn desiste_no_prazo() {
        let (ouvinte, _) = ouvinte();
        let cancelado = AtomicBool::new(false);
        let inicio = Instant::now();
        let erro = esperar(&ouvinte, ESTADO, Duration::from_millis(300), &cancelado).unwrap_err();
        assert_eq!(erro, ErroDeLogin::TempoEsgotado { segundos: 0 });
        assert!(inicio.elapsed() < Duration::from_secs(3));
    }

    #[test]
    fn para_quando_cancelado() {
        let (ouvinte, _) = ouvinte();
        let cancelado = AtomicBool::new(true);
        let erro = esperar(&ouvinte, ESTADO, Duration::from_secs(60), &cancelado).unwrap_err();
        assert_eq!(erro, ErroDeLogin::Cancelado);
    }
}
