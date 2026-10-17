# Rust Basics

## 0. The learning objectives and conceptual map

Takeaways of this lecture:

1. Read and write Rust syntax, including types, expressions, functions, control flow, and pattern matching.
2. Understand what happens when Rust values are created, assigned, passed into function, borrowed, and destroyed.
3. Predict common ownership and borrowing compiler errors before compiling.
4. Model domain entities using structs, methods, and enums.
5. Use `Option<T>` and `Result<T, E>` instead of relying on nullable values or exceptions.
6. Build, execute, test, and modify a complete Rust CLI application.

We'll cover:

- Types and expressions: What values exits? What operations are permitted?
- Ownership and borrowing: Who owns a resource? Who can read or mutate it? When is it destroyed?
  - Structs: Combine related data and behavior.
  - Enums: Represent alternatives and states.
- Safe, typed application: Deterministic inventory decisions, explicit failure handling, verified invariants.
