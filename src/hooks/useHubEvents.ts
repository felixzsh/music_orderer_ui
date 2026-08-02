import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../constants/api';
import { authHeaders } from '../utils/headers';
import type { HubConnectionStatus, HubSlot, UsbSource } from '../types/hub';

/**
 * Cliente SSE por fetch + ReadableStream.
 *
 * EventSource nativo no permite mandar el header Authorization, así que
 * parseamos el stream manualmente. Reconecta con backoff (1s -> 10s), se pausa
 * cuando la pestaña queda oculta y sincroniza con snapshot + deltas `slot`.
 */
export function useHubEvents(enabled: boolean) {
  const [slots, setSlots] = useState<Record<string, HubSlot> | null>(null);
  const [status, setStatus] = useState<HubConnectionStatus>('connecting');
  const [lastEventAt, setLastEventAt] = useState<Date | null>(null);

  const controllerRef = useRef<AbortController | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef(1000);

  const stop = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    stop();
    if (!enabled) return;

    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus('connecting');

    const run = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/hub/events`, {
          headers: authHeaders(),
          signal: controller.signal,
        });
        if (!response.ok || !response.body) {
          throw new Error(`SSE HTTP ${response.status}`);
        }

        backoffRef.current = 1000;
        setStatus('connected');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let eventName = '';
        let dataLines: string[] = [];

        const dispatch = () => {
          setLastEventAt(new Date());
          if (!eventName || dataLines.length === 0) {
            eventName = '';
            dataLines = [];
            return;
          }
          try {
            const payload = JSON.parse(dataLines.join('\n'));
            if (eventName === 'snapshot') {
              setSlots(payload.slots);
            } else if (eventName === 'slot') {
              setSlots(prev => {
                const base = prev ?? {};
                return { ...base, [String(payload.slot)]: payload.state };
              });
            }
          } catch {
            // evento malformado: se ignora
          }
          eventName = '';
          dataLines = [];
        };

        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let idx: number;
          while ((idx = buffer.indexOf('\n\n')) !== -1) {
            const block = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            for (const line of block.split('\n')) {
              if (line.startsWith('event:')) {
                eventName = line.slice(6).trim();
              } else if (line.startsWith('data:')) {
                dataLines.push(line.slice(5).trim());
              }
              // los comentarios ": ping" son heartbeat: no hacen nada pero
              // mantienen lastEventAt fresco via dispatch().
            }
            dispatch();
          }
        }
      } catch (err) {
        if (controller.signal.aborted) return; // corte intencional (pausa/unmount)
        setStatus('offline');
        retryTimerRef.current = setTimeout(connect, backoffRef.current);
        backoffRef.current = Math.min(backoffRef.current * 2, 10000);
      }
    };

    run();
  }, [enabled, stop]);

  useEffect(() => {
    if (enabled) connect();
    return () => stop();
  }, [enabled, connect, stop]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else if (enabled) {
        connect();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [enabled, connect, stop]);

  const setSlotUsbSource = useCallback((slot: number, usb_source: UsbSource) => {
    setSlots(prev => {
      if (!prev || !prev[String(slot)]) return prev;
      return { ...prev, [String(slot)]: { ...prev[String(slot)], usb_source } };
    });
  }, []);

  return { slots, status, lastEventAt, setSlotUsbSource };
}
