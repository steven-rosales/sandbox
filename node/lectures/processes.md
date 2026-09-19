# Processes, Threads, IPC, Shared Memory, and Graceful Shutdown

Runtime lecture taught essentially:

```txt
one Node process
  ↓
one main JavaScript thread
  ↓
event loop + async I/O
```

We'll now study **what happens when one event loop is not enough, or when Node must cross into the operating system**. The reasoning hierarchy is as follows:

```txt
Machine
-> Node process A
  -> V8 isolate / main JS thread
  -> libuv event pool
  -> libuv worker pool
  -> Worker thread
    -> separate V8 isolate + event loop
-> Node process B
  -> completely separate address space
-> Other processes
  -> postgres
  -> git
  -> ffmpeg
  -> device vendor program
  -> operating system utilities
```

## 1. Process vs Thread vs V8 Isolate

A **process** is an OS resource/container boundary. Conceptually, it owns an address space and OS resources:

```txt
Process
-> virtual address space
-> code
-> heap
-> stacks
-> file descriptors / handles
->  sockets
-> environments
-> threads
```

If you run something like `node dist/server.js`, the OS creates a process. Node initializes roughly: process -> V8 -> JavaScript Isolate -> main JavaScript thread -> libuv event loop. The process can contain many threads, but ordinary JS for one isolate runs on one thread at a time.

### What is an Isolate?

V8 calls an independent JS runtime instance an isolate. Conceptually:

```
V8 isolate
-> JS heap
-> garbage collector state
-> globalThis
-> compiled JS
-> execution state
```

Node worker thread normally gets its own isolate. Therefore, some thing like `const x = { value: 42 }` runs in the **main thread** while **worker** will say _cannot simply dereference x_ since it doesn't share ordinary JS objects with the parent.

You would communicate through structured cloning, transfer of memory ownership, and shared memory. Node worker threads really can execute JS in parallel, unlike processes they share `SharedArrayBuffer` memory. Node specifically recommends worker for CPU-intensive JS rather than ordinary I/O heavy work.

## 2. Inspect your Process

In [process](../src/processes/10-process.ts), notice that the `process.argv` outputs index `[0]` as Node executable, `[1]` as your program, and finally `[2:n]` as the command. The `process.pid` gets the process identifier while `process.ppid` is the parent process identifier.

If your shell launches Node: terminal -> shell process -(fork/spawn)-> node process. Then, Node PPID ≈ shell PID.

This hierarchy becomes important when Docker, systemd, Kubernetes, supervisors, shells, and application processes start killing or restarting one another.

## 3. File Descriptors: The Unix Process Interface

One of the most important abstractions in systems programming is: **A process frequently interacts with the outside world through streams identified by smaller integer handles**. On Unix-like systems, these are file descriptors. Conventionally: `0` = `stdin`, `1` = `stdout`, and `2` = `stderr`. Conceptually:

```txt
Node process
fd 0 -- input
fd 1 -- normal output
fd 2 -- diagnostics/errors
```

What those descriptors connect to depends on how the process was started. For example, `node program.js > output.txt`. Now: `fd 1` -> `output.txt`, instead of `fd 1 -> terminal`. Likewise, `cat file.txt | node program.js` means approximately: `cat stdout` -(OS pipe)-> Node `stdin`.

This is why Unix tools compose so well.

### Lab: Make Node Behave like a Unix Filter

In our [uppercase](../src/processes/11-uppercase.ts), it essentially builds:

```txt
producer
  ↓
OS pipe
  ↓
Node Readable stream
  ↓
transformation
  ↓
Node Writable stream
```

## 4. Creating Processes: `spawn`

Let's now make Node launch another program with [child](../src/processes/12-child.ts) and [spawn](../src/processes/13-spawn.ts). In spawn

In [spawn](../src/processes/13-spawn.ts), Node creates pipes for [child](../src/processes/12-child.ts) stdin/stdout/stderr by default when configured this way. The parent receives stream objects representing its end of those communication channels.

