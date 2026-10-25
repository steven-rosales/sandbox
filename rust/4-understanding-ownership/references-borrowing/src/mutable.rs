pub fn mutable() { 
    let mut s = String::from("hello");

    change(&mut s);
}

/*
 * Mutable references have one big restriction: If you hav ea mutable reference to a value, you can
 * have no other references to that value.
*/
fn change(some_str: &mut String) {
    some_str.push_str(", world");
}

/*
 * The benvefit of having the 'one mutable reference at a time' restriciton is that we avoid a **data
 * race**. A data race is similar to a race condition and happens when these three behaviors occur:
 * - Two or more pointers access the same data at the same time.
 * - At least one of the pointers is being used to write to the data.
 * - There's no mechanism being used to synchronize access to the data.
 */

pub fn valid_multi_reference() {
    let mut s = String::from("hello");

    let r1 = &s; // no problem
    let r2 = &s;    // no problem
    println!("{r1} and {r2}");
    // Variables r1 and r2 will not be used after this point.

    let r3 = &mut s; // no problem
    println!("{r3}");
}
