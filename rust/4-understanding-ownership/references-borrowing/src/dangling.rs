/*
 * Dangling pointer: a point that references a location in memory that may have been given to
 * someone else. This is done by freeing some memory while preserving a pointer to that memory. 
 */

pub fn try_dangle() {
    let returned_value = no_dangle();
    println!("Returned value: {returned_value}");
    
    // let reference_to_nothing = dangle();
}

fn no_dangle() -> String {
    let s = String::from("hello");

    s
}

/*
 * Here, we return a reference to String s, but it goes out of scope and dropped. So its memory goes
 * away.
 *
 * The exact error: 'this function's return type contains a borrowed value, but there is not value
 * for it to be borrowed from'.
 */
// fn dangle() -> &String {
//     let s = String::from("hello");
//
//     &s
// }
