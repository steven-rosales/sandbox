# Rust Basics

## 1. Learning objectives and conceptual map

By the end of this lecture, you should be able to:

1. Read and write Rust syntax fluently, including its type declarations, expressions, functions, control flow, and pattern matching.
2. Explain Rust's ownership system from first principles, and predict when code moves, copies, borrows, or drops a value.
3. Translate TypeScript object types and discriminated unions into Rust structs and enums.
4. Design functions that communicate ownership and mutability through their types.
5. Build and test a complete command-line program with Cargo.
6. Interpret Rust compiler errors and use them to repair incorrect programs.

**The conceptual model**
-> Rust source code: Types, functions, structs, enums, expressions.
-> Type checking: Are operations and data representations valid?
-> Borrow checking: Are ownership, aliasing, and reference lifetimes valid?
-> Compiled executable: Memory management without a tracing garbage collector.

The critical difference from TypeScript is not that Rust has stronger static types. TypeScript can express complex static types too. The difference is that Rust's type system also constrains ownership and access to memory. The compiler reasons about who may access an object, whether an acess amy mutate it, and whether referenced data will still exist.

This allows memory-safe properties to be checked at compile time without relying on a tracing garbage collector for ordinary safe Rust. It does not mean every runtime error or logical bug disappears.
