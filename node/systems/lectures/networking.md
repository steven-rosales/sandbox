# Networking From Sockets to HTTP

This is where Node starts looking like real systems software. The goal is to not memorize networking APIs. It is to understand this stack:

```txt
application protocol
  ↓
HTTP / WebSocket / custom protocol
  ↓
TLS
  ↓
TCP or UDP
  ↓
IP
  ↓
networking interfaces
```

At the Node level, the most important modules are:

- `node:net`
- `node:dgram`
- `node:tls`
- `node:http`
- `node:http2`
- `node:dns`

Node's networking APIs expose asynchronous socket interfaces directly, so you can work below Express and see where connection management, buffering, framing, timeouts, and backpressure actually come from.

## 1. Start with the Correct Mental Model

When two programs communicate over a network, they do not exchange JavaScript objects, **they exchange bytes**. A simplified TCP request path is:

```txt
JavaScript object
  ↓
serialization
  ↓
Buffer / bytes
  ↓
socket.write()
  ↓
Node/libuv
  ↓
kernel socket buffer
  ↓
TCP
  ↓
IP packets
  ↓
network
  ↓
remote kernel
  ↓
remote socket receive buffer
  ↓
remote Node process
  ↓
Buffer
  ↓
parser
  ↓
application object
```

A networked system is therefore built from several distinct concerns:

- serialization
- framing
- transport
- addressing
- flow control
- timeouts
- retries
- security
- application semantics

Do not mix them mentally.

## 2. IP Addresses, Ports, Sockets

An IP address identifies a network interface or host endpoint. Examples:

- 127.0.0.1
- 192.168.1.50
- 10.0.0.17
- ::1
- 2001:db8::1

A port identifies an endpoint within a host:

- IP: 192.168.1.50
- Port: 5432

Common examples:

| Technology | Port |
| :--------- | :--- |
| HTTP       | 80   |
| HTTPS      | 443  |
| PostgreSQL | 5432 |
| Redis      | 6379 |

A network connection is conceptually distinguished by tuples like: $(\text{source IP, source port, destination IP, destination port})$. For example: 192.168.1.20:51123 -> 203.0.113.15:443. The client's local port is often selected automatically by the OS from an ephemeral-port range. A socket is the OS abstraction your process uses to interact with a network endpoint.

## 3. TCP: A Reliable Ordered Byte Stream

TCP gives you several important guarantees:

- ordered delivery
- retransmission of lost data
- duplicate suppression
- flow control
- congestion control

It does not give you application messages. If the sender executes:

```ts
socket.write("hello");
socket.write("world");
```

the receiver might observer: `helloworld` or `hel\nlowor\nld`, or another segmentation. The only guarantee relevant here is **byte order preserved**, not write boundaries preserved. The distinction is fundamental.

## 4. Building Raw TCP Server

Built in [tcp-server](../src/networking/30-tcp-server.ts), you can test it from a terminal with `nc 127.0.0.1 4000` and then type `hello`, which you should receive `echo: hello`. The architecture is:

```txt
terminal / nc
  ↓ TCP
kernel
  ↓
Node socket
  ↓
'data' event
```

Node's `node:net` API gives you asynchronous TCP servers and clients backed by streams. A socket is both readable and writable.

## 5. Build the TCP Client in Node

Built in [tcp-client](../src/networking/31-tcp-client.ts). The connection lifetime is roughly:

```txt
client creates socket
  ↓
TCP handshake
  ↓
connected
  ↓
exchange bytes
  ↓
one or both sides close
  ↓
connection terminated
```

The TCP handshake conceptually:

```txt
client                    server

SYN   ----------------->
      <-----------------  SYN-ACK
ACK   ----------------->
```

Only after that is the connection established.

## 6. TCP is Full Duplex

A TCP connection is not request -> response. TCP itself is

```txt
              bytes ->
client  ================  server
          <- bytes
```

Both sides may trasmit independently. HTTP request/response is an **application layer convention built on top of that**. This matters for:

- WebSockets
- database protocols
- message brokers
- custom RPC protocols
- device communication

A client could send 10 requests before any response arrives if the application protocol allows it.

## 7. Half-Close vs Full Close

TCP lets one direction close while the other remains open. Suppose the client calls `socket.end()`. Conceptually:

```txt
client -> server
CLOSED

client <- server
still possible
```

