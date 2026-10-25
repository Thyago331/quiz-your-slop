//! A camada fina em Rust do Jogo desktop (spec §11): uma lista fechada de comandos e nada mais.
//! A interface não tem plugin de sistema de arquivos, shell, rede ou abertura de URLs; tudo o que
//! ela pode pedir ao sistema está nos quatro comandos abaixo (e em capabilities/principal.json).

mod erro;
mod git;
mod mestre;
mod processo;
mod projeto;

use erro::{Erro, Resultado};
use git::ComandoGit;
use mestre::PedidoMestre;

/// Processos e disco ficam fora da thread da interface.
async fn em_segundo_plano<T: Send + 'static>(
    tarefa: impl FnOnce() -> Resultado<T> + Send + 'static,
) -> Resultado<T> {
    tauri::async_runtime::spawn_blocking(tarefa)
        .await
        .map_err(|e| Erro::Io(e.to_string()))?
}

/// Roda a CLI do Mestre (Claude Code ou Codex) somente leitura na pasta do Projeto.
#[tauri::command]
async fn rodar_mestre(pedido: PedidoMestre) -> Resultado<String> {
    em_segundo_plano(move || mestre::rodar(&pedido)).await
}

/// Roda um dos `git` de leitura permitidos na pasta do Projeto.
#[tauri::command]
async fn rodar_git(raiz: String, comando: ComandoGit) -> Resultado<String> {
    em_segundo_plano(move || git::rodar(&raiz, &comando)).await
}

/// Lê um arquivo do Projeto (para conferir Evidências), pelo caminho relativo à raiz.
#[tauri::command]
async fn ler_arquivo(raiz: String, caminho: String) -> Resultado<String> {
    em_segundo_plano(move || projeto::ler_arquivo(&raiz, &caminho, projeto::LIMITE_DE_LEITURA))
        .await
}

/// Atualização automática pelas Releases do GitHub: chega com o ticket de distribuição.
#[tauri::command]
async fn atualizar() -> Resultado<()> {
    Err(Erro::NaoImplementado)
}

pub fn rodar() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            rodar_mestre,
            rodar_git,
            ler_arquivo,
            atualizar
        ])
        .run(tauri::generate_context!())
        .expect("falha ao abrir o Jogo");
}
