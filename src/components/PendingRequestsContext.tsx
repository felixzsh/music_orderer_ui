import { createContext, MutableRefObject } from 'react';

export interface SkippedItem {
  title: string;
  artist: string;
}

export const PendingRequestsContext = createContext<{
  pending: number;
  increment: () => void;
  decrement: () => void;
  cancelAll: () => void;
  signal: AbortSignal;
  skipCount: number;
  skippedItems: SkippedItem[];
  addSkip: (item: SkippedItem) => void;
  resetSkips: () => void;
  skippedItemsRef: MutableRefObject<SkippedItem[]>;
}>({
  pending: 0,
  increment: () => {},
  decrement: () => {},
  cancelAll: () => {},
  signal: new AbortController().signal,
  skipCount: 0,
  skippedItems: [],
  addSkip: () => {},
  resetSkips: () => {},
  skippedItemsRef: { current: [] },
});