The picture is:

```txt
          pipe
parent ----------> child stdin

          pipe
parent <---------- child stdout

          pipe
parent <---------- child stderr
```

These are real **process boundaries**. The child has its own V8, heap, GC, event loop, PID, and address space. A child Node process is independently from its parent except for resources and communication channels deliberately established between them.

The overall sequence of our code is:

1. `spawn(...)` starts the child process.
2. Parent logs parent PID and child PID.
3. Parent configures stdout/stderr encoding.
4. Parent attaches 'data' listeners.
5. Parent writes 'hello', 'from', then 'parent \n' to the child's stdin.
6. `child.stdin.end(...)` also closes the child's stdin after that final data is written.
7. The child reads whatever chunks arrive: `for await (const chunk of process.stdin)`.
8. For each chunk it receives, it does stdout the byte length.
9. Once stdin is closed, the child's loop ends, it prints the byte count to stderr and then exits.
10. This: `const [code, signal] = await once(child, 'exit');` waits until that exit happens.
11. Then: `console.log({ code, signal });` runs.

## 5. `spawn` vs `exec` vs `execFile` vs `fork`

Distinctions matter. A useful mental model to keep:

| **Need**                             | **Mechanisms** |
| :----------------------------------- | :------------- |
| Run arbitrary executable             | `spawn`        |
| Run command using shell syntax       | `exec`         |
| Execute program + arguments          | `execFile`     |
| Create another Node process with IPC | `fork`         |
| Parallel JS inside same process      | `Worker`       |

### `spawn`

Think: start executable + stream `stdin`/`stdout`/`stderr`.

This is good for ffmpeg, git, python, large-output commands, hardware vendor CLI, long running processes.

### `exec`

Think: execute command through shell + buffer result.

Example: `exec('git stats');`. This introduces shell parsing.

If user controlled values enter the command: `exec(`some-command ${userInput}`);`. You can accidentally create command injection.

### `execFile`

Think: execute this program with this `argv` array without requiring a shell.

For example:

```ts
execFile("git", ["show", "--stat", commitHash], callback);
```

This is generally preferable when you don't actually need shell syntax.

### `fork`

Despite the name, Node's `child_process.fork(...)` means essentially to launch another Node.js process and create a build-in IPC channel.

The child has its own V8 instance and memory space.

## 6. Process Give you Isolation

Suppose Process A corrupts its state:

```txt
Process A
-> heap broken
-> uncaught fatal condition
-> crashes
```

Process B has another adress space which Process B cannot ordinarily dereference B's heap. That makes process boundaries useful for

- fault isolation
- privilege isolation
- resource isolation
- independent restart
- independent deployment

The cost that communcating across boundary is more exepnsive than calling `function foo() {}` because now data has to cross some IPC meachanisms such as pipe, socket, shared memory, Node IPC channel, database, message queues, etc.

This is the **beginning of distributed system thinking**. A distributed system takes the same principle and puts the processes on machines:

```txt
same machine: Process A <- IPC -> Process B
distributed: Process A <- network -> Process B
```

The network adds much nastier failure modes.

## 7. Node-to-Node IPC with `fork`

In [ipc-child](../src/processes/14-ipc-child.ts) and [ipc-parent](../src/processes/15-ipc-parent.ts), we have a tiny Remote Procedure Call RPC system:

```txt
Parent
  ↓ { requestId, type, payload }
Child
  ↓ { requestId, result }
Parent
```

Node can establish IPC channel between forked Node processes and expose `send()` / `'message'` semantics around it.

### Notice the Distributed Systems Ideas Hiding Inside

Even locally, this protocol should make you think about:

- What if the child dies before replying?
- What if the parent dies after sending?
- What if the same request is sent twice?
- What if the response arrives after its timeout?
- How do we correlate request <-> response?
- How many requests can be outstanding?
- What happens if th child becomes overloaded?

