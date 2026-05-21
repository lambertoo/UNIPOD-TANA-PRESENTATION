"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { CrossingEvent } from "./api";

const WEBSOCKET_URL = "ws://localhost:8000/ws/events";
const RECONNECT_DELAY_MS = 5000;

export function useVisitorEvents() {
  const [latestEvent, setLatestEvent] = useState<CrossingEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const websocketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) return;

    const websocket = new WebSocket(WEBSOCKET_URL);

    websocket.onopen = () => {
      setIsConnected(true);
    };

    websocket.onmessage = (messageEvent) => {
      try {
        const parsedEvent: CrossingEvent = JSON.parse(messageEvent.data);
        setLatestEvent(parsedEvent);
      } catch {
        // skip malformed messages
      }
    };

    websocket.onclose = () => {
      setIsConnected(false);
      reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
    };

    websocket.onerror = () => {
      websocket.close();
    };

    websocketRef.current = websocket;
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      websocketRef.current?.close();
    };
  }, [connect]);

  return { latestEvent, isConnected };
}
