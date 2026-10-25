//! O relatório de erro opcional (spec §8): nada é enviado pelo Jogo. O Jogador revisa e edita o
//! texto (já limpo pelo `sanitizar` do Jogo) e este comando só abre o navegador numa issue nova do
//! repositório do Jogo, com título e corpo preenchidos; quem envia é ele, no GitHub. A URL é
//! montada aqui a partir de um prefixo fixo: a interface escolhe o texto, nunca o destino.

use crate::erro::{Erro, Resultado};

/// O único endereço que este comando abre.
pub const ISSUE_NOVA: &str = "https://github.com/Thyago331/quiz-your-slop/issues/new";
/// O GitHub recusa links muito longos; com folga.
const URL_MAXIMA: usize = 8_000;
const TITULO_MAXIMO: usize = 120;
const CORTE: &str = "\n\n[…]";

/// Percent-encoding de tudo que não é "unreserved" (RFC 3986).
fn codificar(texto: &str) -> String {
    let mut saida = String::with_capacity(texto.len());
    for byte in texto.bytes() {
        if byte.is_ascii_alphanumeric() || b"-_.~".contains(&byte) {
            saida.push(byte as char);
        } else {
            saida.push_str(&format!("%{byte:02X}"));
        }
    }
    saida
}

/// A URL da issue nova: título cortado em 120 caracteres e corpo cortado para caber no limite.
pub fn url_do_relatorio(titulo: &str, corpo: &str) -> String {
    let titulo: String = titulo
        .chars()
        .filter(|c| !c.is_control())
        .take(TITULO_MAXIMO)
        .collect();
    let base = format!("{ISSUE_NOVA}?title={}&body=", codificar(&titulo));
    let inteiro = codificar(corpo);
    if base.len() + inteiro.len() <= URL_MAXIMA {
        return base + &inteiro;
    }
    let mut cabe = URL_MAXIMA - base.len() - codificar(CORTE).len();
    let mut cortado = String::new();
    for c in corpo.chars() {
        let pedaco = codificar(c.encode_utf8(&mut [0; 4]));
        if pedaco.len() > cabe {
            break;
        }
        cabe -= pedaco.len();
        cortado.push(c);
    }
    cortado.push_str(CORTE);
    base + &codificar(&cortado)
}

/// Abre o navegador na issue nova com o relatório que o Jogador revisou.
#[tauri::command]
pub fn abrir_relatorio(titulo: String, corpo: String) -> Resultado<()> {
    if corpo.trim().is_empty() {
        return Err(Erro::ArgumentoRecusado("corpo".into()));
    }
    let url = url_do_relatorio(&titulo, &corpo);
    debug_assert!(url.starts_with(&format!("{ISSUE_NOVA}?title=")));
    open::that_detached(&url).map_err(|e| Erro::Io(e.to_string()))
}

#[cfg(test)]
mod testes {
    use super::*;

    /// Desfaz o percent-encoding (só para conferir).
    fn decodificar(texto: &str) -> String {
        let bytes = texto.as_bytes();
        let mut saida = Vec::new();
        let mut k = 0;
        while k < bytes.len() {
            if bytes[k] == b'%' {
                let hex = std::str::from_utf8(&bytes[k + 1..k + 3]).unwrap();
                saida.push(u8::from_str_radix(hex, 16).unwrap());
                k += 3;
            } else {
                saida.push(bytes[k]);
                k += 1;
            }
        }
        String::from_utf8(saida).unwrap()
    }

    fn partes(url: &str) -> (String, String) {
        let consulta = url.strip_prefix(&format!("{ISSUE_NOVA}?")).unwrap();
        let (titulo, corpo) = consulta.split_once('&').unwrap();
        (
            decodificar(titulo.strip_prefix("title=").unwrap()),
            decodificar(corpo.strip_prefix("body=").unwrap()),
        )
    }

    #[test]
    fn so_abre_a_issue_nova_do_repositorio_do_jogo() {
        let url = url_do_relatorio("Erro do Mestre", "corpo");
        assert_eq!(
            url,
            "https://github.com/Thyago331/quiz-your-slop/issues/new?title=Erro%20do%20Mestre&body=corpo"
        );
    }

    #[test]
    fn nada_do_texto_escapa_para_outro_parametro_ou_host() {
        let maldoso = "x&body=y#@evil.example/?a=b\n<projeto>/... ção 🐛";
        let url = url_do_relatorio(maldoso, maldoso);
        assert!(url.starts_with(&format!("{ISSUE_NOVA}?title=")));
        let consulta = url.split_once('?').unwrap().1;
        assert_eq!(consulta.matches('&').count(), 1);
        assert!(!consulta.contains(['#', '/', '?', '@', ' ', '\n']));
        let (titulo, corpo) = partes(&url);
        assert_eq!(titulo, maldoso.replace('\n', ""));
        assert_eq!(corpo, maldoso);
    }

    #[test]
    fn titulo_e_corpo_longos_sao_cortados_sem_quebrar_caracteres() {
        let url = url_do_relatorio(&"t".repeat(500), &"çã🐛".repeat(5_000));
        assert!(url.len() <= URL_MAXIMA, "{}", url.len());
        let (titulo, corpo) = partes(&url);
        assert_eq!(titulo.chars().count(), TITULO_MAXIMO);
        assert!(corpo.ends_with(CORTE));
        assert!(corpo.starts_with("çã🐛çã🐛"));
    }

    #[test]
    fn corpo_vazio_e_recusado() {
        assert_eq!(
            abrir_relatorio("t".into(), "  \n".into()),
            Err(Erro::ArgumentoRecusado("corpo".into()))
        );
    }
}
