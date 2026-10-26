//! As raízes de Projeto que a interface pode usar (spec §11): só pastas que o Jogador escolheu no
//! seletor (`escolher_pasta`) nesta sessão ou que estão nas Aventuras guardadas (lidas pelo
//! `carregar_aventuras`). `ler_arquivo`, `rodar_git`, `rodar_mestre` e `comando_do_mestre` recusam
//! qualquer outra; assim a janela não escolhe sozinha uma pasta como `/home/<usuário>` para ler.
//!
//! A lista vive só na memória, em forma canônica (sem symlinks nem `..`). O `salvar_aventura` não
//! acrescenta nada: recusa a Aventura que cite uma pasta fora da lista.

use std::path::PathBuf;
use std::sync::Mutex;

use crate::erro::{Erro, Resultado};
use crate::projeto;

#[derive(Default)]
pub struct Raizes {
    /// As raízes canônicas permitidas.
    canonicas: Mutex<Vec<PathBuf>>,
    /// Os `caminho_local` exatamente como vieram das Aventuras guardadas, mesmo os de pastas que
    /// não existem mais: regravar a Aventura não pode falhar por isso (e eles não liberam nada,
    /// porque os comandos exigem uma pasta que existe).
    guardadas: Mutex<Vec<String>>,
}

/// As da sessão do Jogo.
pub static RAIZES: Raizes = Raizes::nova();

impl Raizes {
    pub const fn nova() -> Self {
        Self {
            canonicas: Mutex::new(Vec::new()),
            guardadas: Mutex::new(Vec::new()),
        }
    }

    /// Passa a permitir `raiz` (se é uma pasta que existe).
    pub fn permitir(&self, raiz: &str) {
        if let Ok(canonica) = projeto::validar_raiz(raiz) {
            let mut lista = self.canonicas.lock().unwrap_or_else(|e| e.into_inner());
            if !lista.contains(&canonica) {
                lista.push(canonica);
            }
        }
    }

    /// A raiz canônica de `raiz`, se é uma pasta que existe e está na lista.
    pub fn conferir(&self, raiz: &str) -> Resultado<PathBuf> {
        let canonica = projeto::validar_raiz(raiz)?;
        let lista = self.canonicas.lock().unwrap_or_else(|e| e.into_inner());
        if lista.contains(&canonica) {
            Ok(canonica)
        } else {
            Err(Erro::RaizNaoPermitida(raiz.into()))
        }
    }

    /// Permite as raízes das Aventuras guardadas (`repositorios[].caminho_local` de cada JSON).
    pub fn permitir_das_aventuras(&self, jsons: &[String]) {
        for json in jsons {
            for caminho in caminhos_locais(json) {
                self.permitir(&caminho);
                let mut guardadas = self.guardadas.lock().unwrap_or_else(|e| e.into_inner());
                if !guardadas.contains(&caminho) {
                    guardadas.push(caminho);
                }
            }
        }
    }

    /// Toda pasta citada pela Aventura `json` está na lista (ou veio assim das guardadas)?
    pub fn conferir_aventura(&self, json: &str) -> Resultado<()> {
        for caminho in caminhos_locais(json) {
            let guardada = self
                .guardadas
                .lock()
                .unwrap_or_else(|e| e.into_inner())
                .contains(&caminho);
            if !guardada {
                self.conferir(&caminho)?;
            }
        }
        Ok(())
    }
}

/// Os `repositorios[].caminho_local` de uma Aventura (o resto do formato é com o Jogo).
fn caminhos_locais(json: &str) -> Vec<String> {
    let Ok(valor) = serde_json::from_str::<serde_json::Value>(json) else {
        return vec![];
    };
    valor
        .get("repositorios")
        .and_then(|r| r.as_array())
        .map(|repositorios| {
            repositorios
                .iter()
                .filter_map(|r| r.get("caminho_local")?.as_str().map(str::to_owned))
                .collect()
        })
        .unwrap_or_default()
}

#[cfg(test)]
mod testes {
    use super::*;
    use std::fs;
    use std::path::Path;

