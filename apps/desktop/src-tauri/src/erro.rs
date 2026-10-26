use serde::Serialize;

/// O que um comando devolve quando recusa ou falha. Vai para a interface como
/// `{ "codigo": "...", "detalhe": ... }`; o texto mostrado ao Jogador é traduzido lá.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "codigo", content = "detalhe", rename_all = "snake_case")]
pub enum Erro {
    /// A verificação ou a instalação da atualização falhou (rede, assinatura, instalador).
    Atualizacao(String),
    /// A raiz do Projeto não existe ou não é uma pasta.
    RaizInvalida(String),
    /// A pasta não foi escolhida pelo Jogador nem está numa Aventura guardada (raizes.rs).
    RaizNaoPermitida(String),
    /// Caminho absoluto, com `..` ou que sai da raiz do Projeto.
    CaminhoRecusado(String),
    /// Argumento fora do formato permitido (ref de commit, schema...).
    ArgumentoRecusado(String),
    ArquivoGrande {
        limite: u64,
    },
    NaoEhTexto,
    /// A CLI do Mestre não foi encontrada no PATH.
    MestreAusente(String),
    /// A CLI do Mestre não tem todas as opções do modo restrito (somente leitura): o Jogo não a roda.
    SemModoRestrito {
        faltando: Vec<String>,
    },
    /// O processo terminou com código diferente de zero.
    Falhou {
        codigo: Option<i32>,
        stderr: String,
    },
    TempoEsgotado {
        segundos: u64,
    },
    Io(String),
}

impl From<std::io::Error> for Erro {
    fn from(e: std::io::Error) -> Self {
        Erro::Io(e.to_string())
    }
}

pub type Resultado<T> = Result<T, Erro>;
