import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { PendingRequestsContext, SkippedItem } from './PendingRequestsContext';

export function PendingRequestsProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState(0);
  const [controller, setController] = useState(() => new AbortController());
  const [skipCount, setSkipCount] = useState(0);
  const [skippedItems, setSkippedItems] = useState<SkippedItem[]>([]);
  const skippedItemsRef = useRef<SkippedItem[]>([]);

  const increment = useCallback(() => setPending(p => p + 1), []);
  const decrement = useCallback(() => setPending(p => Math.max(0, p - 1)), []);

  const cancelAll = useCallback(() => {
    controller.abort();
    setController(new AbortController());
    setPending(0);
  }, [controller]);

  const addSkip = useCallback((item: SkippedItem) => {
    setSkipCount(c => c + 1);
    setSkippedItems(prev => {
      const next = [...prev, item];
      skippedItemsRef.current = next;
      return next;
    });
    toast(`"${item.title}" ya existe`, {
      description: `${item.artist}`,
      duration: 3000,
    });
  }, []);

  const resetSkips = useCallback(() => {
    setSkipCount(0);
    setSkippedItems([]);
    skippedItemsRef.current = [];
  }, []);

  const getSkippedSnapshot = useCallback(() => [...skippedItemsRef.current], []);

  return (
    <PendingRequestsContext.Provider value={{
      pending, increment, decrement, cancelAll, signal: controller.signal,
      skipCount, skippedItems, addSkip, resetSkips, skippedItemsRef,
    }}>
      {children}
    </PendingRequestsContext.Provider>
  );
}
