//! A raiz do Projeto e os arquivos dentro dela.
//!
//! Cada comando recebe a raiz do Projeto (a pasta de um repositório), que precisa estar entre as
//! permitidas (raizes.rs: escolhida no seletor ou de uma Aventura guardada).

use std::fs;
use std::io::Read;
use std::path::{Component, Path, PathBuf};

use crate::erro::{Erro, Resultado};
use crate::raizes::Raizes;

/// Teto de leitura: o bastante para conferir Evidências, pouco para virar cópia do repositório.
pub const LIMITE_DE_LEITURA: u64 = 2 * 1024 * 1024;

/// A raiz canônica (sem symlinks nem `..`) de uma pasta que existe.
pub fn validar_raiz(raiz: &str) -> Resultado<PathBuf> {
    if raiz.is_empty() {
        return Err(Erro::RaizInvalida(raiz.into()));
    }
    let canonica = dunce::canonicalize(raiz).map_err(|_| Erro::RaizInvalida(raiz.into()))?;
    if !canonica.is_dir() {
        return Err(Erro::RaizInvalida(raiz.into()));
    }
    Ok(canonica)
}

/// Um caminho relativo que só desce: nada de raiz, letra de unidade ou `..`.
pub fn validar_relativo(caminho: &str) -> Resultado<&Path> {
    let recusado = || Erro::CaminhoRecusado(caminho.into());
    let p = Path::new(caminho);
    if caminho.is_empty() || p.is_absolute() || p.has_root() {
        return Err(recusado());
    }
    for parte in p.components() {
        match parte {
            Component::Normal(_) | Component::CurDir => {}
            Component::ParentDir | Component::RootDir | Component::Prefix(_) => {
                return Err(recusado())
            }
        }
    }
    Ok(p)
}

/// O arquivo de verdade por trás de `caminho`, desde que continue dentro da raiz depois de
/// resolver symlinks.
pub fn resolver_arquivo(raiz: &Path, caminho: &str) -> Resultado<PathBuf> {
    let relativo = validar_relativo(caminho)?;
    let real = dunce::canonicalize(raiz.join(relativo))?;
    if !real.starts_with(raiz) {
        return Err(Erro::CaminhoRecusado(caminho.into()));
    }
    if !real.is_file() {
        return Err(Erro::CaminhoRecusado(caminho.into()));
    }
    Ok(real)
}

/// O conteúdo (texto UTF-8) de um arquivo do Projeto, até `limite` bytes.
pub fn ler_arquivo(raizes: &Raizes, raiz: &str, caminho: &str, limite: u64) -> Resultado<String> {
    let raiz = raizes.conferir(raiz)?;
    let arquivo = resolver_arquivo(&raiz, caminho)?;
    // Lê no máximo limite + 1 bytes: o arquivo pode crescer entre o metadata e a leitura.
    let mut bytes = Vec::new();
    fs::File::open(arquivo)?
        .take(limite + 1)
        .read_to_end(&mut bytes)?;
    if bytes.len() as u64 > limite {
        return Err(Erro::ArquivoGrande { limite });
    }
    String::from_utf8(bytes).map_err(|_| Erro::NaoEhTexto)
}

#[cfg(test)]
mod testes {
    use super::*;

    /// `ler_arquivo` com a raiz já permitida (como se o Jogador a tivesse escolhido).
    fn le(raiz: &str, caminho: &str, limite: u64) -> Resultado<String> {
        let raizes = Raizes::nova();
        raizes.permitir(raiz);
        ler_arquivo(&raizes, raiz, caminho, limite)
    }

    #[test]
    fn recusa_raiz_que_o_jogador_nao_escolheu() {
        let raiz = projeto("nao-escolhida");
        let r = raiz.to_str().unwrap();
        assert!(matches!(
            ler_arquivo(&Raizes::nova(), r, "src/pedidos.ts", 100),
            Err(Erro::RaizNaoPermitida(_))
        ));
    }

