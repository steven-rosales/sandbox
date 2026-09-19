import dgram from "node:dgram";

const socket = dgram.createSocket("udp4");

socket.send(Buffer.from("hello"), 5000, "127.0.0.1");

socket.on("message", (message) => {
  console.log(message.toString("utf8"));

  socket.close();
});
