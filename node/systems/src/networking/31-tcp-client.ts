import net from "node:net";
import readline from "node:readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const socket = net.createConnection({ host: "127.0.0.1", port: 4005 }, () => {
  console.log("connected");
  socket.write("hello from Node\n");
});

socket.setEncoding("utf8");

rl.on("line", (line) => {
  if (line.toLowerCase() === "close") {
    socket.end();
    rl.close();
    return;
  }

  socket.write(`${line}\n`);
});

socket.on("data", (data: string) => {
  console.log({ response: data });
  socket.end();
});

socket.on("close", () => {
  console.log("connection closed");
  rl.close();
  process.exit(0);
});

socket.on("error", (error) => {
  console.log(error);
  rl.close();
});
