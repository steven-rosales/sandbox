pub fn five() -> i32 {
    // No semicolon implies a return value.
    5
}

pub fn plus_one(x: i32) -> i32 {
    x + 1
}

pub fn with_return() {
    let x = five();
    println!("x is {x}");

    let y = plus_one(x);
    println!("y is {y}");
}
