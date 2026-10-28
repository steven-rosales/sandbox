#[derive(Debug)]
enum SpreadsheetCell {
    Int(i32),
    Float(f64),
    Text(String),
}

fn main() {
    let mut v = vec![1, 2, 3, 4, 5];

    let third: &i32 = &v[2];
    println!("The third eleemnt is {third}");

    v.push(6);
    let third: Option<&i32> = v.get(2);
    match third {
        Some(third) => println!("The third element is {third}"),
        None => println!("There is no third element"),
    }

    // Don't do, creates a **dangling pointer** (which leads to a **use-after-free** bug)
    // The dangling pointer creates far more dangerous behavior:
    // - It still points to the exact memory address where the items used to live
    // - Because that memory was freed during the reallocation, the operating system might hand that
    // space to a completely different part of your program.
    // - If you then read or write through that old reference, you are inspecting or corrupting
    // unrelated data; causing undefined behavior, silent bugs, or severe security vulnerabilities.
    // let first = &v[0];
    // v.push(6);
    // println!("The first element is: {first}");

    let sixth: Option<&i32> = v.get(5);
    match sixth {
        Some(sixth) => println!("The sixth element is {sixth}"),
        None => println!("There is no sixth element"),
    }

    for i in &v {
        println!("{i}");
    }

    for i in &mut v {
        *i += 50;
    }

    let row = vec![
        SpreadsheetCell::Int(3),
        SpreadsheetCell::Text(String::from("blue")),
        SpreadsheetCell::Float(10.12),
    ];

    for i in &row {
        println!("{i:?}");
    }
}
