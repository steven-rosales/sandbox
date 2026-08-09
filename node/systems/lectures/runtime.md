# Node.js Runtime, Memory, Bytes, and Streams

Explains:

- Where JS actually executes
- Why Node can handle many concurrent connections with relatively few threads
- Why `async` does not mean parallel
- Which operations use the kernel versus libuv's worker pool
- How event-loop blocking creates system-wide latency
- How V8 heap memory differs from `Buffer` memory and process RSS
- How streams implement flow control through backpressure

Uses **Node 24 LTS**, strick TS, and compiled JS.

## 1. Runtime Stack

```txt
TypeScript
  ↓ tsc
JavaScript source
  ↓
V8
  - parses JavaScript
  - produces bytecode and machine code
  - executes JavaScript
  - manages the JavaScript heap
  - performs garbage collection
  ↓
Node core
  - JavaScript standard-library code
  - C++ bindings
  - Buffer, fs, net, crypto, streams, process
  ↓
libuv
  - event loop
  - OS-independent I/O abstractions
  - timers
  - process and signal handling
  - worker thread pool
  ↓
Operating system kernel
  - sockets
  - file descriptors
  - virtual memory
  - process scheduling
  - epoll, kqueue, or IOCP
  ↓
Hardware
  - CPU
  - RAM
  - network interface
  - disks
  - USB and serial devices
```

### Node Threading

A normal Node process executes your JavaScript on one main V8 thread at a time. But the entire process is not literally on thread.

A Node process can contain:

- The main JavaScript/event-loop thread
- libuv worker-pool threads
- V8 garbage-collection and compiler threads
- Operating system and native library threads
- Explicit worker threads you create later

Two ordinary JavaScript callbacks do not preemtively execute at the same time inside the same V8 isolate.

## 2. Run to Completion

### Execution of Callbacks

`system(callback, 0)` does not mean _execute this callback immediately_. It means _make this callback eligible to execute after the timer threshold has passed_. The callback cannot execute while the current JavaScript stack is occupied. A timer has at least three stages:

`timer registered -> minimum threshold passes -> timer becomes eligible -> event loop eventually reaches timer processing -> callback executes`

A timer threshold is therefore not a real-time deadline. Other callbacks, operating system, scheduling, garbage collection, and event loop work may delay it.

### The Fairness Problem

Suppose a server has 1000 active clients and one request runs a 500 ms synchronous computation. During those 500 ms:

- No other request handler can execute
- Compelted network events wait
- Timers wait
- Promise continuations wait
- Shutdown signals may wait
- Health checks may wait

Node places more scheduling responsibility on your application than a one-thread-per-request model. Each callback must perform a bounded amount of work so that other clients receive a turn. A useful rule is $T_{callback} \lt\lt L_{acceptable}$, where $T_{callback}$ is the worst-case uninterrupted callback time and $T_{acceptable}$ is your acceptable latency.

For a low latency service, even 50-100 ms of uninterrupted JavaScript can be damaging.

## 3. Event Loop Phases and Scheduling Queues

A simplified Node-event loop iteration phases such as:

```txt
timers
  ↓
pending callbacks
  ↓
poll / I/O
  ↓
check: setImmediate()
  ↓
close callbacks
  ↓
next iteration
```

Current Node versions use libuv behavior in which timers generally run after the poll phase during loop iterations. You should understand the phases but should not build correctness around delicate timing differences between `setTimeout(0)` and `setImmediate()`.

Queues that execute between or around these phases are `process.nextTick` queue, `Promise` / `queueMicrotask` queue, and event-loop phase queues.

### What Matters in Production

Use scheduling mechanisms semantically:

- `queueMicrotask`: finish a very small continuation after the current synchronous operation
- Promise continuation: continue asynchronous logic
- `setImmediate`: yield to the event loop and continue in later phase
- `setTimeout`: run after a minimum time threshold
- `process.nextTick`: mostly understand legacy or Node-internal behavior

## 4. Microtask Starvation

Microtasks run before Node returns to ordinary event-loop work. A microtask can schedule another microtask, which can schedule another, indefinitely.

For example, a timer cannot run until the microtask chain finishes.

This reveals that **asynchronous scheduling does not automatically guarantee fairness**. You can starve I/O using:

- Recursive `process.nextTick`
- Recursive Promise resolution
- Recursive `queueMicrotask`
- Very large synchronous loops
- Huge synchronous JSON parsing
- Pathological regular expressions
- Long synchronous logging or serialization

### `await` does not Automatically Move Work Elsewhere

If an expensive function is wrapped around an awaited `Promise`, the execution order would be: expensive function -> output -> `Promise.resolve(output)` -> `await Promise`. The expensive function runs before the Promise even exists.

Delcaring a function `async` changes how its result is represented. It does not schedule its body on another thread.

## 5. Kernel I/O versus the Libuv Worker Pool

Node has two broad ways of handling asynchronous operations.

### Model A: Kernel-Notified I/O

Network sockets usually use nonblocking operating-system facilities:

