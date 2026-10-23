pub fn floating() {
    let x = 2.0;
    println!("f64: {x}");
    let y: f32 = 3.0;
    println!("f32: {y}");
}

pub fn numeric() {
    // addition
    let _sum = 5 + 10;

    // subtraction
    let _difference = 95.5 - 4.3;

    // multiplication
    let _product = 4 * 30;

    // division
    let _quotient = 56.7 / 32.3;
    let _truncated = -5 / 3; //Result in -1
    
    // remainder
    let _remainder = 43 % 5;
}

pub fn boolean() {
    let _t = true;

    let _f: bool = false; // with explicit type annotation
}

pub fn char() {
    let _c = 'z';
    let _z: char = 'Z'; // with explicit type annotation
    let heart_eyed_cat = '😻';

    println!("emoji: {heart_eyed_cat}");
}


