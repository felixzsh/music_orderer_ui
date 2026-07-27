import { createContext } from 'react';

export const PendingRequestsContext = createContext<{
  pending: number;
  increment: () => void;
  decrement: () => void;
  cancelAll: () => void;
  signal: AbortSignal;
}>({
  pending: 0,
  increment: () => {},
  decrement: () => {},
  cancelAll: () => {},
  signal: new AbortController().signal,
});
