use std::fs::File;
use std::io::{self, ErrorKind, Read};

// The `Box<dyn Error>` type is a trait object and it means "any kind of error.". Using `?` on a
// `Result` value in a `main` function with this error type is allowed because it allows any `Err`
// value to be returned early. 
// 
// When `main` function returns a `Result<(), E>`, the executable will exit with a vlue of `0` if
// `main` returns an `Err` value. 
//
// The primary purpose of `?` is propagation. It basically says "I cannot (or do not want to) deal
// with this failure here; bubble it up to whatever called me.
// fn main () -> Result<(), Box<dyn Error>> {
fn main() {
    let file = File::open("hello.txt");

    // The `expect` method lets us choose the `panic!` error message. 
    // Using `expect` over `unwrap` and providing a good error message can convery your intent an
    // dmake tracking down the source of panic easier. This is perferred for production code.
    // let file = File::open("hello.txt").expect("hello.txt should be included");

    let _found = match file {
        Ok(file) => file,
        Err(error) => match error.kind() {
            ErrorKind::NotFound => match File::create("hello.txt") {
                Ok(fc) => fc,
                Err(e) => panic!("Problem creating the file: {e:?}"),
            },
            _ => {
                panic!("Problem opening the file: {error:?}");
            }
        },
    };

    let username = match read_username_from_file() {
        Ok(name) => name,
        Err(_) => String::from("default_user"),
    };

    println!("username: {username}");
}
// Ok(())
// }

fn read_username_from_file() -> Result<String, io::Error> {
    let username_file_result = File::open("hello.txt");

    let mut username_file = match username_file_result {
        Ok(file) => file,
        Err(e) => return Err(e),
    };

    let mut username = String::new();

    match username_file.read_to_string(&mut username) {
        Ok(_) => Ok(username),
        Err(e) => Err(e),
    }
}
