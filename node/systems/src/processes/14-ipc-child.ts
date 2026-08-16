type Request = Readonly<
  { type: "sum"; requestId: string; values: number[] } | { type: "shutdown" }
>;

type Response = Readonly<{ type: "result"; requestId: string; result: number }>;

process.on("message", (message: Request) => {
  switch (message.type) {
    case "sum": {
      const result = message.values.reduce((total, value) => total + value);

      const response: Response = {
        type: "result",
        requestId: message.requestId,
        result,
      };

      process.send?.(response);

      break;
    }

    case "shutdown": {
      typeof process.disconnect === "function" && process.disconnect();
      break;
    }
  }
});
