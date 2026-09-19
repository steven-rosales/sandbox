import dgram from "node:dgram";

const socket = dgram.createSocket("udp4");

socket.on("message", (message, remote) => {
  console.log({
    from: `${remote.address}:${remote.port}`,
    message: message.toString("utf8"),
  });

  socket.send(Buffer.from("ack"), remote.port, remote.address);
});

socket.bind(5000, "127.0.0.1", () => {
  console.log("UDP server listening");
});
