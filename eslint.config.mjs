// Lint das partes que não são Next.js: os pacotes e o frontend do desktop. O site tem a própria config.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      'apps/site/**',
      'apps/desktop/src-tauri/**',
      'docs/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['packages/ui/**/*.{ts,tsx}', 'apps/desktop/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    // Fronteira: as regras do Jogo são puras — sem DOM, sem framework, sem rede (spec §11).
    files: ['packages/jogo/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'react/*', 'next', 'next/*'],
              message: 'As regras do Jogo não importam framework.',
            },
            { group: ['@tauri-apps/*'], message: 'As regras do Jogo não falam com o sistema.' },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'Sem DOM nas regras do Jogo.' },
        { name: 'document', message: 'Sem DOM nas regras do Jogo.' },
        { name: 'fetch', message: 'As regras do Jogo recebem dados; não buscam.' },
      ],
    },
  },
);
