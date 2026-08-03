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

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 'B';
  for (const u of units) {
    value /= 1024;
    if (value < 1024) {
      unit = u;
      break;
    }
  }
  return `${value.toFixed(1)} ${unit}`;
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
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
    <tr className={cn('border-b border-slate-800/60', isExternal && 'bg-amber-500/10')}>
      <td className="px-2 py-1 text-center align-middle">
        <div className="text-2xl font-bold tabular-nums text-slate-200">{slotNumber}</div>
      </td>

      <td className="px-2 py-1 text-center align-middle">
        <div className="flex flex-col items-center gap-1">
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

          {slot?.state === 'BURNING' && burn && (
            <div className="flex w-full flex-col gap-0.5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-300"
                  style={{ width: `${burnPct}%` }}
                />
              </div>
              <div className="truncate text-[10px] text-slate-400">
                {burn.n}/{burn.total} · {humanSize(burn.bytes_copied)}/{humanSize(burn.total_bytes)}
                {burn.file ? ` · ${truncate(burn.file, 22)}` : ''}
              </div>
            </div>
          )}
        </div>
      </td>

      <td className="px-2 py-1 text-center align-middle">
        <div className="mx-auto max-w-[84px] truncate text-[10px] text-slate-400">
          {slot?.label ?? ''}
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
