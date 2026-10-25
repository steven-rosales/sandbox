pub fn if_statement() {
    let number = 3;

    if number < 5 {
        println!("condition was true");
    } else {
        println!("condition was false");
    }

    // won't compile, it must be a bool.
    // if number {
    //     println!("{number}");
    // }
}

pub fn else_if() {
    let number = 6;

    if number % 4 == 0 {
        println!("number is divisible by 4");
    } else if number % 3 == 0 {
        println!("number is divisible by 3");
    } else if number % 2 == 0 {
        println!("number is divisible by 2");
    } else {
        println!("number is not divisible by 4, 3, or 2");
    }
}

pub fn if_let() {
    let condition = true;
    let number = if condition { 5 } else { 6 };

    println!("The value of number is {number}");

    // Won't compile. i32 and &str are different return types
    // let num = if condition { 5 } else { "six" };
}