This is the reason why `requestId` is deliberately sent instead of doing `child.send([1, 2, 3]);`.

## 8. Threads: Actual Parallel JavaScript

We'll now move from process <-> process to thread <-> thread.

In [cpu-worker](../src/processes/16-cpu-worker.ts) and [workers](../src/processes/17-workers.ts), we have the computations that can genuinely execute simultaneously on multiple CPU cores. That is the main reason `worker_threads` exists.

## 9. Concurrency vs Parallelism

This distinction should be concrete.

**Event-loop concurrency**

```txt
request A starts I/O
  ↓
request B starts I/O
  ↓
request C executes
  ↓
A completes
  ↓
A callback executes
```

Many operations are in progress, but JS callbacks are not simultaneously executing.

**Worker parallelism**

| CPU core 1               | CPU core 2               |
| :----------------------- | :----------------------- |
| Worker A                 | Worker B                 |
| JS executes at same time | JS executes at same time |

Therefore, $\text{Concurrency} \ne \text{Parallelism}$. You can have concurrent work without parallel execution. Workers give you the latter.

## 10. Why not spawn a Worker for Every Request?

Worker creation has cost. Creating one requires:

- allocate worker
- initialize V8 isolate
- initialize JS runtime
- load modules
- allocate heap
- establish communication

If your CPU task lasts $T_{task} = 2 \text{ms}$ but worker startup costs a meaningful fraction of that, spawning one per call defeats much of the point.

So, production architecture tends toward:

```txt
                  -> Worker 1
                  -> Worker 2
request -> queue  -> Worker 3
                  -> Worker 4
                  -> Worker 5
```

rather than:

```txt
request -> spawn -> work -> destroy
request -> spawn -> work -> destroy
request -> spawn -> work -> destroy
```

## 11. Build a Tiny Worker Pool

The code in [pool-worker](../src/processes/18-pool-worker.ts) and [worker-pool](../src/processes/19-worker-pool.ts) is intentionally primitive, but it creates an actual scheduling system: arrival -> bounded resources -> queue -> scheduler -> worker -> completion

In operations research terms,

- $\lambda = \text{job arrival rate}$
- $\mu = \text{service rate per worker}$
- $c = \text{number of workers}$

and if $\lambda \gt c\mu$ for a sustained period, your queue grows without bound. This is true whether the 'workers' are CPU threads, warehouse employees, database connections, delivery drivers, machines, or HTTP servers. Same underlying systems structure.

Note: Think of $c\mu$ as throughput (e.g., 20 x 20 req/s = 400 req/s) while $\lambda$ as the inflow rate (400 req/s). You can calculate $\rho = \frac{\lambda}{c\mu}$ which gives you the **traffic density** (e.g., $\rho = \frac{\text{400 req/s}}{\text{400 req/s}} = 1$), where:

- $\rho \lt 1$ is stable
- $\rho = 1$ is meta-stable
- $\rho \gt 1$ is unstable/divergent

## 12. Missing Piece of Queue

Our queue of [pool-worker](../src/processes/18-pool-worker.ts) and [worker-pool](../src/processes/19-worker-pool.ts) has an **unbounded queue**, which is dangerous.

Suppose arrival is 100 job/sec and processing capacity is 20 job/sec. Then approximately $Q(t) = Q(0) + (100 - 20)t$. After 10 minutes, $Q \approx \text{48,000}$ jobs. Eventually, queue grows -> memory grows -> latency grows -> GC increases -> process slows further -> queue grows faster -> OOM / collapse.

This is the overload collapse. We'll need to add:

- max queue size
- deadlines
- cancellation
- priority
- load shedding
- metrics

which are enterprise concerns, not optional polishing.

## 13. Worker Messaging Normally Involves Cloning

Suppose that you have a worker:

```ts
worker.postMessage({
  customerId: "123",
  values: [1, 2, 3],
});
```

