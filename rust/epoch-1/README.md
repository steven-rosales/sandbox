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

## 1. Toolchain and Cargo

### 1.1 Installation

Rust provides three principal tools:

| Tool     | Responsiblity                                      | Approximate TS analogy                       |
| :------- | :------------------------------------------------- | :------------------------------------------- |
| `rustc`  | Compiles Rust into machine code                    | `tsc` but produces a native executable       |
| `cargo`  | Builds projects, resolved dependencies, runs tests | npm scripts + package manager + build system |
| `rustup` | Installs and manages Rust toolchains               | Version-manager tooling                      |

On linux, we'll use `curl --proto '=https' -- tlsv1.2 https://sh.rustup.rs -sSf | sh`. Verify through `rust --version` and `cargo --version`. Use `cargo fmt` for formatting and `cargo clippy` for additional static analysis.

### 1.2 First program

In [main.rs](./src/main.rs), the important syntax:

- `fn` defines a function.
- `main` is the executable's entry point.
- `{}` encloses a body.
- `println!` is a macro, indicated by `!`.
- `;` terminates this expression as a statement.

A mcro works at compile time, expanding into Rust code. It is not merely a function with unusual punctuation. compile the file with `rustc`, but Cargo is the prferred workflow for projects.

## 1.3 Cargo project structure

To create a new project, use `cargo new inventory_lab --edition 2024`. This will initially generate:

```txt
inventory_lab/
    Cargo.toml
    src/
        main.rs
```

The basic commands are:

- `cargo check`:

