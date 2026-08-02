import { useCallback } from 'react';
import { HubPanel } from '../components/hub/HubPanel';
import { useHubEvents } from '../hooks/useHubEvents';
import { useSetSlotSource } from '../hooks/useHubSlots';
import type { UsbSource } from '../types/hub';

export function HubStatusPage() {
  const { slots, status, lastEventAt, setSlotUsbSource } = useHubEvents(true);
  const { setSource, pendingSlot } = useSetSlotSource();

  const handleToggleSource = useCallback(
    async (slot: number, next: UsbSource) => {
      const prev = slots?.[String(slot)]?.usb_source;
      if (prev === next) return;
      setSlotUsbSource(slot, next); // optimista
      try {
        await setSource(slot, next);
      } catch {
        if (prev) setSlotUsbSource(slot, prev); // revertir
      }
    },
    [slots, setSlotUsbSource, setSource],
  );

  return (
    <div className="flex h-full gap-4 overflow-hidden bg-background p-4">
      <HubPanel
        slots={slots}
        status={status}
        lastEventAt={lastEventAt}
        pendingSlot={pendingSlot}
        onToggleSource={handleToggleSource}
      />

      <div className="flex min-w-0 flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/25">
        <div className="text-center text-sm text-muted-foreground/60">
          <div className="text-lg font-medium tracking-wide">Métricas del sistema</div>
          <div className="mt-1 text-xs">Panel reservado para el dashboard de estadísticas de burning</div>
        </div>
      </div>
    </div>
  );
}
