import { io } from "socket.io-client";

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || "http://localhost:4000").replace(/\/$/, "");

export function createSocket(token) {
  return io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 700,
    reconnectionDelayMax: 5000,
  });
}
