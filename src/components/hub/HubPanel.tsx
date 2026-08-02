import { cn } from '../../components/ui/utils';
import { HubBay } from './HubBay';
import type { HubConnectionStatus, HubSlot, UsbSource } from '../../types/hub';

interface HubPanelProps {
  slots: Record<string, HubSlot> | null;
  status: HubConnectionStatus;
  lastEventAt: Date | null;
  pendingSlot?: number | null;
  onToggleSource: (slot: number, next: UsbSource) => void;
}

const CONNECTION_LABEL: Record<HubConnectionStatus, { label: string; dot: string }> = {
  connecting: { label: 'Conectando…', dot: 'bg-amber-400 animate-pulse' },
  connected: { label: 'En línea', dot: 'bg-emerald-400' },
  offline: { label: 'Sin conexión', dot: 'bg-red-500' },
};

export function HubPanel({ slots, status, lastEventAt, pendingSlot, onToggleSource }: HubPanelProps) {
  const conn = CONNECTION_LABEL[status];

  return (
    <div className="flex h-full w-[340px] flex-col rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={cn('size-2 rounded-full', conn.dot)} />
          <span className="text-sm font-bold tracking-widest text-slate-200">BARDO HUB</span>
        </div>
        <span className="text-[10px] text-slate-500">{conn.label}</span>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
          <HubBay
            key={n}
            slotNumber={n}
            slot={slots ? slots[String(n)] ?? null : null}
            connected={status === 'connected'}
            pending={pendingSlot === n}
            onToggleSource={onToggleSource}
          />
        ))}
      </div>

      <div className="border-t border-slate-800 px-4 py-2 text-[10px] text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="hub-led hub-led--free" /> Libre</span>
          <span className="flex items-center gap-1"><span className="hub-led hub-led--burning" /> Quemando</span>
          <span className="flex items-center gap-1"><span className="hub-led hub-led--completed" /> Listo</span>
          <span className="flex items-center gap-1"><span className="hub-led hub-led--error" /> Error</span>
        </div>
        <div className="mt-1">
          {lastEventAt ? `Última actualización: ${lastEventAt.toLocaleTimeString()}` : 'Esperando estado…'}
        </div>
      </div>
    </div>
  );
}
