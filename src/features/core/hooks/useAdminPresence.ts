// useAdminPresence.js
import { useEffect, useState } from "react";
import { buildWsUrl } from "@/lib/api";

const RECONNECT_DELAY_MS = 3000;
const PING_INTERVAL_MS = 10000;
const PRESENCE_WS_ENABLED = true; // deshabilitado: el hosting actual (PythonAnywhere) no soporta websockets

/** user_id -> cantidad de conexiones (pestañas/dispositivos) activas. */
function useAdminPresence(token: string | null) {
  const [online, setOnline] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (!token || !PRESENCE_WS_ENABLED) return;
    let ws: WebSocket | null = null;
    let heartbeatInterval: NodeJS.Timeout | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let stopped = false;

    function connect() {
      ws = new WebSocket(buildWsUrl("/ws/admin/presence/", token as string));

      ws.onopen = () => {
        console.log("[admin] conectado");
        heartbeatInterval = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, PING_INTERVAL_MS);
      };

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        console.log("[admin] evento:", data);

        if (data.type === "snapshot") {
          setOnline(new Map(Object.entries(data.online).map(([id, count]) => [id, Number(count)])));
        } else if (data.type === "presence.update") {
          setOnline((prev) => {
            const next = new Map(prev);
            if (data.status === "online") next.set(String(data.user_id), Number(data.connections ?? 1));
            else next.delete(String(data.user_id));
            return next;
          });
        }
      };

      ws.onerror = (e) => console.error("[admin] error:", e);

      ws.onclose = () => {
        console.log("[admin] desconectado, reintentando en 3s");
        if (heartbeatInterval !== null) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }
        if (!stopped) reconnectTimeout = setTimeout(connect, RECONNECT_DELAY_MS);
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

  return online;
}

export default useAdminPresence;
