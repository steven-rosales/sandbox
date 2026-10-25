pub fn string_slice() {
    let s = String::from("hello world");

    let word = first_word(&s);

    // s.clear(); // Will error

    println!("the first word is {word}");
}

fn first_word(s: &str) -> &str {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }

    &s[..]
}

pub fn other_slices() {
    let a: [i32; 4] = [1, 2, 3, 4];

    let slice = &a[1..3];

    assert_eq!(slice, &[2, 3]);
}