The receiving worker doesn't ordinarily obtain references into the sender's JS heap. The value is transferred using structured-clone-style semantics. Node worker data and worker messages support cloned values, ordinary objects therefore corss the isolate boundary by value rather than becoming shared references. Conceptually:

```txt
Main isolate

object A
-----------
|values...|
----------

  serialize/clone
        ↓

Worker isolate

object B
-----------
|values...|
----------
```

Changing B doesn't mutate A.

## 14. Transfer: Move Ownership instead of copying

For large binary buffers, copying can be expensive: $O(N)$, where $N$ is the number bytes. `ArrayBuffer` can instead be transferred.

For example:

```ts
const buffer = new ArrayBuffer(100_000_000);

worker.postMessage({ buffer, [buffer] });
```

Conceptually, before, main owned 100 MB and worker owned 0; when transferred, main buffer detached and worker owns 100 MB. **You're not sharing it**, you're moving ownership. Node documents this distinction explicitly: worker communication can clone values, transfer `ArrayBuffer` ownership or share a `SharedArrayBuffer`.

This is a major systems idea: **Ownership can eliminate synchronization**. If exactly one actor owns mutable memory, you don't need locks around that memory. Rust leans heavily on this principles at the type-system level.

## 15. Shared Memory Changes Everything

Now suppose both workers can access the exact same bytes:

```txt
              SharedArrayBuffer
              ---------------
Thread A ->   | same memory | <- Thread B
              ---------------
```

Performance improves because you can avoid copies. But now you have introduced

- races
- coordination
- memory ordering
- atomicity
- synchronization

This is the welcoming of concurrent systems programming.

## 16. Race Condition Lab

If we run [race](../src/processes/21-race.ts), we get something resembling `{ expected: 20000000, unsafe: 5869388, atomic: 20000000 }`. This is because `counter[0] = counter[0] + 1;` in our **unsafe** version is conceptually:

```txt
LOAD counter
ADD 1
STORE counter
```

Not:

```txt
ATOMIC_INCREMENT
```

Two CPUs can interleave:

```txt
Counter starts at 5

Thread A        Thread B

read 5
                read 5
compute 6
                compute 6
write 6
                write 6
final = 6
```

But there were two increments. The correct answer should be 7, so one update was lost.

## 17. Atomics

This: `Atomics.add(counter, 0, 1)` tells the runtime: _Treat this update as an atomic operation on shared memory_. Conceptually, `read + modify + write` becomes indivisible from the perspective required by the shared memory model. You have primitives such as:

- `Atomics.load(...)`
- `Atomics.store(...)`
- `Atomics.exchange(...)`
- `Atomics.compareExchange(...)`
- `Atomics.wait(...)`
- `Atomics.notify(...)`

Operating systems and computer architecture study this much deeper with:

- critical sections
- locks
- semaphores
- condition variables
- CAS
- memory ordering
- cache coherence
- false sharing
- deadlocks
- livelocks

For now, the lesson is simple: _**Shared mutable memory creates coordination obligations**_. Message passing avoids many of these obligations. That's one reason distributed systems favor messages rather than direct shared memory mutation.

## 18. Processes vs Workers

This architectural distinction is worth memorizing.

|                        | Child processes | Worker thread          |
| :--------------------- | :-------------- | :--------------------- |
| **Memory**             | isolated        | same process           |
| **Crash isolation**    | separated       | separate isolate       |
| **Startup Cost**       | higher          | lower                  |
| **Shared memory**      | not ordinary    | yes                    |
| **IPC**                | pipes/messages  | messages/shared memory |
| **CPU parallelism**    | yes             | yes                    |
| **Privilege boundary** | possible        | not comparable         |
| **Independent kill**   | yes             | yes-ish                |

The main principles:

1. **Use ordinary async Node I/O when**:

- network
- database
- filesystems APIs
- timers
- HTTP

2. **Use Workers when**:

