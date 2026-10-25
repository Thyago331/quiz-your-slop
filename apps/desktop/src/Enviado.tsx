import { useEffect } from 'react';
import { formatar, formatarDataHora, type PorIdioma } from '@quiz/i18n';
import { Janela, Menu, useIdioma } from '@quiz/ui';
import type { EstadoDoEnvio } from './sistema.ts';
import { useEsc } from './TelaProvisoria.tsx';

// A tela "O que é enviado" do Jogo desktop (spec §8, §13; protótipo ?tela=enviado): em linguagem
// clara o que sai da máquina e o que nunca sai, e o JSON exato do último envio e do pendente.

const pt = {
  titulo: 'O que é enviado',
  ultimo: 'Último envio ao servidor · {quando}',
  nenhum: 'Nada enviado ainda: o primeiro envio sai no fim da sua primeira Expedição.',
  aguardando:
    'Aguardando o servidor: o próximo envio sai assim que o site responder (o Jogo tenta de novo ' +
    'a cada 5 minutos, sem atrapalhar o jogo).',
  semConta: 'Aguardando: entre com o GitHub no menu para o progresso ir para a sua conta.',
  sobe: [
    'Seu XP, seu Título e suas estatísticas (Expedições, acertos, Contestações vencidas).',
    'Para cada Aventura: um código sem significado, a porcentagem revelada e a Classe.',
  ],
  nunca:
    'Nunca: o seu código, nomes de Regiões, Territórios ou repositórios, caminhos de arquivo, ' +
    'Desafios, gabaritos, trechos de código ou o nome das suas pastas.',
  conta:
    'A conta não vai no envio: o site sabe quem é você pelo login do Jogo, guardado no chaveiro ' +
    'do sistema.',
  telemetria:
    'Nenhuma telemetria: o Jogo não manda mais nada sozinho. Relatório de erro, só se você ' +
    'pedir, e você lê e edita antes.',
  json: 'JSON exato do último envio (o Título vai sempre com o nome em português):',
  jsonPendente: 'JSON exato do envio que aguarda o servidor:',
  bug: 'Viu algo além de números e ids aqui? É um bug — reporte. O Jogo é de código aberto.',
  voltar: 'Voltar ao menu',
};

const TEXTOS: PorIdioma<typeof pt> = {
  pt,
  en: {
    titulo: 'What is sent',
    ultimo: 'Last upload to the server · {quando}',
    nenhum: 'Nothing sent yet: the first upload goes out at the end of your first Expedition.',
    aguardando:
      'Waiting for the server: the next upload goes out as soon as the site answers (the Game ' +
      'tries again every 5 minutes, without getting in the way of play).',
    semConta: 'Waiting: sign in with GitHub in the menu so your progress goes to your account.',
    sobe: [
      'Your XP, your Title and your stats (Expeditions, hits, Disputes won).',
      'For each Adventure: a meaningless code, the revealed percentage and the Class.',
    ],
    nunca:
      'Never: your code, names of Regions, Territories or repositories, file paths, Challenges, ' +
      'answer keys, code snippets or the names of your folders.',
    conta:
      "The account is not in the upload: the site knows who you are from the Game's sign-in, " +
      "kept in the system's keychain.",
    telemetria:
      'No telemetry: the Game sends nothing else by itself. An error report only if you ask ' +
      'for it, and you read and edit it first.',
    json: 'Exact JSON of the last upload (the Title always goes with its Portuguese name):',
    jsonPendente: 'Exact JSON of the upload waiting for the server:',
    bug: 'See anything besides numbers and ids here? It is a bug — report it. The Game is open source.',
    voltar: 'Back to the menu',
  },
  es: {
    titulo: 'Lo que se envía',
    ultimo: 'Último envío al servidor · {quando}',
    nenhum: 'Nada enviado todavía: el primer envío sale al final de tu primera Expedición.',
    aguardando:
      'Esperando al servidor: el próximo envío sale en cuanto el sitio responda (el Juego lo ' +
      'intenta de nuevo cada 5 minutos, sin estorbar el juego).',
    semConta: 'Esperando: entra con GitHub en el menú para que el progreso vaya a tu cuenta.',
    sobe: [
      'Tu XP, tu Título y tus estadísticas (Expediciones, aciertos, Impugnaciones ganadas).',
      'Para cada Aventura: un código sin significado, el porcentaje revelado y la Clase.',
    ],
    nunca:
      'Nunca: tu código, nombres de Regiones, Territorios o repositorios, rutas de archivo, ' +
      'Desafíos, respuestas correctas, fragmentos de código o el nombre de tus carpetas.',
    conta:
      'La cuenta no va en el envío: el sitio sabe quién eres por el inicio de sesión del Juego, ' +
      'guardado en el llavero del sistema.',
    telemetria:
      'Ninguna telemetría: el Juego no envía nada más por su cuenta. Informe de error, solo si ' +
      'lo pides, y lo lees y editas antes.',
    json: 'JSON exacto del último envío (el Título va siempre con el nombre en portugués):',
    jsonPendente: 'JSON exacto del envío que espera al servidor:',
    bug: '¿Ves algo más que números e ids aquí? Es un bug — repórtalo. El Juego es de código abierto.',
    voltar: 'Volver al menú',
  },
};

/** O JSON guardado, com recuo para ler (o conteúdo é o mesmo que saiu). */
function legivel(json: string): string {
  try {
    return JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    return json;
  }
}

type EnviadoProps = {
  envio: EstadoDoEnvio | null;
  /** Há conta conectada (com ou sem rede agora)? */
  comConta: boolean;
  /** Relê o estado do envio ao abrir a tela. */
  onAbrir: () => void;
  onVoltar: () => void;
};

export function Enviado({ envio, comConta, onAbrir, onVoltar }: EnviadoProps) {
  const idioma = useIdioma();
  const t = TEXTOS[idioma];
  useEsc(onVoltar);
  useEffect(() => onAbrir(), [onAbrir]);
  const ultimo = envio?.ultimo;
  const pendente = envio?.pendente;
  return (
    <main className="tela-enviado">
      <Janela titulo={t.titulo} className="enviado-janela">
        <p className="enviado-ouro">
          {ultimo
            ? formatar(t.ultimo, { quando: formatarDataHora(idioma, new Date(ultimo.em)) })
            : t.nenhum}
        </p>
        {pendente && (
          <p className="enviado-pendente" role="status">
            ⏳ {comConta ? t.aguardando : t.semConta}
          </p>
        )}
        <ul className="enviado-lista">
          {t.sobe.map((item) => (
            <li key={item}>✔ {item}</li>
          ))}
        </ul>
        <p className="enviado-nunca">✘ {t.nunca}</p>
        <p className="enviado-apagado">{t.conta}</p>
        <p className="enviado-apagado">{t.telemetria}</p>
        {ultimo && (
          <>
            <p className="enviado-apagado">{t.json}</p>
            <pre className="enviado-json" data-testid="ultimo-envio">
              {legivel(ultimo.json)}
            </pre>
          </>
        )}
        {pendente && (
          <>
            <p className="enviado-apagado">{t.jsonPendente}</p>
            <pre className="enviado-json" data-testid="envio-pendente">
              {legivel(pendente)}
            </pre>
          </>
        )}
        <p className="enviado-apagado">{t.bug}</p>
        <Menu
          rotulo={t.titulo}
          itens={[{ id: 'voltar', rotulo: t.voltar }]}
          onEscolher={onVoltar}
          autoFoco
        />
      </Janela>
    </main>
  );
}
