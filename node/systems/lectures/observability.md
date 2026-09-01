# Observability, Diagnostics, Native Integration, and Local Edge Agents

The last four lectures have taught us:

- runtime, event loop, memory, buffers, streams
- processes, workers, IPC, isolation, shutdown
- networking, protocols, deadlines, retries
- transactions, idempotency, outbox, durable workflows

We'll answer now: **_How do you determine what a running Node system is actually doing?_** and **_How do you safely connect that system to physical devices whose effects cannot always be rolled back?_**. We will build towards:

```txt
Cloud / local control surface
  ↓
Edge agent
  -> request context
  -> structured logs
  -> metrics
  -> diagnostics channels
  -> runtime profiling
  -> local durable queue
  -> command state machine
  ↓
Device adapter
  -> child-process simulator
  -> serial port
  -> USB HID
  -> vendor CLI
  -> Rust native addon
      ↓
    Physical machine
```

We'll continue with Node 24 LTS, strict TypeScript, ESM, and `NodeNext`.

## 1. The Final Systems Mental Model

A production system has two loops.

### The Operational Loop

```txt
input
  ↓
decision
  ↓
state transition
  ↓
side effect
  ↓
confirmation
```

For a web service:

```txt
HTTP request
  ↓
validate
  ↓
database transaction
  ↓
response
```

For hardware:

```txt
command
  ↓
validate
  ↓
send bytes
  ↓
machine acts
  ↓
acknowledgement
```

### The Diagnostic Loop

```txt
system event
  ↓
log / metric / trace
  ↓
symptom detected
  ↓
runtime evidence collected
  ↓
component located
  ↓
source code and deployment identified
  ↓
corrective action
```

You should be able to follow:

```txt
business event
-> trace ID
-> process
-> component
-> source function
-> runtime resource
-> external dependency or device
-> deployment
-> commit
```

That is what observability should produce, not merely 'having logs'.

## 2. Project Layout

We'll continue with creating demonstration code and have data and diagnostics to test it. We'll need to install `serialport` for this part.

Everything before the real serial adapter can run without physical hardware.

## 3. Logs, Metrics, Traces, Profiles, and Dumps are Different Evidence

Do not treat all diagnostic data as interchangeable.

### Logs

A log is a discrete event:

```json
{
  "event": "device_command_finished",
  "comamndId": "abc",
  "durationMs": 82,
  "status": "applied"
}
```

Good for:

- What happened?
- Which command failed?
- What error did the dependency return?

### Metrics

A metric is an aggregated numerical signal:

- device_command_latency_p99 = 420ms
- device_reconnect_total = 17
- event_loop_delay_p99 = 35ms

Good for:

- Is the system unhealthy?
- When did behavior change?
- How widespread is the issue?

### Traces

A trace represents one casually connected operation:

```txt
HTTP request
  -> authorization
  -> database query
  -> local queue insertion
  -> device command
    -> serial write
    -> acknowledgement wait
```

Good for:

- Where did this particular operation spend time?
- Which dependency caused its failure?

### CPU Profile

A CPU profile statistically samples executing stacks:

- Which functions consumed CPU time?
- Why is one process using a core continuously?

### Heap Snapshot

A heap snapshot records the V8 object graph:

- Which objects remain reachable?
- What is retaining them?
- Why is a heap memory growing?

### Diagnostic Report

A diagnostic report captures broad process state:

- JavaScript and native stacks
- V8 heap statistics
- libuv resources
- CPU and memory information
- system limits

Node's diagnostic report API includes these categories and can be invoked programatically with `process.report.writeReport()`. The normal debuggin sequence is:

```txt
metric detects
  ↓
trace localizes
  ↓
logs explain
  ↓
profile or dump proves
```