    fn pasta(nome: &str) -> PathBuf {
        let p = std::env::temp_dir().join(format!("quiz-raizes-{nome}-{}", std::process::id()));
        fs::create_dir_all(&p).unwrap();
        p
    }

    fn s(p: &Path) -> &str {
        p.to_str().unwrap()
    }

    #[test]
    fn so_vale_a_pasta_escolhida() {
        let raizes = Raizes::nova();
        let escolhida = pasta("escolhida");
        let outra = pasta("outra");
        assert_eq!(
            raizes.conferir(s(&escolhida)),
            Err(Erro::RaizNaoPermitida(s(&escolhida).into()))
        );
        raizes.permitir(s(&escolhida));
        assert_eq!(
            raizes.conferir(s(&escolhida)).unwrap(),
            dunce::canonicalize(&escolhida).unwrap()
        );
        // Outro jeito de escrever a mesma pasta vale; outra pasta, a mãe ou a pasta pessoal, não.
        let com_ponto = escolhida
            .join(".")
            .join("..")
            .join(escolhida.file_name().unwrap());
        assert!(raizes.conferir(s(&com_ponto)).is_ok());
        assert!(matches!(
            raizes.conferir(s(&outra)),
            Err(Erro::RaizNaoPermitida(_))
        ));
        assert!(raizes.conferir(s(escolhida.parent().unwrap())).is_err());
        if let Some(casa) = std::env::var_os("HOME") {
            assert!(matches!(
                raizes.conferir(casa.to_str().unwrap()),
                Err(Erro::RaizNaoPermitida(_))
            ));
        }
        assert!(raizes.conferir("/home/u").is_err());
    }

    #[cfg(unix)]
    #[test]
    fn symlink_vale_pelo_destino() {
        let raizes = Raizes::nova();
        let escolhida = pasta("symlink-alvo");
        let atalho =
            std::env::temp_dir().join(format!("quiz-raizes-atalho-{}", std::process::id()));
        let _ = fs::remove_file(&atalho);
        std::os::unix::fs::symlink(&escolhida, &atalho).unwrap();
        raizes.permitir(s(&atalho));
        assert!(raizes.conferir(s(&escolhida)).is_ok());
    }

    #[test]
    fn as_aventuras_guardadas_liberam_as_suas_pastas() {
        let raizes = Raizes::nova();
        let (a, b) = (pasta("guardada-a"), pasta("guardada-b"));
        let sumiu = std::env::temp_dir().join("quiz-raizes-pasta-que-sumiu");
        let json = serde_json::json!({
            "id": "x",
            "repositorios": [
                { "nome": "a", "caminho_local": s(&a) },
                { "nome": "b", "caminho_local": s(&b) },
                { "nome": "c", "caminho_local": s(&sumiu) },
            ]
        })
        .to_string();
        raizes.permitir_das_aventuras(&[json.clone(), "não é json".into(), "{}".into()]);
        assert!(raizes.conferir(s(&a)).is_ok());
        assert!(raizes.conferir(s(&b)).is_ok());
        assert!(raizes.conferir(s(&sumiu)).is_err());
        // Regravar a mesma Aventura vale, mesmo com a pasta que sumiu.
        assert_eq!(raizes.conferir_aventura(&json), Ok(()));
    }

    #[test]
    fn salvar_nao_libera_pasta_nova() {
        let raizes = Raizes::nova();
        let escolhida = pasta("salvar-escolhida");
        let intrusa = pasta("salvar-intrusa");
        raizes.permitir(s(&escolhida));
        let aventura = |caminho: &Path| {
            serde_json::json!({ "repositorios": [{ "nome": "x", "caminho_local": s(caminho) }] })
                .to_string()
        };
        assert_eq!(raizes.conferir_aventura(&aventura(&escolhida)), Ok(()));
        assert!(matches!(
            raizes.conferir_aventura(&aventura(&intrusa)),
            Err(Erro::RaizNaoPermitida(_))
        ));
        assert!(raizes.conferir(s(&intrusa)).is_err());
        assert!(raizes
            .conferir_aventura(&aventura(Path::new("/home/u")))
            .is_err());
    }
}
