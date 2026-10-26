//! O que vários módulos usam do mesmo jeito: rodar fora da thread da interface, achar a pasta de
//! dados do app e gravar um arquivo sem deixar meio arquivo no lugar.

use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use tauri::{AppHandle, Manager};

/// Processos, disco e rede ficam fora da thread da interface. Serve a qualquer erro que saiba
/// virar de um `io::Error` (o `Erro` dos comandos e o `ErroDeLogin`).
pub async fn em_segundo_plano<T, E>(
    tarefa: impl FnOnce() -> Result<T, E> + Send + 'static,
) -> Result<T, E>
where
    T: Send + 'static,
    E: From<io::Error> + Send + 'static,
{
    tauri::async_runtime::spawn_blocking(tarefa)
        .await
        .map_err(|e| E::from(io::Error::other(e.to_string())))?
}

/// `<dados do app>`: onde ficam as Aventuras e a fila do progresso.
pub fn pasta_de_dados<E: From<io::Error>>(app: &AppHandle) -> Result<PathBuf, E> {
    app.path()
        .app_data_dir()
        .map_err(|e| E::from(io::Error::other(e.to_string())))
}

/// Grava `conteudo` em `destino` (criando a pasta) por um temporário ao lado e um rename: uma
/// queda no meio não deixa meio arquivo no lugar do bom.
pub fn gravar_atomico(destino: &Path, conteudo: &str) -> io::Result<()> {
    if let Some(pasta) = destino.parent() {
        fs::create_dir_all(pasta)?;
    }
    let mut nome = destino.file_name().unwrap_or_default().to_os_string();
    nome.push(".tmp");
    let temporario = destino.with_file_name(nome);
    fs::write(&temporario, conteudo)?;
    fs::rename(&temporario, destino)
}

#[cfg(test)]
mod testes {
    use super::*;

    #[test]
    fn grava_por_cima_sem_deixar_temporario() {
        let base = std::env::temp_dir().join(format!("quiz-comum-{}", std::process::id()));
        let _ = fs::remove_dir_all(&base);
        let destino = base.join("sub").join("a.json");
        gravar_atomico(&destino, "1").unwrap();
        gravar_atomico(&destino, "2").unwrap();
        assert_eq!(fs::read_to_string(&destino).unwrap(), "2");
        assert!(!base.join("sub").join("a.json.tmp").exists());
    }
}
