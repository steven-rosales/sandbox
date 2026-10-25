pub fn a_reference() {
    let s1 = String::from("hello");

    // The `&s1` value does not own the value, only the reference. Therefore, `s1` does not get
    // dropped when the reference stops being used.
    let len = calculate_length(&s1);

    println!("The length of '{s1}' is {len}.");
}

/*
 * These ampersands represent references, and they allow you to refer to some value without taking
 * ownership of it.
 *
 * Note: The opposite of using `&` is dereferencing with `*`. We'll discuss this later.
*/
fn calculate_length(s: &String) -> usize {
    s.len()
} // Here, s goes out of scope. But because s does not have ownership of what it refers to, the
  // String is not dropped.

// Won't compile
// fn invalid() {
//     let s = String::from("hello");
//
//     change(&s);
// }
//
// fn change(some_string: &String) {
//     some_string.push_str(", world");
// }


