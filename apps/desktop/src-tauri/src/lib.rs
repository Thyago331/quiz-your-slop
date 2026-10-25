//! A camada fina em Rust do Jogo desktop (spec §11): uma lista fechada de comandos e nada mais.
//! A interface não tem plugin de sistema de arquivos, shell, rede ou abertura de URLs; tudo o que
//! ela pode pedir ao sistema está nos comandos abaixo, em nova_aventura.rs e nos de login
//! (src/login) e da atualização (src/atualizacao.rs), listados em capabilities/principal.json. Os
//! plugins de diálogo e de atualização só são usados do Rust (`escolher_pasta`, atualizacao.rs); o
//! login abre o navegador só na página do próprio site.

mod atualizacao;
mod aventuras;
mod erro;
mod git;
mod login;
mod mestre;
mod nova_aventura;
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

pub fn rodar() {
    atualizacao::preparar(tauri::Builder::default())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            rodar_mestre,
            rodar_git,
            ler_arquivo,
            // Atualização automática (src/atualizacao.rs)
            atualizacao::verificar_atualizacao,
            atualizacao::instalar_atualizacao,
            // Nova Aventura (#34)
            nova_aventura::escolher_pasta,
            nova_aventura::detectar_mestre,
            nova_aventura::comando_do_mestre,
            nova_aventura::salvar_aventura,
            nova_aventura::carregar_aventuras,
            login::entrar,
            login::cancelar_entrada,
            login::sessao_atual,
            login::sair
        ])
        .run(tauri::generate_context!())
        .expect("falha ao abrir o Jogo");
}