This is a half close.

Node exposes socket lifecycle through events such as 'end', 'close', 'error'. Do not interpret 'end' as necessarily meaning _all connections resources are already destroyed_. Understand the state transition instead.

### 8. The First Big Problem: Framing

Let's deliberatly write a bad protocol with sender:

```ts
socket.write(JSON.stringify({ type: "order", id: 1 }));

socket.write(JSON.stringify({ type: "order", id: 2 }));
```

Receiver may see: `{"type": "order", "id": 1}{"type": "order", "id": 2}`. You cannot safely do: `JSON.parse(chunk.toString())` because `data` event is **not equivalent to one message**. You need framing protocol. Common strategies:

- fixed-length messages
- delimeter terminated
- length prefix
- self describing formats

For general binary protocols, length prefix framing is excellent.

## 9. Build a Real Framed Protocol

We can define the following:

```txt
4 bytes   payload length
1 byte    message type
N bytes   payload
```

Frame:

```txt
-----------------------------------
| uint32 len  |  type  |  payload |
| 4 bytes     |  1     |  N bytes |
-----------------------------------
```

The decoder in [protocol](../src/networking/32-protocol.ts) handles the real TCP problem:

- maybe header incomplete
- maybe payload incomplete
- maybe multiple frames present

## 10. Build a Streaming Frame Parser

In [frame-parser](../src/networking/33-frame-parser.ts), we have conceptually:

```txt
                                                          -> yes -> decode -> remaining bytes -> repeat
TCP chunks -> append to accumulator -> enough for frame?
                                                          -> no -> wait
```

This pattern appears everywhere:

- database protocol parsers
- Kafka clients
- Redis clients
- WebSocket parsers
- TLS implementations
- hardware protocols

## 11. Build a Request-Response Protocol with Request IDs

Distributed systems need correlation. Let's define a JSON payload with response:

```ts
type Request = {
  requestId: string;
  operation: "add";
  values: number[];
};

type Response = {
  requestId: string;
  result: number;
};
```

This is implemented in [rpc-server](../src/networking/34-rpc-server.ts). Now the protocol is no longer ties to ordering. You can send request A -> request B -> request C, and theoretically respond responce C -> response A -> response B, because `requestId` lets the client correlate them. That becomes essential once concurrency exists.

## 12. Add Deadlines, Not Just Waiting Forever

A network call without a deadline is operationally dangerous. Bad: `await callRemoteService();`. What if:

- remote host alive
- connection alive
- remote service wedged

The caller may wait indefinitely. Instead think: $\text{deadline} = \text{shortTime} + \text{allowedLatency}$. For example:

```ts
async function withTimeout<T>(operation: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    operation,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
    }),
  ]);
}
```

Better still, use cancellation when the underlying API supports `AbortSignal`. A timeout that only rejects the outer Promise while leaving underlying work alive may leak work. Think:

```txt
deadline expired
  ↓
caller stops caring
  ↓
underlying work should also stop
```

## 13. Timeout vs Deadline

These are related but conceptually different. A timeout says, _allow operation to run 2 seconds_. A deadline says, _the entire request must finish by 11:30:02.500_. Suppose an incoming request has a 2-second budget. It spends 300ms in auth and 500ms in the database. Remaining budget is $2000 - 300 - 500 = 1200\text{ms}$. Passing a fresh 2-second timeout downstream violates the original budget.

Instead propagate: deadline = absolute timestamp. Downstream computes: remaining = deadline - currentTime. This is common in serious RPC systems.

## 14. Backpressure Exists at the Network Level Too

Remember from the runtime lecture:

```ts
const canContinue = socket.write(data);

if (!canContinue) await once(socket, "drain");
```

A socket is a writable stream. You are not writing directly onto the physical network. The path resembles:

```txt
application
  ↓
Node writable buffer
  ↓
kernel send buffer
  ↓
TCP congestion / flow control
  ↓
network
```

If the receiver is slow, buffers fill. Eventually, `socket.write(...)` returns `false`. Ignoring that means your application becomes the queue.

Node streams are specifically built around this pressure mechanism.

## 15. TCP Flow Control vs Congestion Control

Do not confuse these. These are transport layer mechanisms. Your application needs to own overload controls.

For example, TCP is healthy but database saturated. So you still need:

