import type { ReactNode } from 'react';

export const metadata = { title: 'Quiz your slop' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
