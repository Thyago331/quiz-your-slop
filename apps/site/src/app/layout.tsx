import type { ReactNode } from 'react';
import '@quiz/ui/estilo.css';

export const metadata = { title: 'Quiz your slop' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="pixel">{children}</body>
    </html>
  );
}