- bounded concurrency
- queue limits
- load shedding

### Flow Control

Protects the **receiver**. If the receiver cannot consume fast enough,

```txt
sender
  ↓
receiver buffer fills
  ↓
receiver advertises smaller window
```

### Congestion Control

Protects the **network**. If the network appears congested,

```txt
packet loss / delay
  ↓
sender reduces sending rate
```

## 16. Nagle's Algorithm and Tiny Writes

TCP tries to be efficient with packets. Many tiny writes such as:

```ts
socket.write("a");
socket.write("b");
socket.write("c");
```

can create overhead. TCP historically uses mechanisms such as Nagle's algorithm to combine small writes. Node exposes: `socket.setNoDelay(true);` which disables Nagle behavior. Do not reflexively change it. The tradeoff is roughly lower latency for tiny writes vs more packets / overhead.

Many application protocols already buffer intelligently. This is one of those settings to understand rather than cargo-cult.

## 17. UDP: Message-Oriented, Unreliable Transport

UDP is very different. TCP:

- connection-oriented
- ordered
- reliable
- byte stream

UDP:

- connectionless-ish
- message/datagram oriented
- no delivery guarantee
- no ordering guarantee
- no retransmission

Node exposes UDP through `node:dgram`. A UDP socket can bind to a local address and receive discrete datagrams.

We present UDP in [udp-client](../src/networking/35-udp-client.ts) and [udp-server](../src/networking/35-udp-server.ts). UDP preserves datagram boundaries, unlike TCP. If you send one datagram such as `ABCDEF`, the receiver receives that datagram as one message if it arrives. But it may:

- arrive
- not arrive
- arrive after another packet

## 18. When UDP is Useful

UDP works well when one or more of these matter:

- low latency
- small request/response exchanges
- multicast
- broadcast
- loss tolerance
- application-controller reliability

Examples:

- DNS
- some telemetry
- voice/video transport
- gaming
- service discovery
- certain hardware protocols

You would not use raw UDP for:

- financial transactions
- order mutation
- critical durable commands

unless you implement much stronger semantics above it.

## 19. DNS: Names are not Addresses

Applications usually connect to `api.example.com`, not `203.0.113.20`. DNS resolves names into addresses. Conceptually:

```txt
api.example.com
  ↓ DNS
203.0.113.20
  ↓ TCP
server
```

In Node:

```ts
import dns from "node:dns/promises";

const result = await dns.lookup("example.com");

console.log(result);
```

The important distinction is `hostname != IP` and DNS `result` may change over time. This is one reason long-running apps should not casually treat service discovery as permanently static.

Also remember from our runtime lecture that some Node DNS operations can involve the libuv worker pool, depending on API semantics.

## 20. TLS: TCP is not Secure by Itself

Plain TCP gives you reliable ordered bytes. It doesn't give you:

- confidentiality
- server authentication
- integrity against active attackers

TLS adds those properties above TCP. So the stack becomes:

```txt
HTTP
  ↓
TLS
  ↓
TCP
  ↓
IP
```

Node's `node:tls` implementation is built on OpenSSL. A simplified TLS handshake is:

```txt
client                          server

ClientHello ----------------->
                                ServerHello
                                certificate
            <-----------------
verify certificate

            <---------------->
              key agreement

        encrypted application data
```

Real TLS 1.3 details are more nuanced, but this is enough for a systems tour.

## 21. Certficates and Trust

A server certificate roughly says _this public key belongs to `api.example.com`_, and is signed through a chain of trust:

```txt
server certificate
  ↓ signed by
intermediate CA
  ↓ signed by
root CA
```

Your machine/browser/runtime has trusted root certificates. The client verifies things such as:

- certificate chain valid?
- hostname matches?
- certificate expired?
- signature valid?

If those checks pass, the client can reasonable authenticate that it is talking to the expected server.

Do not confused **encryption** with **authentication**. TLS gives both when configured correctly.

## 22. HTTP is an Application Protocol on top of TCP

Node's `node:http` module exposes HTTP client and server APIs directly. HTTP connections can use keep-alive and connection pooling rather than creating a new TCP connection for every request.

A raw Node HTTP server is presented in [http-server](../src/networking/36-http-server.ts). Express essentially gives you abstractions over this layer.

## 23. HTTP/1.1 Connection Reuse

Naively:

```txt
request
  ↓
new TCP handshake
  ↓
request
  ↓
close
```

for every HTTP call wastes work. HTTP/1.1 commonly reuses connections:

```txt
TCP connection
-> request 1
-> response 1
-> request 2
-> response 2
-> request 3
-> response 3
```

This is called **keep-alive**. Benefits of this are:

- fewer TCP handshakes
- fewer TLS handshakes
- lower latency
- less CPU

Connection pools manage reusable connections. Node's HTTP client pooling supports TCP keep-alive behavior. A connection pool is another bounded resource system:

```txt
request
  ↓
pool
-> connection 1
-> connection 2
-> connection 3
-> connection 4
```

Too few:

- request queue

Too many:

- server overload
- socket exhaustion
- memory overhead

Again: capacity planning.

## 24. HTTP/1.1 Head of Line Effects and HTTP/2

HTTP/1.1 historically has awkwardness around multiple outstanding requests on a connection. HTTP/2 introduces multiplexed streams:

```txt
one TCP connection
stream 1: request A ----->
stream 2: request B ----->
stream 3: request C ----->
```

Responses can interleave at the HTTP/2 framing layer. Node has built-in `node:http2` implementation. Conceptually,

```txt
HTTP/1.1

connection 1 → request A
connection 2 → request B
connection 3 → request C
```

vs

```txt
HTTP/2

one connection
-> stream A
-> stream B
-> stream C
```

HTTP/2 also adds:

- binary framing
- header compression
- stream prioritization concepts
- multiplexing

However, because HTTP/2 still commonly runs over TCP, packet loss at the TCP layer can still affect the whole connection. This is part of the motivation behind QUIC/HTTP/3, which runs over UDP with transport multiplexing moved out of TCP.

## 25. WebSockets: Long-Lived Bidirectional Communication

Normal HTTP is application-oriented around `request -> response`. WebSockets establish a long lived bidirectional channel. Conceptually: client ⇄ server, after an HTTP upgrade handshake. This is useful for:

- live dashboards
- chat
- live driver tracking
- collaboration
- real time notifications
- device control

But long lived connections create new operational concerns:

- connection lifecycle
- heartbeats
- reconnection
- stale sockets
- per-connection memory
- load balancer timeouts
- state recovery

A WebSocket connection can die silently from the application's point of view until you detect it. That is why protocols often implement:

- ping
- pong
- heartbeat timeout

## 26. Retries are not Automatically Safe

Suppose client sends `POST /charge-card`. Server charges card, but before response reaches client, network connection breaks. Client observes `request failed`, but reality is: `charge succeeded`, `response failed`. If client blindly retries, `charge again` may double charge.

This is one of the most important distributed systems lessons. Network failures creates uncertainty. The client cannot infer _no response => operation did not happen_. Instead, _no response => outcome unknown_.

For example, an idempotency key `Idempotency-Key: order-payment-123` lets the server persist `key`, `request`, and `result`. A retry with the same key returns the original result rather than repeat side effect.

This is where networking start turning into a book-style distributed systems.

## 27. Reconnection and Exponential Backoff

Suppose a client loses connection. This is bad:

```ts
while (true) {
  connect();
}
```

Now, 10,000 clients all connect immediately. You create **thundering herd**.

Instead, do $delay_{n} = \min(delay_{max}, delay_{base} \cdot 2^{n})$ with some randomness such as $delay = random(0, delay_{n})$.

An example:

```ts
function retryDelay(attempt: number): number {
  const base = 250;
  const maximum = 30_000;

  const cap = Math.min(maximum, base * 2 ** attempt);

  return Math.random() * cap;
}
```

The randomness is called **jitter**. It prevents synchronized clients from hammering the server at the same instant.

## 29. Conclusion

When networking fials, classify the failure.

**Name resolution**: DNS failure

**Connection establishment**:

- `ECONNREFUSED`
- timeout
- route unavailable

**Connection lifetime**:

- `ECONNRESET`
- peer closed
- broken pipe
- idle timeout

**Protocol**:

- malformed frame
- unsupported version
- invalid message type
- oversized payload

**Application**:

- authentication failed
- permission denied
- resource missing
- rate limited
- operation rejected

These should not be handled with:

```ts
catch {
  retry();
}
```

Some are retryable, some are not. Some are retryable under an idempotent guarantee.