- CPU heavy JS
- parsing
- compression implemented in JS
- image transformation in JS
- simulation
- optimization algorithm
- large computational transforms

Node explicitly says workers generally do not improve I/O-intensive work because Node's existing asynchronous I/O mechanisms already handle that case efficiently.

3. **Use child processes when**:

- you need stronger isolation
- you need another executable
- you need another runtime
- you need independent failure/restart
- you need vendor CLI
- you need OS-level separation

## 19. Signals: The OS Telling your Process Something Happened

On Unix-like systems, processes can receive signals. Examples:

- `SIGINT`
- `SIGTERM`
- `SIGKILL`
- `SIGHUP`

Think of signals as asynchronous notifications from the OS/process environment. A common lifecycle is:

```txt
systemd / Docker / Kubernetes / shell
                  ↓
            Node process
```

Node exposes signal reception through `process.on(...)`. Windoes doesn't implement POSIX signals identically; Node provides some emulated signal behavior there.

## 20. `SIGNINT` vs `SIGTERM` vs `SIGKILL`

A rough operational mental model:

- `SIGINT`:
  - "interactive interrupt"
  - typically Ctrl+C
- `SIGTERM`
  - "please terminate"
  - normal orchestration shutdwon request
- `SIGKILL`
  - "die now"
  - cannot perform normal application cleanup

The importan distinction is, `SIGTERM` -> applicatin gets opportunity to clean up, while `SIGKILL` -> OS terminates process. Therefore, production applications should know how to respond to termination.

## 21. Graceful Shutdown

Imagine your API is processing this: HTTP requests -> database transaction -> publish job -> send response. Deployment occurs halfway through.

Bad shutdown: `SIGTERM` -> process immediately dissapears -> connection dies mid-request.

Better shutdown: `SIGTERM` -> marke instance unhealthy -> stop accepting new work -> finish in-flight work -> close database/message connections -> flush important telemetry -> exit.

This is a state transition:

```txt
RUNNING
  ↓ SIGTERM
DRAINING
  ↓ work = 0
STOPPED
```

## 22. Build a Graceful HTTP Server

In [graceful-server](../src/processes/22-graceful-server.ts), you can make a request by `curl localhost:3000` and while it's running, press `Ctrl+C`. What you'll get is:

```txt
request already running
  ↓
SIGINT arrives
  ↓
server stops accepting new connections
  ↓
existing request finishes
  ↓
process exists
```

This is **draining**.

## 23. Why not Call `process.exit()`?

The reason is because `process.exit(0);` means essentially: _Terminate this process now_. That can interrupt outstanding asynchronous activity, including buffered output. A cleaner normal path is ferquently `process.exitCode = 0;`, then close active resources and let the event loop naturally become empty. Your process then exits because there is nothing left keeping alive.

This relates directly to [runtime](./runtime.md) where Node stays alive while referenced handles/requests exist. Examples:

- listening HTTP server
- open socket
- activer timer
- IPC channel
- worker
- child process

## 24. `ref()` and `unref()`

Consider `setInterval(() => { console.log('heatbeat') }, 1000);`. This timer normally keep Node alive. But:

```ts
const timer = setInterval(() => {
  console.log("heartbeat");
}, 1000);

timer.unref();
```

means: _This timer should not, by itself, prevent process from exiting_. The same general concept exists for several Node resources, including workers and child-process relationships. For example, an unreferenced Worker does not by itself need to keep the event loop alive. Useful for:

- telemetry intervals
- cleanup timers
- shutdown deadlines
- nonessential background bookkeeping

But use it deliberately.

## 25. Build a Tiny Process Supervisor

This is highly relevant to production systems. Imagine: Supervisor -> Worker process. If worker crashes,

```txt
Supervisor
  ↓ detect exit
restart
```

But this is dangerous:

```txt
worker crashes immediately
  ↓
restart
  ↓
crash
  ↓
restart
  ↓
crash
  ↓
...
```

