use std::ops::Deref;

// Rust can't determine the size of a directly recursive type because it could nest infinitely.
// With `Box`<T>`, Rust can determine the size becuase it stores a fixed-size pointer instead of
// `T` directly.
enum List {
    Cons(i32, Box<List>),
    Nil,
}

use crate::List::{Cons, Nil};

struct MyBox<T>(T);

impl<T> MyBox<T> {
    fn new(x: T) -> MyBox<T> {
        MyBox(x)
    }
}

// Th reason the `deref` method return a reference to a value, and that the plain dereference
// outside the parentheses is `*(y.deref())` is still necessary, has to do with the ownership
// system.
// If the `deref` method returned the value directly instead of the reference to the value, the
// value would be moved out of `self`.
// We don't want to take ownership of the inner value insie `MyBox<T>` in this case or in most
// cases where we use the dereference operator.
impl<T> Deref for MyBox<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

fn main() {
    let list = Cons(1, Box::new(Cons(2, Box::new(Cons(3, Box::new(Nil))))));

    fn print_list(list: &List) {
        match list {
            List::Cons(value, next) => {
                println!("{value}");
                print_list(next);
            }
            List::Nil => {
                println!("End of list");
            }
        }
    }

    print_list(&list);

    let m = MyBox::new(String::from("Steven"));
    // Turn `&MyBox<String>` into `&String` by calling `deref`.
    // This is because Rust will automatically insert as many `Deref::deref` calls as necessary to
    // match the expected reference type, provided that a valid chain of `Deref` implementaitons
    // exist and the borrowing and mutability rules are respected.
    hello(&m);
}

fn hello(name: &str) {
    println!("Hello, {name}!");
}

// Remember this for smart pointers:
// Smart pointer (T wrapper)
//  ↓ .deref()
// Regular reference (&T)
//  ↓ *
// Inner value (T)
//
// Thus, smart pointers are pointer-like types that provide additional functionality and allow you
// to access their underlying values using the `*` operator, typically thorugh the `Deref` trait.

// `Box<T>` is useful for:
// - Flattening recursive types
// - Storing large data on heap rather than stack
// - Cheap ownership transfers by transferring pointer only rather than underlying value
// - Storing different concrete types that implement same trait without knowing their concrete sizes
// at compile time (`Box<dyn Trait>`)
// - It's stable memory address since moving `Box` itself doesn't relocate its heap allocation.
