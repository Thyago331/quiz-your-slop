//! A atualização automática (spec §10): ao abrir, o Jogo pergunta às Releases do GitHub se há
//! versão nova; com um clique, baixa, confere a assinatura com a chave do projeto, instala e
//! reinicia.
//!
//! O `tauri-plugin-updater` só é usado daqui, como o diálogo em `escolher_pasta`: a janela não
//! recebe nenhuma permissão `updater:*`, só os dois comandos abaixo, e não escolhe URL nem
//! arquivo. O endereço (`latest.json` da última Release), a chave pública e a exigência de que a
//! assinatura traga a versão ficam em `tauri.conf.json` (`plugins.updater`), fixados no build.

use std::sync::Mutex;

use serde::Serialize;
use tauri::ipc::Channel;
use tauri::utils::config::BundleType;
use tauri::utils::platform::bundle_type;
use tauri::{AppHandle, Runtime, State};
use tauri_plugin_updater::{Update, UpdaterExt};

use crate::erro::{Erro, Resultado};

/// O que a interface fica sabendo da verificação.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Verificacao {
    pub disponivel: bool,
    pub versao: Option<String>,
    pub notas: Option<String>,
}

/// O andamento da instalação, mandado pelo canal do `instalar_atualizacao`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "etapa", rename_all = "snake_case")]
pub enum Progresso {
    /// `porcentagem` é `None` quando o servidor não diz o tamanho do arquivo.
    Baixando { porcentagem: Option<u8> },
    /// Baixado e com a assinatura conferida; o instalador roda e o Jogo reinicia.
    Instalando,
}

/// A atualização achada pela última verificação: o `instalar_atualizacao` instala exatamente
/// essa, sem receber nada da interface.
#[derive(Default)]
pub struct Pendente(Mutex<Option<Update>>);

/// Registra o plugin (lendo `plugins.updater` do tauri.conf.json) e o estado da atualização.
pub fn preparar<R: Runtime>(builder: tauri::Builder<R>) -> tauri::Builder<R> {
    builder
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(Pendente::default())
}

fn falha(e: impl ToString) -> Erro {
    Erro::Atualizacao(e.to_string())
}

/// Só se atualiza o que foi instalado por um dos pacotes da Release (o bundler grava o tipo no
/// binário). Um binário de desenvolvimento (`tauri dev`, `cargo build`) não tem tipo: o updater o
/// trataria como AppImage e escreveria por cima dele.
fn veio_de_um_pacote(tipo: Option<BundleType>) -> bool {
    matches!(
        tipo,
        Some(BundleType::AppImage | BundleType::Deb | BundleType::Nsis)
    )
}

const EM_DIA: Verificacao = Verificacao {
    disponivel: false,
    versao: None,
    notas: None,
};

/// Pergunta ao `latest.json` da última Release se há versão mais nova que esta. Fora de um
/// pacote, não pergunta: não haveria o que instalar.
#[tauri::command]
pub async fn verificar_atualizacao<R: Runtime>(
    app: AppHandle<R>,
    pendente: State<'_, Pendente>,
) -> Resultado<Verificacao> {
    if !veio_de_um_pacote(bundle_type()) {
        return Ok(EM_DIA);
    }
    let achada = app.updater().map_err(falha)?.check().await.map_err(falha)?;
    let verificacao = Verificacao {
        disponivel: achada.is_some(),
        versao: achada.as_ref().map(|u| u.version.clone()),
        notas: achada.as_ref().and_then(|u| u.body.clone()),
    };
    *pendente.0.lock().map_err(falha)? = achada;
    Ok(verificacao)
}

/// Baixa a versão achada, confere a assinatura com a chave do projeto, instala e reinicia. No
/// Windows, o instalador NSIS fecha o Jogo e o abre de novo sozinho.
#[tauri::command]
pub async fn instalar_atualizacao<R: Runtime>(
    app: AppHandle<R>,
    pendente: State<'_, Pendente>,
    ao_progredir: Channel<Progresso>,
) -> Resultado<()> {
    let update = pendente
        .0
        .lock()
        .map_err(falha)?
        .clone()
        .ok_or_else(|| falha("nenhuma atualização verificada"))?;
    let mut andamento = Andamento::default();
    let _ = ao_progredir.send(Progresso::Baixando { porcentagem: None });
    // O download_and_install confere a assinatura (minisign, chave do tauri.conf.json) antes de
    // instalar: um arquivo que não bate com ela nunca é instalado.
    update
        .download_and_install(
            |pedaco, total| {
                if let Some(porcentagem) = andamento.avancar(pedaco, total) {
                    let _ = ao_progredir.send(Progresso::Baixando {
                        porcentagem: Some(porcentagem),
                    });
                }
            },
            || {
                let _ = ao_progredir.send(Progresso::Instalando);
            },
        )
        .await
        .map_err(falha)?;
    app.restart()
}

/// Soma os pedaços baixados e diz a porcentagem só quando ela muda (o canal não recebe uma
/// mensagem por pedaço).
#[derive(Debug, Default)]
struct Andamento {
    baixado: u64,
    ultima: Option<u8>,
}

