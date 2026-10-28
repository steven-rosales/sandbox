fn main() {
    // Just like vectors, hash maps sotre their data on the heap.
    // Also, hash maps are homogeneous: All the keys must have the same type, and all of the values
    // must have the same type.
    use std::collections::HashMap;

    let mut scores = HashMap::new();

    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Yellow"), 50);

    // let team_name = String::from("Blue");
    // let _score = scores.get(&team_name).copied().unwrap_or(0);
    
    scores.entry(String::from("Yellow")).or_insert(50);
    scores.entry(String::from("Blue")).or_insert(50);

    println!("{scores:?}");

    for (key, value) in &scores {
        println!("{key}: {value}");
    }

    let field_name = String::from("Favorite color");
    let field_value = String::from("Blue");

    let mut map = HashMap::new();
    map.insert(field_name, field_value);
    // field_name and field_value are invalid at this point. You'll get a compiler error.

    let new_field_value = String::from("Red");
    map.insert(String::from("Favorite color"), new_field_value);

    for (key, value) in &map {
        println!("{key}: {value}");
    }

    let mut map = HashMap::new();

    let text = "hello world wonderful world";

    for word in text.split_whitespace() {
        let count = map.entry(word).or_insert(0);
        // The dereference operator follows the reference to modify the actual ingeger value sitting
        // in the map's memory.
        // If you use count again in this for loop block, it will still be a mutable reference
        // (pointer) with type `&mut i32`.
        *count += 1;
    }

    println!("{map:?}");
}

