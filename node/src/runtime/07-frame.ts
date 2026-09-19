import { Buffer } from "node:buffer";

type MessageType = 1 | 2;

type DecodedFrame = {
  type: MessageType;
  payload: string;
};

function encodeFrame(type: MessageType, payload: string): Buffer {
  const payloadBytes = Buffer.from(payload, "utf8");

  const headerLength = 5;
  const frame = Buffer.allocUnsafe(headerLength + payloadBytes.length);

  // Bytes 0-3: unsigned 32-bit payload length
  frame.writeUInt32BE(payloadBytes.length, 0);

  // Byte 4: message type
  frame.writeUInt8(type, 4);

  // Bytes 5 onward: payload
  payloadBytes.copy(frame, headerLength);

  return frame;
}

function decodeFrame(frame: Buffer): DecodedFrame {
  const headerLength = 5;

  if (frame.length < headerLength)
    throw new Error("Frame is smaller than header");

  const payloadLength = frame.readUInt32BE(0);
  const rawType = frame.readUInt8(4);

  if (rawType !== 1 && rawType !== 2)
    throw new Error(`Unknown message type: ${rawType}`);

  const expectedLength = headerLength + payloadLength;

  if (frame.length !== expectedLength)
    throw new Error(
      `Invalid frame length: expected ${expectedLength}, ` +
        `received ${frame.length}`,
    );

  const payload = frame.subarray(headerLength).toString("utf8");

  return { type: rawType, payload };
}

const encoded = encodeFrame(1, "start-machine");

console.log(encoded);
console.log(decodeFrame(encoded));
