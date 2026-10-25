//! O token no chaveiro do sistema: Secret Service no Linux, Gerenciador de Credenciais no Windows.
//! Uma entrada por origem do site, para o token de um site nunca ir para outro.

use keyring::Entry;

use super::ErroDeLogin;

const SERVICO: &str = "software.rapidsolutions.quizyourslop";

fn entrada(origem: &str) -> Result<Entry, ErroDeLogin> {
    Entry::new(SERVICO, origem).map_err(cofre)
}

fn cofre(e: keyring::Error) -> ErroDeLogin {
    ErroDeLogin::Cofre(e.to_string())
}

pub fn guardar(origem: &str, token: &str) -> Result<(), ErroDeLogin> {
    entrada(origem)?.set_password(token).map_err(cofre)
}

/// O token guardado, ou `None` se não há (nunca entrou ou já saiu).
pub fn ler(origem: &str) -> Result<Option<String>, ErroDeLogin> {
    match entrada(origem)?.get_password() {
        Ok(token) => Ok(Some(token)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(cofre(e)),
    }
}

/// Apaga o token; apagar o que não existe não é erro.
pub fn apagar(origem: &str) -> Result<(), ErroDeLogin> {
    match entrada(origem)?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(cofre(e)),
    }
}
