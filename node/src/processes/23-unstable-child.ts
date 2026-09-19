console.log({ event: "child_started", pid: process.pid });

const lifetime = 500 + Math.floor(Math.random() * 1500);

setTimeout(() => {
  console.error({ event: "child_crash", pid: process.pid });

  process.exitCode = 1;
}, lifetime);
