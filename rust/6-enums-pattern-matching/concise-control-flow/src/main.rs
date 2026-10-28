#[derive(Debug, Copy, Clone)]
enum UsState {
    Alabama,
    Alaska,
}

impl UsState {
    fn existed_in(&self, year: u16) -> bool {
        match self {
            UsState::Alabama => year >= 1819,
            UsState::Alaska => year >= 1959,
        }
    }
}

#[derive(Copy, Clone)]
enum Coin {
    Penny,
    Quarter(UsState),
}

fn main() {
    let mut count = 0;
    let coin = Coin::Quarter(UsState::Alabama);

    if let Coin::Quarter(state) = coin { 
        println!("State quarter from {state:?}!");
    } else {
        count += 1;
    }

    if let Some(description) = describe_state_quarter(coin) {
        println!("{description}");
    }
}

fn describe_state_quarter(coin: Coin) -> Option<String> {
    let Coin::Quarter(state) = coin else { return None; }; 

    if state.existed_in(1980) {
        Some(format!("{state:?} is pretty old, for America!"))
    } else {
        Some(format!("{state:?} is relatively new."))
    }
}

