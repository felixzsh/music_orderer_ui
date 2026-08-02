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
  const canChange = connected && !!slot && slot.state === 'FREE' && !pending;

  const burn = slot?.burn;
  const burnPct = burn && burn.total_bytes > 0
    ? Math.min(100, Math.round((burn.bytes_copied / burn.total_bytes) * 100))
    : 0;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors',
        isExternal
          ? 'border-amber-500/40 bg-amber-500/10'
          : 'border-slate-700 bg-slate-800/40',
      )}
    >
      <span className="text-xs font-bold tabular-nums text-slate-300 w-14">
        SLOT {String(slotNumber).padStart(2, '0')}
      </span>

      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('hub-led', `hub-led--${(slot?.state ?? 'DISCONNECTED').toLowerCase()}`)} />
          <span className="text-xs font-medium text-slate-200">
            {slot ? STATE_LABEL[slot.state] : '…'}
          </span>
          <span
            className={cn(
              'rounded px-1.5 py-px text-[10px] font-bold tracking-wide',
              isExternal ? 'bg-amber-500/20 text-amber-300' : 'bg-sky-500/20 text-sky-300',
            )}
          >
            {isExternal ? 'EXT' : 'INT'}
          </span>
          {slot?.temp_id && (
            <span className="text-xs font-mono text-slate-300 truncate">{slot.temp_id}</span>
          )}
        </div>

        {slot?.state === 'BURNING' && burn && (
          <div className="flex flex-col gap-0.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-300"
                style={{ width: `${burnPct}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {burn.n}/{burn.total} archivos · {humanSize(burn.bytes_copied)}/{humanSize(burn.total_bytes)}
              {burn.file ? ` · ${truncate(burn.file, 28)}` : ''}
            </div>
          </div>
        )}

        {slot && slot.state === 'COMPLETED' && slot.label && (
          <div className="text-[10px] text-slate-400 truncate">{slot.label}</div>
        )}
      </div>

      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'text-[10px] font-bold',
                  canChange ? 'text-slate-400' : 'text-slate-600',
                )}
              >
                INT
              </span>
              <Switch
                checked={isExternal}
                disabled={!canChange}
                onCheckedChange={() => onToggleSource(slotNumber, isExternal ? 'internal' : 'external')}
                className={canChange ? '' : 'opacity-60'}
                aria-label={`Cambiar source del slot ${slotNumber}`}
              />
              <span
                className={cn(
                  'text-[10px] font-bold',
                  canChange ? 'text-slate-400' : 'text-slate-600',
                )}
              >
                EXT
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left">
            {!slot
              ? 'Conectando…'
              : slot.state === 'FREE'
                ? 'Cambiar propósito (solo slots libres)'
                : `Solo se cambia en slots libres (estado: ${STATE_LABEL[slot.state].toLowerCase()})`}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
