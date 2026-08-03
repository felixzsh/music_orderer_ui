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
    <div className="flex w-full flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={cn('size-2 rounded-full', conn.dot)} />
          <span className="text-sm font-bold tracking-widest text-slate-200">BARDO HUB</span>
        </div>
        <span className="text-[10px] text-slate-500">{conn.label}</span>
      </div>

      <div className="flex flex-col p-2">
        <table className="w-full table-fixed border-separate border-spacing-0">
          <thead className="bg-slate-900">
            <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500">
              <th className="px-2 py-1.5 text-center font-medium" style={{ width: '9%' }}>Port</th>
              <th className="px-2 py-1.5 text-center font-medium" style={{ width: '14%' }}>Label</th>
              <th className="px-2 py-1.5 text-center font-medium" style={{ width: '50%' }}>Progress</th>
              <th className="px-2 py-1.5 text-center font-medium" style={{ width: '12%' }}>State</th>
              <th className="px-2 py-1.5 text-center font-medium" style={{ width: '6%' }} title="Activo = external (USBs de clientes)">
                Ext
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }, (_, i) => 10 - i).map(n => (
              <HubBay
                key={n}
                slotNumber={n}
                slot={slots ? slots[String(n)] ?? null : null}
                connected={status === 'connected'}
                pending={pendingSlot === n}
                onToggleSource={onToggleSource}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-800 px-4 py-2 text-[10px] text-slate-500">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1"><span className="hub-led hub-led--sm hub-led--free" /> Libre</span>
          <span className="flex items-center gap-1"><span className="hub-led hub-led--sm hub-led--burning" /> Quemando</span>
          <span className="flex items-center gap-1"><span className="hub-led hub-led--sm hub-led--completed" /> Listo</span>
          <span className="flex items-center gap-1"><span className="hub-led hub-led--sm hub-led--error" /> Error</span>
        </div>
        <div className="mt-1 flex items-center gap-1">
          <span
            className="inline-block"
            style={{ width: 10, height: 10, backgroundColor: '#a78bfa', borderRadius: 2 }}
          />
          Fila morada = solo USBs de clientes (externos), no USB propias
        </div>
        <div className="mt-1">
          {lastEventAt ? `Última actualización: ${lastEventAt.toLocaleTimeString()}` : 'Esperando estado…'}
        </div>
      </div>
    </div>
  );
}
