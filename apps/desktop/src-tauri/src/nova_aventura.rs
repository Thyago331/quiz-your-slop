//! Os comandos da Nova Aventura (#34): escolher as pastas do Projeto, detectar a CLI do Mestre,
//! mostrar o comando exato e guardar a Aventura no arquivo local. Ficam num módulo próprio para a
//! lista fechada continuar fácil de ler em lib.rs.

use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::DialogExt;

use crate::aventuras;
use crate::em_segundo_plano;
use crate::erro::{Erro, Resultado};
use crate::mestre::{self, Deteccao, Ia};

/// O seletor de pastas do sistema. A janela não pode abrir diálogos por conta própria (nenhuma
/// permissão `dialog:*`): só pede uma pasta, e o Jogo recebe o caminho escolhido ou nada.
#[tauri::command]
pub async fn escolher_pasta(app: AppHandle) -> Resultado<Option<String>> {
    em_segundo_plano(move || {
        let Some(escolhida) = app.dialog().file().blocking_pick_folder() else {
            return Ok(None);
        };
        let caminho = escolhida.into_path().map_err(|e| Erro::Io(e.to_string()))?;
        Ok(Some(caminho.to_string_lossy().into_owned()))
    })
    .await
}

/// Se a CLI está instalada e tem o modo restrito que o Jogo exige.
#[tauri::command]
pub async fn detectar_mestre(ia: Ia) -> Resultado<Deteccao> {
    em_segundo_plano(move || mestre::detectar(ia)).await
}

/// O comando exato que `rodar_mestre` roda para estas pastas, para o aviso "O Mestre só pode LER".
#[tauri::command]
pub async fn comando_do_mestre(
    ia: Ia,
    raiz: String,
    raizes_extras: Vec<String>,
) -> Resultado<String> {
    em_segundo_plano(move || mestre::comando_para_exibir(ia, &raiz, &raizes_extras)).await
}

fn pasta_de_dados(app: &AppHandle) -> Resultado<std::path::PathBuf> {
    app.path()
        .app_data_dir()
        .map_err(|e| Erro::Io(e.to_string()))
}

/// Grava a Aventura `id` (UUID) na pasta de dados do app.
#[tauri::command]
pub async fn salvar_aventura(app: AppHandle, id: String, json: String) -> Resultado<()> {
    let base = pasta_de_dados(&app)?;
    em_segundo_plano(move || aventuras::salvar(&base, &id, &json)).await
}

/// O conteúdo de todas as Aventuras guardadas (o Jogo confere cada uma).
#[tauri::command]
pub async fn carregar_aventuras(app: AppHandle) -> Resultado<Vec<String>> {
    let base = pasta_de_dados(&app)?;
    em_segundo_plano(move || aventuras::carregar(&base)).await
}
