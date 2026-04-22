import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

function readToken(): string | null {
  return localStorage.getItem("token");
}

export function getSocket(): Socket {
  if (!socket) {
    const token = readToken();
    socket = io("/", {
      auth: { token },
      autoConnect: false,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  } else {
    socket.auth = { token: readToken() };
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
