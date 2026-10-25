/*
 * If you do `let a = "hello";, then it is of type `&'static str`, which means the data is
 * immutable: it points to raw UTF-8 bytes baked into the read-only binary.
 * Here, `a` can also be copied through `let b = a` since `'&static str` implements Copy, which
 * duplicates the 16-byte fat pointer.
 * It can also be borrowed by `let slice: &str = &a[1..4]` and shadowed by `let a = 42`.
 *
 * Now, if we use `String::from` we are allocating this in the **heap** at runtime. It is 24 bytes
 * since it has at `ptr`, `len`, and `capacity`. It also borrows instead of being the owner and
 * moves ownership (and original is invalidated). The other benefit is that you can declare
 * mutability with `let mut a = String::from("hello");` which lets append, shrink, and reallocate.
 */
pub fn string_type() {
    // let s = String::from("hello");
    let mut s = String::from("hello");

    s.push_str(", world");
    println!("{s}");
}

