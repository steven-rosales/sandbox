/*
 * In C, attempting to read beyond the end of a data structure is undefined behavior. There can even
 * be buffered overreads, where you access whatever is in the memory location that would correspond
 * to the data structure, which leads to security vulnerabilities.
 *
 * If you try to read an element that doesn't exist, Rust will stop execution and refuse to continue.
 *
 * The `note` line tells us that we can set the `RUST_BACKTRACE` environment variable to get a
 * backtrace of exactly what happened to cause the error. The _backtrace_ is a list of all functions
 * that have been called to get to this point. 
 * Read the backtraces from top and read until you see files you wrote. The lines above that spot
 * are code that your code has called; the lines below are code that called your code.
 * These before-and-after lines might include core Rust code, standard library code, or crates that
 * you're using. 
 */
fn main() {
    // panic!("crash and burn");

    let v = vec![1, 2, 3];
    v[99];
}