```txt
Node asks kernel to watch socket
  ↓
JavaScript thread performs other work
  ↓
packet arrives
  ↓
kernel marks socket readable
  ↓
event loop observes readiness
  ↓
Node reads data
  ↓
JavaScript callback executes
```

On major operating systems, libuv maps this model onto facilities such as:

- Linux `epoll`
- macOS/BSD: `kqueue`
- Windows: IOCP

Network I/O is generally polled on the event-loop thread rather than consuming one libuv worker thread per connection.

### Model B: Worker-Pool Operations

Some operating-system APIs do not expose a suitable cross-platform nonblocking interface. Node submits these operations to libuv's worker pool. Typical users include:

- Most asynchronous filesystem operations
- `dns.lookup`
- `crypto.pbkdf2` and `crypto.scrypt`
- Some random number and key generation operations
- zlib compression

Node's libuv thread pool has default size of four, is process global, and can be configured through `UV_THREADPOOL_SIZE` before startup. More workers may increase concurrency but also consume more resources and do not eliminate CPU or downstream bottlenecks.

## 6. Measuring Event-Loop Blocking

### Event-Loop Delay

Approximately $D = T_{actual callback} - T_{eligible callback}$. A high value means work was ready but could not execute promptly.

### Event-Loop Utilization

Approximately: $U = \frac{T_{\text{active}}}{T_{\text{active}} + T_{\text{idle}}}$. High utilization is not automatically bad, but sustained utilization near one means the process has little spare capacity for bursts.

### Why averages are dangerous

Suppose 99 operations take 1 ms and one operation takes 1,000 ms.

Mean: $\frac{99(1) + 1{,}000}{100} = 10.99 \text{ms}$

An 11 ms average hides a one second stall. For distributed and enterprise systems, observe:

- p50
- p95
- p99
- maximum
- event loop delay
- event loop utilization
- queue depth
- in-flight work

Tail latency usually matters more than the mean.

## 7. V8 Memory Model

At a high level, process memory includes:

```txt
Node process RSS
  - V8 JavaScript heap
    - young generation
    - old generation
    - code and metadata
    - other v8 spaces
  - Buffer / ArrayBuffer memory
  - native C++ allocations
  - stacks
  - loaded executables and libraries
  - allocators and OS overhead
```

### Stack vs Heap

Both are two regions of RAM used by a program to store data during execution.

The **call stack** contains execution frames. It's a structured, fast, and automatically managed memory pool designed for temporary function variables. Its features:

- Contiguous, LIFO
- Automatic by CPU/compiler
- Extremely fast
- Small and fixed (often 1-8MB)
- Local variables, primitives, pointers
- Block/Function local scope
- Stack overflow (running out of space)

The **heap** dynamically allocates objects live on the managed heap. It's a flexible, larger, and manually or garbage collected memory space for dynamic, long-lived data and objects. Its features:

- Arbitrary, fragmented layout
- Manual by programmer or via garbade collector
- Slower due to lookup overhead
- larger, limited only by physical/virtual RAM
- Objects, dynamic arrays, global data
- Globally accessible across functions
- Memory leaks and fragmentation

### Garbade Collection is Reachability Analysis

V8 starts from roots such as:

- Active stack references
- Global variables
- Module-level references
- Live closures
- Native references exposed to V8

It traverses the object graph.

An object is collectible when it is no longer reachable from any root: root -> A -> B -> C. All three remain alive. If the root dissapers and nothing else can reach them, the entire subgraph can be collected.

### Cyles are not Inherently Leaks

If two objects reference each other, but nothing reacahble references them, they can still be collected.

### Real Leaks are Unwanted Roots

An example is `const cache = new Map<string, Buffer>()`, where if entries are never removed, the map remains a root path to every buffer.

Other common roots include:

- Event listeners never detached
- Timers never cleared
- Unbounded maps
- Request objects captured by long lived closures
- Observability data accumulated forever
- Queues without capacity bounds

V8 uses a generational garbage collector based on the empirical observation that most allocated objects die young. Objects begin in young generation memory and survivors can eventually be promoted into older generation regions.

### JavaScript Heap vs Buffer Memory

The main observations of Node is:

- JavaScript objects mainly increase `heapUsed`
- Buffers mainly increase `arrayBuffers`, extrenal, and RSS
- Removing references does not itself execute garbage collection
- Even after collection, RSS may not immediately return to its original value

Node defines `heapTotal` and `heapUsed` as V8 memory, arrayBuffers as memory associated with `ArrayBuffer`, `SharedArrayBuffer`, and Node buffers, and RSS as resident process memory including JavaScript, native objects, and code.

### Important Consequence

A service can have:

- heapUsed = stable
- RSS = growing

Possibly causes include:

- Buffer growth
- Native-library allocations
- Allocator fragmentation
- Worker stacks
- Native memory leaks
- Memory-mapped resources

Do not diagnose every Node memory issue using only `heapUsed`

## 8. Buffers: Reasoning in Bytes

Distributed systems do not transmit JavaScript strings or objects directly; they transmit bytes. A typical path is:

```txt
JavaScript object
  ↓ serialize
string or binary representation
  ↓ encode
bytes
  ↓
TCP, file, pipe, serial port, or device
```

