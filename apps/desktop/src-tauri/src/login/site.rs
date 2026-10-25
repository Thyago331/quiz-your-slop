//! As chamadas ao site, feitas daqui e não do webview: o token nunca chega ao JavaScript, e a CSP da
//! interface continua sem rede nenhuma.

use std::time::Duration;

use serde::{Deserialize, Serialize};
use ureq::Agent;

use super::ErroDeLogin;

/// A origem do site, fixada no build: `QUIZ_SITE_URL=http://localhost:3010 pnpm tauri dev` aponta
/// para outro site local. O padrão é o `pnpm dev` do site.
pub const ORIGEM_PADRAO: &str = match option_env!("QUIZ_SITE_URL") {
    Some(origem) => origem,
    None => "http://localhost:3000",
};

const ESPERA_DA_REDE: Duration = Duration::from_secs(15);

/// Só `https://`, ou `http://` para a própria máquina (desenvolvimento); sem caminho, query nem
/// barra no fim. É a única base das URLs que o Jogo abre ou chama.
pub fn origem_valida(origem: &str) -> Result<&str, ErroDeLogin> {
    let resto = origem
        .strip_prefix("https://")
        .or_else(|| {
            let local = origem.strip_prefix("http://")?;
            let host = local.rsplit_once(':').map_or(local, |(h, _)| h);
            matches!(host, "localhost" | "127.0.0.1" | "[::1]").then_some(local)
        })
        .ok_or_else(|| ErroDeLogin::Configuracao(origem.into()))?;
    let ok = !resto.is_empty()
        && resto
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b".-:[]".contains(&b));
    if ok {
        Ok(origem)
    } else {
        Err(ErroDeLogin::Configuracao(origem.into()))
    }
}

/// A página do site que conecta o Jogo à conta (porta do loopback, `estado` e desafio PKCE). Os
/// três valores são base64url e número: nada a escapar.
pub fn url_de_conexao(
    origem: &str,
    idioma: &str,
    porta: u16,
    estado: &str,
    desafio: &str,
) -> String {
    format!("{origem}/{idioma}/entrar/desktop?porta={porta}&estado={estado}&desafio={desafio}")
}

/// O que o Jogo mostra de quem está conectado (GET /api/desktop/eu).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Perfil {
    pub login: String,
    pub nome: Option<String>,
    pub avatar_url: Option<String>,
}

#[derive(Deserialize)]
struct Troca {
    token: String,
}

fn agente() -> Agent {
    Agent::config_builder()
        .timeout_global(Some(ESPERA_DA_REDE))
        .http_status_as_error(false)
        // Nada de seguir redirect levando o Authorization para outro lugar.
        .max_redirects(0)
        .build()
        .into()
}

fn rede(e: ureq::Error) -> ErroDeLogin {
    ErroDeLogin::Rede(e.to_string())
}

fn conferir(resposta: &ureq::http::Response<ureq::Body>) -> Result<(), ErroDeLogin> {
    let status = resposta.status().as_u16();
    if (200..300).contains(&status) {
        Ok(())
    } else {
        Err(ErroDeLogin::Site { status })
    }
}

/// POST /api/desktop/token: o código do redirect e o verificador PKCE pelo token.
pub fn trocar(origem: &str, codigo: &str, verificador: &str) -> Result<String, ErroDeLogin> {
    let mut resposta = agente()
        .post(format!("{origem}/api/desktop/token"))
        .send_json(serde_json::json!({ "codigo": codigo, "verificador": verificador }))
        .map_err(rede)?;
    conferir(&resposta)?;
    let troca: Troca = resposta.body_mut().read_json().map_err(rede)?;
    Ok(troca.token)
}

/// GET /api/desktop/eu: 401 (`Site { status: 401 }`) é token vencido ou revogado.
pub fn eu(origem: &str, token: &str) -> Result<Perfil, ErroDeLogin> {
    let mut resposta = agente()
        .get(format!("{origem}/api/desktop/eu"))
        .header("Authorization", format!("Bearer {token}"))
        .call()
        .map_err(rede)?;
    conferir(&resposta)?;
    resposta.body_mut().read_json().map_err(rede)
}

/// POST /api/desktop/sair: revoga o token no servidor.
pub fn sair(origem: &str, token: &str) -> Result<(), ErroDeLogin> {
    let resposta = agente()
        .post(format!("{origem}/api/desktop/sair"))
        .header("Authorization", format!("Bearer {token}"))
        .send_empty()
        .map_err(rede)?;
    conferir(&resposta)
}

#[cfg(test)]
mod testes {
    use super::*;

    #[test]
    fn origem_so_https_ou_http_local() {
        for ok in [
            "https://quizyourslop.example",
            "http://localhost:3000",
            "http://127.0.0.1:3010",
            "http://localhost",
            "http://[::1]:3000",
        ] {
            assert_eq!(origem_valida(ok), Ok(ok));
        }
        for ruim in [
            "",
            "ftp://x.example",
            "http://quizyourslop.example",
            "http://localhost.mal.example:3000",
            "https://x.example/",
            "https://x.example/caminho",
            "https://x.example?x=1",
            "https://x.example#a",
            "https://usuario@x.example",
            "https://",
            "javascript:alert(1)",
        ] {
            assert!(origem_valida(ruim).is_err(), "{ruim}");
        }
    }

    #[test]
    fn a_origem_padrao_e_valida() {
        assert!(origem_valida(ORIGEM_PADRAO).is_ok());
    }

    #[test]
    fn monta_a_url_da_pagina_de_conexao() {
        assert_eq!(
            url_de_conexao("http://localhost:3000", "en", 49152, "abc_-1", "XYZ"),
            "http://localhost:3000/en/entrar/desktop?porta=49152&estado=abc_-1&desafio=XYZ"
        );
    }
}
