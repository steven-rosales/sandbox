/**
 * test it using npx wscat ws://localhost:3500
 */

import { WebSocketServer } from "ws";

const server = new WebSocketServer({ port: 3500 });

server.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("message", (message) => {
    console.log("Message from client:", message.toString());
    socket.send(`Server received: ${message}`);
  });

  socket.on("close", (code, reason) => {
    console.log("Client disconnected", code, reason.toString());
  });
});

console.log("WebSocket server running on ws://localhost:3500");
