import { cn } from '../../components/ui/utils';
import { Switch } from '../../components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';
import type { HubSlot, HubSlotState, UsbSource } from '../../types/hub';

const STATE_LABEL: Record<HubSlotState, string> = {
  FREE: 'Libre',
  BURNING: 'Quemando',
  COMPLETED: 'Listo',
  DISCONNECTED: 'Desconectado',
  ERROR: 'Error',
};

function burnSize(bytes: number, totalBytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let div = 1;
  let unit = 'B';
  for (const u of units) {
    if (totalBytes < div * 1024) {
      unit = u;
      break;
    }
    div *= 1024;
  }
  const fmt = (b: number) => (div === 1 ? `${b}` : `${(b / div).toFixed(1)}`);
  return `${fmt(bytes)}/${fmt(totalBytes)} ${unit}`;
}

interface HubBayProps {
  slotNumber: number;
  slot: HubSlot | null;
  connected: boolean;
  pending?: boolean;
  onToggleSource: (slot: number, next: UsbSource) => void;
}

export function HubBay({ slotNumber, slot, connected, pending, onToggleSource }: HubBayProps) {
  const isExternal = slot?.usb_source === 'external';
  const isFreeOrDisconnected = !!slot && (slot.state === 'FREE' || slot.state === 'DISCONNECTED');
  const canChange = connected && isFreeOrDisconnected && !pending;

  const burn = slot?.burn;
  const burnPct = burn && burn.total_bytes > 0
    ? Math.min(100, Math.round((burn.bytes_copied / burn.total_bytes) * 100))
    : 0;

  return (
    <tr
      className={cn(
        'border-b border-slate-800/60',
        isExternal ? 'hub-row--external' : 'hub-row--internal',
      )}
    >
      <td className="px-2 py-1 text-center align-middle">
        <div className="text-2xl font-bold tabular-nums text-slate-200">{slotNumber}</div>
      </td>

      <td className="px-2 py-1 text-center align-middle">
        <div className="mx-auto max-w-[84px] truncate text-[10px] text-slate-400">
          {slot?.label ?? ''}
        </div>
      </td>

      <td className="px-2 py-1 align-middle">
        {slot?.state === 'BURNING' && burn ? (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 20,
              overflow: 'hidden',
              borderRadius: 9999,
              backgroundColor: 'rgba(51, 65, 85, 0.6)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: `${burnPct}%`,
                borderRadius: 9999,
                backgroundColor: '#fbbf24',
                transition: 'width 0.3s ease',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 500,
                color: '#f8fafc',
                textShadow: '0 1px 2px rgba(0,0,0,0.85)',
                whiteSpace: 'nowrap',
              }}
            >
              {burn.n}/{burn.total} · {burnSize(burn.bytes_copied, burn.total_bytes)}
            </div>
          </div>
        ) : null}
      </td>

      <td className="px-2 py-1 text-center align-middle">
        <div className="flex items-center justify-center">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    'cursor-default',
                    'hub-led',
                    `hub-led--${(slot?.state ?? 'DISCONNECTED').toLowerCase()}`,
                  )}
                />
              </TooltipTrigger>
              <TooltipContent side="top">
                {slot ? `Puerto ${slotNumber} · ${STATE_LABEL[slot.state]}` : 'Conectando…'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </td>

      <td className="px-2 py-1 text-center align-middle">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Switch
                  checked={isExternal}
                  disabled={!canChange}
                  onCheckedChange={() => onToggleSource(slotNumber, isExternal ? 'internal' : 'external')}
                  aria-label={`Cambiar source del puerto ${slotNumber}`}
                />
              </span>
            </TooltipTrigger>
            <TooltipContent side="left">
              {!slot
                ? 'Conectando…'
                : isFreeOrDisconnected
                  ? 'External = USBs de clientes'
                  : `Solo se cambia en puertos libres o desconectados (estado: ${STATE_LABEL[slot.state].toLowerCase()})`}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </td>
    </tr>
  );
}
