/*
 * This lifetime paramerter annotation means an instance of this struct `ImportantExcerpt` can't
 * outlive the reference it holds in its `part` field.
 */
struct ImportantExcerpt<'a> {
    part: &'a str,
}

/*
 * If we print `r` before assigning any value after `let r`, then we'll get an error of 'borrow
 * later used here'. If Rust allowed `r` to print before declaration, then it would reference memory
 * that was deallocated when `x` went out of scope, and anything we tried to do with `r` would not
 * work correctly.
 * Rust determines if code is valid with the borrow checker.
 *
 * Lifetime annotations: The names of lifetime parameters must start with `'` and are usually
 * lowercase and very short (e.g., 'a for the first lifetime annotation).
 */
fn main() {
    // let r;              // 'a
    //
    // {
    //     let x = 5;      // 'b
    //     r = &x;
    // }

    let x = 5;              // 'b

    let r = &x;             // 'a

    println!("r: {r}");

    let str1 = String::from("Hello from another world");      // 'a
    let mut result;                                 // 'a

    {
        let str2 = String::from("Hello from this world");     // 'b
        result = longest(str1.as_str(), str2.as_str());           // 'b
        println!("Longest: {}", result);
    }
    
    // Won't print: `str2` does not live long enough.
    // println!("Longest:{}", result);          // 'a
    
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first_sentence = novel.split('.').next().unwrap();
    // `novel` doesn't go out of scope until after `ImportantExcerpt` goes out of scope.
    // Thus, the reference in the struct is valid.
    let _i = ImportantExcerpt {
        part: first_sentence,
    };
    
    let str2 = String::from("Hello from this world");
    result = longest_with_an_announcement(str1.as_str(), str2.as_str(), "This is an announcemnt from that world");

    println!("result: {}", result);
}

/*
 * This function basically says that the lifetime of the reference returned is the same as the
 * smaller of the lifetimes of the values referred to by the arguments.
 *
 * A good way to think about it: the returned reference lives at least as long as the shorter of x's
 * lifetime and y's lifetime.
 */
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

/*
 * **Lifetime ellision rules** are patterns programmed into Rust's analysis of references. Your code
 * doesn't need to write the lifetimes explicitly if the compiler will already consider cases of
 * ellision.
 */

use std::fmt::Display;

fn longest_with_an_announcement<'a, T>(
    x: &'a str,
    y: &'a str,
    ann: T,
) -> &'a str
where
    T: Display,
{
    println!("Announcement! {ann}");
    if x.len() > y.len() { x } else { y }
}
