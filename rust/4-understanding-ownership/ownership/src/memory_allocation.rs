/*
 * With the `String` type, in order to support a mutable, growable piece of text, we need to
 * allocate an amount of memory on the heap, unknown at compile time, to hold the contents. This means:
 * - The memory must be requested from the memory allocator runtime.
 * - We need a way of returning this memory to the allocator when we're done with our `String`.
 *
 * There is a natural point at which we can return the memory our `String` needs to the allocator:
 * when the variable goes out of scope. Rust calls a special function called `drop`, and it's where
 * the author of `String` can put the code to return the memory. Rust calls `drop` automatically at
 * the closing curly bracket.
 */

pub fn variables_data_move() {
    // This is an example of copy.
    let x = 5;
    let _y = x;

    // When se assign `s1` to `s2`, the `String` data is copied, meaning we copy the pointer, the
    // length, and the capacity that are on the stack.
    // We DO NOT copy the data on the heap that the pointer refers to.
    // Rust considers `s1` as no longer valid to avoid double free error.
    // We say that `s1` has moved to `s2`, NOT a shallow copy.
    let s1 = String::from("hello");
    let _s2 = s1;

    // Won't run because value moved (and does not copy)
    // println!("{s1} world!");
}

pub fn scope_assignment() {
    // Nothing refers to this value after reassigning `s`.
    let mut s = String::from("hello");

    // When you assign a completely new value to an existing variable, Rust will call `drop` and
    // free the original value's memory immediately.
    s = String::from("ahoy");
    println!("{s}, world");
}

pub fn variables_data_clone() {
    // This `clone` deeply clones data of the `String`, not just stack data.
    let s1 = String::from("hello");
    let s2 = s1.clone();

    println!("s1 = {s1}, s2 = {s2}");
}

/*
 * As a general rule, any group of simple scalar values can implement `Copy`, and nothing that
 * requires allocation or is some form of resource can implement `Copy`. Here are some of the types
 * that implement `Copy`:
 * - All the integer types, such as `u32`.
 * - The boolean type, `bool`, with values `true` or `false`.
 * - All floating-point types, such as `f64`.
 * - The character type, `char`.
 * - Typles, if they only contain types that also implement `Copy`. For example, `(i32, i32)`
 * implements `Copy, but `(i32, String`) does not.
 */ 
pub fn stack_only_copy() {
    let x = 5;
    let y = x;

    println!("x = {x}, y = {y}");
}
