export type HubSlotState = 'FREE' | 'BURNING' | 'COMPLETED' | 'DISCONNECTED' | 'ERROR';

export type UsbSource = 'internal' | 'external';

export interface HubBurn {
  file: string;
  n: number;
  total: number;
  bytes_copied: number;
  total_bytes: number;
}

export interface HubSlot {
  state: HubSlotState;
  temp_id: string | null;
  label: string | null;
  usb_source: UsbSource;
  since?: string;
  burn?: HubBurn;
}

export interface HubSlotsResponse {
  updated_at: string;
  slots: Record<string, { usb_source: UsbSource; state: HubSlotState }>;
}

export type HubConnectionStatus = 'connecting' | 'connected' | 'offline';
