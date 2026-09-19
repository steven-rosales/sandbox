import net from "node:net";

const server = net.createServer((socket) => {
  console.log({
    event: "client_connected",
    remoteAddress: socket.remoteAddress,
    remotePort: socket.remotePort,
  });

  socket.setEncoding("utf8");

  socket.on("data", (data: string) => {
    console.log({ event: "data_received", data });
  });

  socket.on("end", () => {
    console.log({ event: "client_half_closed" });
  });

  socket.on("close", () => {
    console.log({ event: "client_closed" });
  });

  socket.on("error", (error) => {
    console.error({ event: "socket_error", error });
  });
});

server.listen({ host: "127.0.0.1", port: 4005 }, () => {
  console.log("TCP server listening on 127.0.0.1:4005");
});
