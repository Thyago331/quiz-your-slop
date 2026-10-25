// A lista fechada de comandos: cada um ganha a permissão `allow-<comando>` e só roda se a
// capability da janela a conceder (capabilities/principal.json).
const COMANDOS: &[&str] = &[
    "rodar_mestre",
    "rodar_git",
    "ler_arquivo",
    // Atualização automática (src/atualizacao.rs).
    "verificar_atualizacao",
    "instalar_atualizacao",
    // Nova Aventura (#34)
    "escolher_pasta",
    "detectar_mestre",
    "comando_do_mestre",
    "salvar_aventura",
    "carregar_aventuras",
    // Login no desktop (src/login).
    "entrar",
    "cancelar_entrada",
    "sessao_atual",
    "sair",
];

fn main() {
    tauri_build::try_build(
        tauri_build::Attributes::new()
            .app_manifest(tauri_build::AppManifest::new().commands(COMANDOS)),
    )
    .expect("falha ao preparar o build do Tauri");
}
