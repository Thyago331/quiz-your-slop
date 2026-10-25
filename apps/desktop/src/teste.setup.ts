import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Sem globals no vitest, a Testing Library não limpa a tela sozinha entre os testes.
afterEach(cleanup);
