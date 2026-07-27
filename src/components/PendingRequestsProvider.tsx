import { useState, useCallback } from 'react';
import { PendingRequestsContext } from './PendingRequestsContext';

export function PendingRequestsProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState(0);
  const [controller, setController] = useState(() => new AbortController());

  const increment = useCallback(() => setPending(p => p + 1), []);
  const decrement = useCallback(() => setPending(p => Math.max(0, p - 1)), []);

  const cancelAll = useCallback(() => {
    controller.abort();
    setController(new AbortController());
    setPending(0);
  }, [controller]);

  return (
    <PendingRequestsContext.Provider value={{ pending, increment, decrement, cancelAll, signal: controller.signal }}>
      {children}
    </PendingRequestsContext.Provider>
  );
}
