import net from "node:net";

import { FrameParser } from "./33-frame-parser.js";
import { encodeFrame } from "./32-protocol.js";

type Request = {
  requestId: string;
  operation: "add";
  values: number[];
};

type Response = {
  requestId: string;
  result: number;
};

const server = net.createServer((socket) => {
  const parser = new FrameParser();

  socket.on("data", (chunk: Buffer) => {
    for (const frame of parser.push(chunk)) {
      const request = JSON.parse(frame.payload.toString("utf8")) as Request;

      const result = request.values.reduce((sum, value) => sum + value, 0);

      const response: Response = { requestId: request.requestId, result };

      const payload = Buffer.from(JSON.stringify(response), "utf8");

      socket.write(encodeFrame({ type: 1, payload }));
    }
  });
});

server.listen(4003, "127.0.0.1", () =>
  console.log("Remote Procedure Call (RPC) server listening"),
);
