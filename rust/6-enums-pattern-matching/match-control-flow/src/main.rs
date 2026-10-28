#[derive(Debug)]
enum UsState {
    Alabama,
    Alaska,
}

enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter(UsState),
}

fn main() {
    value_in_cents(Coin::Penny);
    value_in_cents(Coin::Quarter(UsState::Alabama));

    let five = Some(5);
    let six: i32 = plus_one(five).unwrap_or(0);
    let none = plus_one(None);

    println!("five plus one is {six:?}. none is {none:?}");
}

fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => {
            println!("Lucky penny!");
            1
        }
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter(state) => { 
            println!("State quarter from {state:?}!");
            25
        }
    }
}

/*
 * One thing about the `match` pattern: The arms patterns must cover all possibilities. If we don't
 * handle `None`, the code will cause a bug which Rust will catch.
 */
fn plus_one(x: Option<i32>) -> Option<i32> {
    match x {
        None => None,
        Some(i) => Some(i + 1),
    }
}
