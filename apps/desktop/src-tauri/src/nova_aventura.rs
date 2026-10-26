//! Os comandos da Nova Aventura (#34): escolher as pastas do Projeto, detectar a CLI do Mestre,
//! mostrar o comando exato e guardar a Aventura no arquivo local. Ficam num módulo próprio para a
//! lista fechada continuar fácil de ler em lib.rs.

use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

use crate::aventuras;
use crate::comum::{em_segundo_plano, pasta_de_dados};
use crate::erro::{Erro, Resultado};
use crate::mestre::{self, Deteccao, Ia};
use crate::raizes::RAIZES;

/// O seletor de pastas do sistema. A janela não pode abrir diálogos por conta própria (nenhuma
/// permissão `dialog:*`): só pede uma pasta, e o Jogo recebe o caminho escolhido ou nada. A pasta
/// escolhida passa a ser uma raiz permitida (raizes.rs).
#[tauri::command]
pub async fn escolher_pasta(app: AppHandle) -> Resultado<Option<String>> {
    em_segundo_plano(move || {
        let Some(escolhida) = app.dialog().file().blocking_pick_folder() else {
            return Ok(None);
        };
        let caminho = escolhida.into_path().map_err(|e| Erro::Io(e.to_string()))?;
        let caminho = caminho.to_string_lossy().into_owned();
        RAIZES.permitir(&caminho);
        Ok(Some(caminho))
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
    em_segundo_plano(move || mestre::comando_para_exibir(&RAIZES, ia, &raiz, &raizes_extras)).await
}

/// Grava a Aventura `id` (UUID) na pasta de dados do app, se toda pasta que ela cita é permitida.
#[tauri::command]
pub async fn salvar_aventura(app: AppHandle, id: String, json: String) -> Resultado<()> {
    let base = pasta_de_dados::<Erro>(&app)?;
    em_segundo_plano(move || {
        RAIZES.conferir_aventura(&json)?;
        aventuras::salvar(&base, &id, &json)
    })
    .await
}

/// O conteúdo de todas as Aventuras guardadas (o Jogo confere cada uma). As pastas delas passam a
/// ser raízes permitidas.
#[tauri::command]
pub async fn carregar_aventuras(app: AppHandle) -> Resultado<Vec<String>> {
    let base = pasta_de_dados::<Erro>(&app)?;
    em_segundo_plano(move || {
        let aventuras = aventuras::carregar(&base)?;
        RAIZES.permitir_das_aventuras(&aventuras);
        Ok(aventuras)
    })
    .await
}
