import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/** Link, redirect e caminho atual que já sabem do prefixo de idioma (next-intl). */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