Node's `Buffer` represents a fixed-length byte sequence and extends `Uint8Array`.

Never allocate protocal buffers based on JavaScript string length (e.g., `const buffer = Buffer.alloc(text.length)`). Instead, use:

```ts
const byteCount = Buffer.byteLength(text, "utf8");
const buffer = Buffer.alloc(byteCount);
buffer.write(text, "utf8");
```

### Binary Framing Example

TCP gives you an ordered byte stream, not preserved application messages. If you send:

```txt
MESSAGE_A
MESSAGE_B
```

the receiver may read:

```txt
MES
SAGE_AMESS
AGE_B
```

You therefore need framing. A simple frame:

```txt
4 bytes: payload length, unsigned big-endian
1 byte: message type
N bytes: payload
```

### Endianness

`writeUInt32BE` means:

- Unsigned 32-bit integer
- Big endian byte order

For the integer `0x12345678`, big endian is `12 32 56 78` and little endian is `78 56 34 12`. Protocol participants must agree on byte order.

### Why `allocUnsafe` can be Acceptable

`Buffer.allocUnsafe(size)` may expose old uninitialized memory. It may only be safe if every allocated byte is overwritten before the buffer is returned. If even one byte can remain unwritten, use: `Buffer.alloc(size)`.

Node explicitly warns that an unsafe buffer may contain previous memory until its contents are overwritten.

### Copy vs View

In the example below:

```ts
const original = Buffer.from([1, 2, 3, 4]);

const view = original.subarray(1, 3);
view[0] = 99; // points at position 1 of original

console.log(original);
// <Buffer 01 63 03 04>
```

`subarray` shares underlying memory. That is efficient, but it creates two references that can acess and modify the same memory/data (aliasing). Copies create isolation. Views avoid allocation but require stronger ownership discipline.

## 9. Streams and Backpressure

A stream is an interface for incrementally moving data rather than loading the whole data set into memory. The four main Node stream forms are:

- `Readable`: source
- `Writeable`: destination
- `Duplex`: readable and writable
- `Transform`: duplex where output is computed from input

Files, sockets, HTTP requests, HTTP responses, compression objects, and child-process pipes are all commonly represented as streams.

### Why Streaming Matters

Non-streaming:

```ts
const entireFile = await readFile("10-gigabytes.bin");
await upload(entireFile);
```

Memory requirement is approximately $M = O(N)$, where $N$ is the file size.

Streaming:

```txt
read chunk
  ↓
process chunk
  ↓
write chunk
  ↓
repeat
```

Memory can remain approximately $M = O(B)$ where $B$ is the bounded buffered amount.

### The Queueing Problem

Suppose a producer generates data at rate $λ = 100 MB/s$ and the consumer processes $μ = 20 MB/s$. The backlog grows approximately: $Q(t) ≈ Q(0) + (λ − μ)t$. Therefore, $Q(t) ≈ Q(0) + 80t MB$. Without flow control, memory grows until the process or machine fails.

Backpressure communicates: _The consumer is saturated. The producer must slow down_.

### Manually Respecting Backpressure

In [backpressure](../src/08-backpressure.ts), `writable.write()` returns `false` when the internal buffered amount has crossed its configures threshold. At that point, producers should stop writing until the stream emits `drain`. The `highWaterMark` is a pressure threshold, not a strict maximum memory limit. Continuing to write after `false` causes Node to keep buffering and can eventually produce excessive memory use or process failure.

This is a feedback-control system:

```txt
producer
  ↓ data
buffer
  ↓ data
consumer

buffer below threshold:
  continue

buffer above threshold:
  stop producer

buffer drained:
  resume producer
```

The same structure appears throughout distributed systems:

- Kafka consumer lag
- Database connection pools
- HTTP concurrency limits
- Bounded work queues
- TCP receive windows
- Rate limiters
- Manufacturing work-in-process limits

### Prefer `pipeline()` for Connected Streams

In [pipeline](../src/09-pipeline.ts), `pipeline()` connects stream lifecycle, error propagation, completion, backpressure, and cancellation. Node's Promise-based pipeline resolved when processing completes and can destroy underlying stream chain when its `AbortSignal` is triggered.

The records are generated lazily:

```txt
generate one record
  ↓
compress
  ↓
write
  ↓
request next record only as capacity permits
```

You do not construct 200,000-element array first.

## 10. Reasoning About Node

You should now be able to reason about Node like this:

```txt
1. Javascript callback begins.

2. Callback executes synchronously and to completion.

3. It may:
  - register kernel I/O,
  - submit worker-pool work,
  - schedule timers,
  - enqueue microtasks,
  - write into streams

4. Callback returns.

5. nextTick and microtask work is drained according to context.

6. Event loop progresses through its phases.

7. Kernel or worker-pool completion become eligible callbacks.

8. One callback executes.

9. Repeat while referenced handles or requests remain.
```

The most important distinctions are:

```txt
Concurrency != parallelism

async function != background thread

timer threshold != execution deadline

heapUsed != total process memory

streaming != automatically bounded memory

write accepted != consumer has processed it

I/O completion != callback execution
```
