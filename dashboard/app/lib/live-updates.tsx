'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from './auth-context';

export type LiveStatus = 'connecting' | 'live' | 'offline';

const LiveContext = createContext<LiveStatus>('offline');

/** Status of the real-time connection, for the header indicator. */
export const useLiveStatus = () => useContext(LiveContext);

const wsUrl = () =>
  `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '').replace(/^http/, 'ws')}/ws`;

/**
 * One WebSocket for the whole app while signed in. When the server reports a new request or a
 * status change, every query is refetched so every screen shows the same state. Reconnects with
 * exponential backoff.
 */
export function LiveUpdatesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<LiveStatus>('offline');

  useEffect(() => {
    if (!isAuthenticated) {
      setStatus('offline');
      return;
    }

    let socket: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    let stopped = false;

    const connect = () => {
      setStatus('connecting');
      socket = new WebSocket(wsUrl());

      socket.onopen = () => {
        attempts = 0;
        setStatus('live');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'NEW_REQUEST') {
            toast.info('New leave request', { description: 'A request is waiting for your decision.' });
            queryClient.invalidateQueries();
          } else if (data.type === 'STATUS_UPDATE') {
            queryClient.invalidateQueries();
          }
        } catch {
          /* ignore malformed messages */
        }
      };

      socket.onclose = () => {
        if (stopped) return;
        setStatus('offline');
        timer = setTimeout(connect, Math.min(30000, 1000 * 2 ** attempts++));
      };
    };

    connect();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      socket?.close();
    };
  }, [isAuthenticated, queryClient]);

  return <LiveContext.Provider value={status}>{children}</LiveContext.Provider>;
}
