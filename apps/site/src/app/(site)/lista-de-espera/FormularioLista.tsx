'use client';
import { useActionState, useState } from 'react';
import { IAS_DA_LISTA, TAMANHO_MAXIMO_OUTRA, type Inscricao } from '@/servidor/lista-de-espera';
import { LISTA } from '@/textos/lista-de-espera';
import { inscrever, type EstadoInscricao } from './acoes';
import estilo from './Lista.module.css';

/** As IAs como opções de menu (▶ na marcada) e o campo de texto quando é "Outra". */
export function FormularioLista({ atual }: { atual: Inscricao | null }) {
  const [estado, enviar, enviando] = useActionState<EstadoInscricao, FormData>(inscrever, {});
  const [ia, setIa] = useState<string | undefined>(atual?.ia);
  return (
    <form action={enviar} className={estilo.formulario}>
      <fieldset>
        <legend>{LISTA.pergunta}</legend>
        {IAS_DA_LISTA.map((opcao) => (
          <label key={opcao} className={estilo.opcao}>
            <input
              type="radio"
              name="ia"
              value={opcao}
              required
              // Não controlado: a action do React reseta o formulário depois de enviar, e o padrão
              // (a escolha salva, que já chegou nas props) é para onde ele deve voltar.
              defaultChecked={atual?.ia === opcao}
              onChange={() => setIa(opcao)}
            />
            {LISTA.ias[opcao]}
          </label>
        ))}
        {ia === 'outra' && (
          <label className={estilo.outra}>
            {LISTA.qualOutra}{' '}
            <input
              type="text"
              name="outra"
              required
              maxLength={TAMANHO_MAXIMO_OUTRA}
              defaultValue={atual?.outra ?? ''}
              autoFocus
            />
          </label>
        )}
      </fieldset>
      <button type="submit" className="menu-item" data-cursor="true" disabled={enviando}>
        {enviando ? LISTA.enviando : atual ? LISTA.trocar : LISTA.enviar}
      </button>
      {estado.erro && (
        <p role="alert" className="texto-erro">
          {estado.erro}
        </p>
      )}
      {estado.salvo && !enviando && (
        <p role="status" className="texto-ok">
          {LISTA.salvo}
        </p>
      )}
    </form>
  );
}
