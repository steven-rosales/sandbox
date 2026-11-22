use std::thread;

#[derive(Debug, PartialEq, Copy, Clone)]
enum ShirtColor {
    Red,
    Blue,
}

struct Inventory {
    shirts: Vec<ShirtColor>,
}

impl Inventory {
    fn giveaway(&self, user_preference: Option<ShirtColor>) -> ShirtColor {
        user_preference.unwrap_or_else(|| self.most_stocked())
    }

    fn most_stocked(&self) -> ShirtColor {
        let mut num_red = 0;
        let mut num_blue = 0;

        for color in &self.shirts {
            match color {
                ShirtColor::Red => num_red += 1,
                ShirtColor::Blue => num_blue += 1,
            }
        }

        if num_red > num_blue {
            ShirtColor::Red
        } else {
            ShirtColor::Blue
        }
    }
}

/*
 * The way a closure captures and handles values form the environment affects which traits the
 * closure implements, and traits are how functions and structs can specify what kind of closures
 * they can use.
 * - `FnOnce` **Consume**: Can move captured data out of the closure. Ownership is transferred or
 * the value is dropped, not restored to the original variable.
 * - `FnMut` **Modify**: Can mutate the captured data, usually through a mutable borrow (`&mut`).
 * Doesn't need ownership.
 * - `Fn` **Read**: Access captured data without mutating or consuming it.
 */
fn main() {
    let store = Inventory {
        shirts: vec![ShirtColor::Blue, ShirtColor::Red, ShirtColor::Blue],
    };

    let user_pref1 = Some(ShirtColor::Red);
    let giveaway1 = store.giveaway(user_pref1);
    println!(
        "The user with preference {:?} gets {:?}",
        user_pref1, giveaway1
    );

    let user_pref2 = None;
    let giveaway2 = store.giveaway(user_pref2);
    println!(
        "The user with preference {:?} gets {:?}",
        user_pref2, giveaway2
    );

    let mut list = vec![1, 2, 3];
    println!("Before defining closure: {list:?}");

    let mut borrows_mutably = || list.push(7);

    // Between the closure definition and closure call, an immutable borrow to print isn't allow
    // becuase no other borrows are allowed when there's a mutable borrow.
    // println!("Before calling closure: {list:?}");
    borrows_mutably();
    println!("After calling closure: {list:?}");

    // If the main thread creates `list` and owns it and a new thread starts and wants to acces
    // `list`, which both threads execute independently (so their completeion isn't guaranteed),
    // then if the new thread merely borrows `list`, the main thread could finish and destroy it
    // while the new thread still keeps it.
    // Here, `move` solves this: ownership transfers to the closure, keeping `list` alive
    // independently of the main thread.
    thread::spawn(move || println!("From the thread: {list:?}"))
        .join()
        .unwrap();
}