impl Andamento {
    fn avancar(&mut self, pedaco: usize, total: Option<u64>) -> Option<u8> {
        self.baixado = self.baixado.saturating_add(pedaco as u64);
        let total = total.filter(|t| *t > 0)?;
        let porcentagem = (self.baixado.min(total) * 100 / total) as u8;
        if self.ultima == Some(porcentagem) {
            return None;
        }
        self.ultima = Some(porcentagem);
        Some(porcentagem)
    }
}

#[cfg(test)]
mod testes {
    use super::*;
    use base64::Engine;
    use serde_json::{json, Value};

    const ENDPOINT: &str =
        "https://github.com/Thyago331/quiz-your-slop/releases/latest/download/latest.json";

    fn configuracao() -> Value {
        serde_json::from_str(include_str!("../tauri.conf.json")).unwrap()
    }

    #[test]
    fn o_updater_so_pergunta_ao_latest_json_das_releases_do_projeto() {
        let updater = &configuracao()["plugins"]["updater"];
        assert_eq!(updater["endpoints"], json!([ENDPOINT]));
        assert_eq!(updater["requireSignedVersion"], json!(true));
        assert!(updater.get("dangerousInsecureTransportProtocol").is_none());
        assert!(updater.get("allowDowngrades").is_none());
        assert_eq!(updater["windows"]["installMode"], json!("passive"));
    }

    #[test]
    fn a_chave_publica_e_uma_chave_minisign() {
        let pubkey = configuracao()["plugins"]["updater"]["pubkey"]
            .as_str()
            .unwrap()
            .to_owned();
        let texto = base64::engine::general_purpose::STANDARD
            .decode(pubkey)
            .unwrap();
        let texto = String::from_utf8(texto).unwrap();
        let mut linhas = texto.lines();
        assert!(linhas
            .next()
            .unwrap()
            .starts_with("untrusted comment: minisign public key"));
        // "Ed" + id de 8 bytes + chave de 32 bytes.
        let chave = base64::engine::general_purpose::STANDARD
            .decode(linhas.next().unwrap())
            .unwrap();
        assert_eq!(chave.len(), 42);
        assert_eq!(&chave[..2], b"Ed");
    }

    #[test]
    fn o_build_gera_os_artefatos_assinados_do_updater() {
        let bundle = &configuracao()["bundle"];
        assert_eq!(bundle["createUpdaterArtifacts"], json!(true));
        assert_eq!(bundle["targets"], json!(["deb", "appimage", "nsis"]));
    }

    #[test]
    fn a_janela_so_recebe_os_dois_comandos_e_nenhuma_permissao_do_plugin() {
        let capability: Value =
            serde_json::from_str(include_str!("../capabilities/principal.json")).unwrap();
        let permissoes: Vec<&str> = capability["permissions"]
            .as_array()
            .unwrap()
            .iter()
            .map(|p| p.as_str().unwrap())
            .collect();
        assert!(permissoes.contains(&"allow-verificar-atualizacao"));
        assert!(permissoes.contains(&"allow-instalar-atualizacao"));
        assert!(permissoes.iter().all(|p| p.starts_with("allow-")));
    }

    #[test]
    fn so_se_atualiza_o_que_veio_de_um_pacote_da_release() {
        assert!(veio_de_um_pacote(Some(BundleType::AppImage)));
        assert!(veio_de_um_pacote(Some(BundleType::Deb)));
        assert!(veio_de_um_pacote(Some(BundleType::Nsis)));
        assert!(!veio_de_um_pacote(Some(BundleType::Rpm)));
        assert!(!veio_de_um_pacote(Some(BundleType::Msi)));
        assert!(!veio_de_um_pacote(None));
        // O binário dos testes não saiu do bundler.
        assert!(!veio_de_um_pacote(bundle_type()));
    }

    #[test]
    fn o_andamento_diz_a_porcentagem_so_quando_ela_muda() {
        let mut a = Andamento::default();
        assert_eq!(a.avancar(10, Some(1000)), Some(1));
        assert_eq!(a.avancar(1, Some(1000)), None);
        assert_eq!(a.avancar(489, Some(1000)), Some(50));
        assert_eq!(a.avancar(600, Some(1000)), Some(100));
        assert_eq!(a.avancar(5, Some(1000)), None);
    }

    #[test]
    fn sem_tamanho_conhecido_nao_ha_porcentagem() {
        let mut a = Andamento::default();
        assert_eq!(a.avancar(10, None), None);
        assert_eq!(a.avancar(10, Some(0)), None);
        assert_eq!(a.baixado, 20);
    }

    #[test]
    fn o_progresso_vai_para_a_interface_com_a_etapa() {
        assert_eq!(
            serde_json::to_value(Progresso::Baixando {
                porcentagem: Some(7)
            })
            .unwrap(),
            json!({ "etapa": "baixando", "porcentagem": 7 })
        );
        assert_eq!(
            serde_json::to_value(Progresso::Instalando).unwrap(),
            json!({ "etapa": "instalando" })
        );
        assert_eq!(
            serde_json::to_value(Erro::Atualizacao("rede".into())).unwrap(),
            json!({ "codigo": "atualizacao", "detalhe": "rede" })
        );
    }
}
