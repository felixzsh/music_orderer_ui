import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '../constants/api';
import { authHeaders } from '../utils/headers';
import type { HubSlotsResponse, UsbSource } from '../types/hub';

/**
 * Configuración de slots (internal/external): GET del snapshot de configuración
 * y PUT para cambiar el source de un slot.
 */
export function useHubSlots(enabled: boolean) {
  const [config, setConfig] = useState<HubSlotsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/hub/slots`, {
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setConfig(await response.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar slots');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) refresh();
  }, [enabled, refresh]);

  return { config, loading, error, refresh };
}

export function useSetSlotSource() {
  const [pendingSlot, setPendingSlot] = useState<number | null>(null);
  const [error, setError] = useState<{ slot: number; message: string } | null>(null);

  const setSource = useCallback(async (slot: number, usb_source: UsbSource) => {
    setPendingSlot(slot);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/hub/slots/${slot}/usb-source`, {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ usb_source }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.reason || `HTTP ${response.status}`);
      }
      return body;
    } catch (e) {
      setError({ slot, message: e instanceof Error ? e.message : 'Error al cambiar slot' });
      throw e;
    } finally {
      setPendingSlot(null);
    }
  }, []);

  return { setSource, pendingSlot, error, clearError: () => setError(null) };
}
