import EventEmmitter from "events";

class Emitter extends EventEmmitter {}

const myE = new Emitter();

myE.on("foo", () => {
  console.log("An event occurred 1");
});
myE.on("foo", () => {
  console.log("An event occurred 2");
});
myE.on("foo", (x) => {
  console.log(`An event with a parameter occurred: ${x}`);
});
myE.once("bar", () => {
  console.log("An event occurred bar");
});

myE.emit("foo");
myE.emit("foo", "plain text");
myE.emit("bar");
myE.emit("bar");
