import type { Idioma, Mensagens } from '@quiz/i18n';

declare module 'next-intl' {
  interface AppConfig {
    Locale: Idioma;
    Messages: Mensagens;
  }
}