This is a crash loop. We need to create a backoff, as presented in [unstable-child](../src/processes/23-unstable-child.ts) and [supervisor](../src/processes/24-supervisor.ts).

This explains the basic mechanics underlying tools like:

- systemd
- Docker restart policies
- Kubernetes controllers
- PM2
- process supervisors

## 26. Why Restart Policy Requires Judgement

Consider: '_worker crashed because of transient corruption_'. Restart may fix it. But: '_worker crashed because `DATABASE_URL` is missing_'. Restarting 50,000 times solves nothing. A better supervisor eventually wants:

- restart budget
- backoff
- jitter
- health checks
- startup timeout
- failure classification
- observability
- manual intervention state

A useful state machine becomes:

- STARTING -> { RUNNING, FAILED }
- RUNNING -> { FAILED }
- FAILED -> { BACKOFF }
- BACKOFF -> { RUNNING, HALTED }

Notice how much 'enterprise software' is fundamentally **state + policy + failure handling** rather than framework code.

## 27. What About `cluster`?

`cluster` creates multiple Node processes that can share incoming server work. Underneath, its workers are child processes creates using `child_process.fork()`, and Node can distribute incoming connections between them. It remains stable in Node 24. Conceptually:

```txt
                      -> process
port:3000 -> primary  -> process
                      -> process
```

Node's documentation specifically notes that if process isolation is unnecessary, `worker_threads` is the alternative for running multiple application threads within one Node instance.

For modern deployments, understand `cluster` but prefer architecture like:

```txt
              -> Node process container
load balancer -> Node process container
              -> Node process container
```

and then use worker threads inside a process only when CPU parallelism is actually required.

## 28. Resource Isolation Matters

Suppose your HTTP service performs: HTTP API + untrusted PDF processing + large image conversion + optimization algorithm. Putting everything in one process means: one catastrophic failure -> entire service.

You may choose instead:

```txt
API process
-> worker thread pool (CPU work)
-> Child-process process (less trusted native tool)
```

or

```txt
API service
  ↓ queue
processing service
```

The stronger the isolation:

```txt
function
-> module
-> worker thread
-> process
-> container
-> VM
-> machine
```

generally the greater the communication and operational cost. System design is choosing the appropiate boundary.

## 29. Node's Permission Boundary

Node 24 alos has stable Permission Model that can restrict categories such as filesystem access, child process spawning, worker creation, addons, and other capabilities. But Node explicitly describes this as more of a guardrail for trusted code than a security boundary against malicious code.

For example:

```bash
node \
  --permission \
  --allow-fs-read="./config/*" \
  dist/app.js
```

This is worth knowing for enterprise/local-agent software. Don't confuse 'Node permission flag' with OS sandbox, container boundary, user permissions, or VM. The latter are much stronger isolation mechanisms.

## 30. Conclusion: Architecture Model

Mentally classify work like this:

```txt
      -> I/O              -> event loop / async Node API
WORK  -> CPU              -> Worker pool of threads
      -> external program -> spawn process
```

And then separately ask if you **need failure isolation**: if yes, then use process; else if no, then use worker. Then, ask if **actors need shared mutable memory**: if yes, then SharedArrayBuffer + Atomics; else if no, then use message parsing.

Start thinking Node not as simply a JS server, but as:

- event-loop scheduler
- I/O runtime
- process manager
- IPC endpoint
- binary stream processor
- thread coordinator
- native-program orchestrator
- OS interface

Node can be perfectly legitimate systems glue for things such as:

- cloud services
- distributed workers
- local edge agents
- POS software
- hardware controllers
- build systems
- CLI tooling
- message processors
- enterprise integration

while Rust/C/C++ can sit underneath it where you need harder control over memory, native SDKs, very low latency, or intensive compute.

The takeaway of this lecture: **Use Node's event loop for concurrency, Workers for CPU parallelism, processes for stronger isolation or external programs, message passing by default, and shared memory only when the performance benefit justifies synchornization complexity**.
