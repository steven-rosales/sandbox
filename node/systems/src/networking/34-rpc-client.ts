import net from "node:net";
import { randomUUID } from "node:crypto";
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

const client = net.createConnection({ host: "127.0.0.1", port: 4003 }, () => {
  console.log("Connected to RPC");

  const request: Request = {
    requestId: randomUUID(),
    operation: "add",
    values: [1, 2, 3],
  };

  const frame = encodeFrame({
    type: 1,
    payload: Buffer.from(JSON.stringify(request), "utf8"),
  });

  client.write(frame);
});

const parser = new FrameParser();

client.on("data", (chunk: Buffer) => {
  for (const frame of parser.push(chunk)) {
    const response = JSON.parse(frame.payload.toString("utf8")) as Response;
    console.log(`Received RPC response `, response);

    client.end();
  }
});

client.on("close", () => {
  console.log("RPC client closed");
});

client.on("error", (err) => {
  console.log(`RPC client had an error: ${err}`);
});
