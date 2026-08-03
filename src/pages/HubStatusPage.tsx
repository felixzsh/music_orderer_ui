import { useCallback, useState } from 'react';
import { ToggleLeft, ToggleRight, Radio, BarChart3 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { HubPanel } from '../components/hub/HubPanel';
import { useMobile } from '../hooks/useMobile';
import { useHubEvents } from '../hooks/useHubEvents';
import { useSetSlotSource } from '../hooks/useHubSlots';
import type { UsbSource } from '../types/hub';

function MetricsPlaceholder() {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25">
      <div className="text-center text-sm text-muted-foreground/60">
        <div className="text-lg font-medium tracking-wide">Métricas del sistema</div>
        <div className="mt-1 text-xs">Panel reservado para el dashboard de estadísticas de burning</div>
      </div>
    </div>
  );
}

export function HubStatusPage() {
  const isMobile = useMobile();
  const [mobileView, setMobileView] = useState<'hub' | 'metrics'>('hub');
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

  const hubPanel = (
    <HubPanel
      slots={slots}
      status={status}
      lastEventAt={lastEventAt}
      pendingSlot={pendingSlot}
      onToggleSource={handleToggleSource}
    />
  );

  if (isMobile) {
    return (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center justify-center gap-3 border-b bg-background p-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileView(mobileView === 'hub' ? 'metrics' : 'hub')}
            className="relative flex items-center gap-3 overflow-hidden px-5"
          >
            <div className={`flex items-center gap-2 transition-colors ${mobileView === 'hub' ? '' : 'text-muted-foreground'}`}>
              <Radio className="h-4 w-4" />
              <span>Hub</span>
            </div>
            {mobileView === 'hub' ? <ToggleLeft className="h-5 w-5" /> : <ToggleRight className="h-5 w-5" />}
            <div className={`flex items-center gap-2 transition-colors ${mobileView === 'metrics' ? '' : 'text-muted-foreground'}`}>
              <BarChart3 className="h-4 w-4" />
              <span>Métricas</span>
            </div>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {mobileView === 'hub' ? hubPanel : <MetricsPlaceholder />}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-background">
      <div className="h-full w-1/3 border-r p-4">
        {hubPanel}
      </div>
      <div className="h-full w-2/3 p-4">
        <MetricsPlaceholder />
      </div>
    </div>
  );
}
