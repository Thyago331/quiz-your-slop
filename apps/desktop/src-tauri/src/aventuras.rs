//! O arquivo local de cada Aventura (spec §8: o estado completo nunca sai da máquina).
//!
//! Só se escreve em `<dados do app>/aventuras/<uuid>.json`: o nome vem de um UUID conferido aqui,
//! nunca de um caminho, e nada é gravado dentro do Projeto. O conteúdo é conferido no Jogo
//! (TypeScript); aqui só se garante que é um objeto JSON de tamanho razoável.

use std::fs;
use std::path::{Path, PathBuf};

use crate::erro::{Erro, Resultado};

/// Uma Aventura com milhares de regiões ainda cabe com folga.
pub const LIMITE_DA_AVENTURA: usize = 8 * 1024 * 1024;

const PASTA: &str = "aventuras";

/// UUID em minúsculas, como o Jogo sorteia (`crypto.randomUUID`).
pub fn validar_id(id: &str) -> Resultado<()> {
    let partes: Vec<&str> = id.split('-').collect();
    let tamanhos = [8, 4, 4, 4, 12];
    let ok = partes.len() == tamanhos.len()
        && partes.iter().zip(tamanhos).all(|(p, n)| {
            p.len() == n
                && p.bytes()
                    .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
        });
    if ok {
        Ok(())
    } else {
        Err(Erro::ArgumentoRecusado("id".into()))
    }
}

fn arquivo(base: &Path, id: &str) -> Resultado<PathBuf> {
    validar_id(id)?;
    Ok(base.join(PASTA).join(format!("{id}.json")))
}

/// Grava (ou regrava) a Aventura `id`. Escreve num temporário ao lado e renomeia: uma queda no
/// meio não deixa meio arquivo no lugar do bom.
pub fn salvar(base: &Path, id: &str, json: &str) -> Resultado<()> {
    let destino = arquivo(base, id)?;
    if json.len() > LIMITE_DA_AVENTURA {
        return Err(Erro::ArquivoGrande {
            limite: LIMITE_DA_AVENTURA as u64,
        });
    }
    let valor: serde_json::Value =
        serde_json::from_str(json).map_err(|_| Erro::ArgumentoRecusado("json".into()))?;
    if !valor.is_object() {
        return Err(Erro::ArgumentoRecusado("json".into()));
    }
    fs::create_dir_all(base.join(PASTA))?;
    let temporario = destino.with_extension("json.tmp");
    fs::write(&temporario, json)?;
    fs::rename(&temporario, &destino)?;
    Ok(())
}

/// O conteúdo de cada `<uuid>.json` da pasta; o resto (temporários, nomes estranhos, arquivos
/// grandes demais ou ilegíveis) é ignorado. Sem pasta, nenhuma Aventura.
pub fn carregar(base: &Path) -> Resultado<Vec<String>> {
    let pasta = base.join(PASTA);
    let entradas = match fs::read_dir(&pasta) {
        Ok(e) => e,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(vec![]),
        Err(e) => return Err(e.into()),
    };
    let mut aventuras = Vec::new();
    for entrada in entradas.flatten() {
        let caminho = entrada.path();
        let Some(nome) = caminho.file_name().and_then(|n| n.to_str()) else {
            continue;
        };
        let Some(id) = nome.strip_suffix(".json") else {
            continue;
        };
        let tipo = entrada.file_type();
        if validar_id(id).is_err() || !tipo.map(|t| t.is_file()).unwrap_or(false) {
            continue;
        }
        let grande = entrada
            .metadata()
            .map(|m| m.len() > LIMITE_DA_AVENTURA as u64)
            .unwrap_or(true);
        if grande {
            continue;
        }
        if let Ok(texto) = fs::read_to_string(&caminho) {
            aventuras.push(texto);
        }
    }
    Ok(aventuras)
}

#[cfg(test)]
mod testes {
    use super::*;

    const ID: &str = "0b7e6c1a-3f2d-4c5e-9a8b-7c6d5e4f3a2b";

    fn base(nome: &str) -> PathBuf {
        let b = std::env::temp_dir().join(format!("quiz-aventuras-{nome}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&b);
        b
    }

    #[test]
    fn so_aceita_uuid_como_id() {
        assert!(validar_id(ID).is_ok());
        for ruim in [
            "",
            "tutorial",
            "../../etc/passwd",
            "0B7E6C1A-3F2D-4C5E-9A8B-7C6D5E4F3A2B",
            "0b7e6c1a-3f2d-4c5e-9a8b-7c6d5e4f3a2b.json",
            "0b7e6c1a/3f2d-4c5e-9a8b-7c6d5e4f3a2b",
            "0b7e6c1a-3f2d-4c5e-9a8b-7c6d5e4f3a2",
            "0b7e6c1a-3f2d-4c5e-9a8b-7c6d5e4f3a2bb",
            "0b7e6c1a-3f2d-4c5e-9a8b-7c6d5e4f3a2g",
        ] {
            assert_eq!(
                validar_id(ruim),
                Err(Erro::ArgumentoRecusado("id".into())),
                "{ruim}"
            );
        }
    }

    #[test]
    fn salva_e_carrega_so_dentro_da_pasta_do_app() {
        let b = base("ida-e-volta");
        assert_eq!(carregar(&b).unwrap(), Vec::<String>::new());
        salvar(&b, ID, r#"{"id":"x","v":1}"#).unwrap();
        salvar(&b, ID, r#"{"id":"x","v":2}"#).unwrap();
        assert_eq!(carregar(&b).unwrap(), [r#"{"id":"x","v":2}"#]);
        assert!(b.join("aventuras").join(format!("{ID}.json")).is_file());
        assert!(!b.join("aventuras").join(format!("{ID}.json.tmp")).exists());
    }

    #[test]
    fn recusa_id_ruim_e_conteudo_que_nao_e_objeto() {
        let b = base("recusa");
        assert!(salvar(&b, "../fora", "{}").is_err());
        for json in ["[]", "1", "não é json", ""] {
            assert_eq!(
                salvar(&b, ID, json),
                Err(Erro::ArgumentoRecusado("json".into())),
                "{json}"
            );
        }
        let grande = format!(r#"{{"x":"{}"}}"#, "a".repeat(LIMITE_DA_AVENTURA));
        assert!(matches!(
            salvar(&b, ID, &grande),
            Err(Erro::ArquivoGrande { .. })
        ));
        assert!(!b.join("aventuras").join(format!("{ID}.json")).exists());
    }

    #[test]
    fn ignora_o_que_nao_e_aventura() {
        let b = base("ignora");
        let pasta = b.join("aventuras");
        fs::create_dir_all(pasta.join(format!("{ID}.json"))).unwrap();
        fs::write(pasta.join("notas.json"), "{}").unwrap();
        fs::write(
            pasta.join("1b7e6c1a-3f2d-4c5e-9a8b-7c6d5e4f3a2b.json.tmp"),
            "{}",
        )
        .unwrap();
        fs::write(
            pasta.join("2b7e6c1a-3f2d-4c5e-9a8b-7c6d5e4f3a2b.json"),
            "{}",
        )
        .unwrap();
        assert_eq!(carregar(&b).unwrap(), ["{}"]);
    }
}
