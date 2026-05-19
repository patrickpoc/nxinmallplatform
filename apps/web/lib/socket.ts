import { io, type Socket } from "socket.io-client";

/**
 * Lazily creates a Socket.io client when `NEXT_PUBLIC_SOCKET_URL` is set.
 * Messaging still works via REST polling until the realtime service is deployed.
 */
export function getRealtimeClient(): Socket | null {
  const url = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (!url) {
    return null;
  }
  return io(url, { transports: ["websocket"], autoConnect: false });
}
