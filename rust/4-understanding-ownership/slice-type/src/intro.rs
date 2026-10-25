pub fn wrong_slicing() {
    let mut s = String::from("Hello World");

    let _first_word_index = first_word(&s);

    s.clear(); // Empties the string
}

fn first_word(s: &String) -> usize {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return i;
        }
    }

    s.len()
}
