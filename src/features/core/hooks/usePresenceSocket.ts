// usePresenceSocket.js
import { useEffect } from "react";
import { buildWsUrl } from "@/lib/api";

const PING_INTERVAL_MS = 10000;
const RECONNECT_DELAY_MS = 3000;

function usePresenceSocket(token: string | null) {
  useEffect(() => {
    if (!token) return;
    let ws: WebSocket | null = null;
    let heartbeatInterval: NodeJS.Timeout | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let stopped = false;

    function connect() {
      ws = new WebSocket(buildWsUrl("/ws/presence/", token as string));

      ws.onopen = () => {
        console.log("[presence] conectado");
        heartbeatInterval = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, PING_INTERVAL_MS);
      };

      ws.onmessage = (e) => {
        console.log("[presence] mensaje:", e.data);
      };

      ws.onclose = () => {
        console.log("[presence] desconectado, reintentando en 3s");
        if (heartbeatInterval !== null) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }
        if (!stopped) reconnectTimeout = setTimeout(connect, RECONNECT_DELAY_MS);
      };

      ws.onerror = (e) => {
        console.error("[presence] error:", e);
      };
    }

    connect();
    return () => {
      stopped = true;
      if (heartbeatInterval !== null) clearInterval(heartbeatInterval);
      if (reconnectTimeout !== null) clearTimeout(reconnectTimeout);
      ws?.close();
    };
  }, [token]);
}

export default usePresenceSocket;