    /// Uma pasta descartável com um Projeto mínimo.
    fn projeto(nome: &str) -> PathBuf {
        let raiz = std::env::temp_dir().join(format!("quiz-projeto-{nome}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&raiz);
        fs::create_dir_all(raiz.join("src")).unwrap();
        fs::write(raiz.join("src/pedidos.ts"), "export const x = 1;\n").unwrap();
        raiz
    }

    #[test]
    fn le_arquivo_do_projeto() {
        let raiz = projeto("le");
        let texto = le(raiz.to_str().unwrap(), "src/pedidos.ts", LIMITE_DE_LEITURA);
        assert_eq!(texto.unwrap(), "export const x = 1;\n");
        let com_ponto = le(raiz.to_str().unwrap(), "./src/pedidos.ts", 100);
        assert!(com_ponto.is_ok());
    }

    #[test]
    fn recusa_absolutos_e_subidas() {
        for caminho in [
            "",
            "/etc/passwd",
            "../segredo",
            "src/../../segredo",
            "src/..",
        ] {
            assert!(
                matches!(validar_relativo(caminho), Err(Erro::CaminhoRecusado(_))),
                "{caminho}"
            );
        }
        #[cfg(windows)]
        for caminho in [
            r"C:\Windows\win.ini",
            r"\Windows",
            r"C:segredo",
            r"..\segredo",
        ] {
            assert!(validar_relativo(caminho).is_err(), "{caminho}");
        }
    }

    #[test]
    fn recusa_raiz_que_nao_e_pasta() {
        let raiz = projeto("raiz");
        let arquivo = raiz.join("src/pedidos.ts");
        assert!(matches!(
            validar_raiz(arquivo.to_str().unwrap()),
            Err(Erro::RaizInvalida(_))
        ));
        assert!(validar_raiz(raiz.join("nao-existe").to_str().unwrap()).is_err());
        assert!(validar_raiz("").is_err());
    }

    #[test]
    fn recusa_pasta_e_arquivo_inexistente() {
        let raiz = projeto("pasta");
        let r = raiz.to_str().unwrap();
        assert!(matches!(le(r, "src", 100), Err(Erro::CaminhoRecusado(_))));
        assert!(matches!(le(r, "src/nada.ts", 100), Err(Erro::Io(_))));
    }

    #[test]
    fn respeita_o_limite_e_recusa_binario() {
        let raiz = projeto("limite");
        let r = raiz.to_str().unwrap();
        assert_eq!(
            le(r, "src/pedidos.ts", 5),
            Err(Erro::ArquivoGrande { limite: 5 })
        );
        fs::write(raiz.join("imagem.bin"), [0xff, 0xfe, 0x00]).unwrap();
        assert_eq!(le(r, "imagem.bin", 100), Err(Erro::NaoEhTexto));
    }

    #[cfg(unix)]
    #[test]
    fn symlink_para_fora_da_raiz_e_recusado() {
        use std::os::unix::fs::symlink;
        let raiz = projeto("symlink");
        let fora = projeto("symlink-fora");
        symlink(fora.join("src/pedidos.ts"), raiz.join("atalho.ts")).unwrap();
        symlink(fora.join("src"), raiz.join("pasta-de-fora")).unwrap();
        symlink(raiz.join("src/pedidos.ts"), raiz.join("atalho-dentro.ts")).unwrap();
        let r = raiz.to_str().unwrap();
        assert!(matches!(
            le(r, "atalho.ts", 100),
            Err(Erro::CaminhoRecusado(_))
        ));
        assert!(matches!(
            le(r, "pasta-de-fora/pedidos.ts", 100),
            Err(Erro::CaminhoRecusado(_))
        ));
        // Symlink que continua dentro do Projeto vale.
        assert!(le(r, "atalho-dentro.ts", 100).is_ok());
    }
}
