// A lista fechada de comandos: cada um ganha a permissão `allow-<comando>` e só roda se a
// capability da janela a conceder (capabilities/principal.json).
const COMANDOS: &[&str] = &[
    "rodar_mestre",
    "rodar_git",
    "ler_arquivo",
    "atualizar",
    // Nova Aventura (#34)
    "escolher_pasta",
    "detectar_mestre",
    "comando_do_mestre",
    "salvar_aventura",
    "carregar_aventuras",
];

fn main() {
    tauri_build::try_build(
        tauri_build::Attributes::new()
            .app_manifest(tauri_build::AppManifest::new().commands(COMANDOS)),
    )
    .expect("falha ao preparar o build do Tauri");
}
