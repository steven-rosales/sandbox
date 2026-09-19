export type MessageType = 1 | 2;

export type Frame = { type: MessageType; payload: Buffer };

const HEADER_LENGTH = 5;

export function encodeFrame(frame: Frame): Buffer {
  const buffer = Buffer.allocUnsafe(HEADER_LENGTH + frame.payload.length);

  buffer.writeUInt32BE(frame.payload.length, 0);

  buffer.writeUInt8(frame.type, 4);

  frame.payload.copy(buffer, HEADER_LENGTH);

  return buffer;
}

export function tryDecodeFrame(
  buffer: Buffer,
): { frame: Frame; remaining: Buffer } | null {
  if (buffer.length < HEADER_LENGTH) return null;

  const payloadLength = buffer.readUInt32BE(0);

  const totalLength = HEADER_LENGTH + payloadLength;
  if (buffer.length < totalLength) return null;

  const rawType = buffer.readUInt8(4);
  if (rawType !== 1 && rawType !== 2)
    throw new Error(`Invalid message type: ${rawType}`);

  const payload = buffer.subarray(HEADER_LENGTH, totalLength);
  const remaining = buffer.subarray(totalLength);

  return { frame: { type: rawType, payload }, remaining };
}

// const encoded = encodeFrame({ type: 1, payload: Buffer.from("hello") });
// const decoded = tryDecodeFrame(encoded);

// console.log(decoded?.frame.payload.toString("utf8"));
