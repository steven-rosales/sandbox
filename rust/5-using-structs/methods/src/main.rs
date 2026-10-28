#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

/*
 * All function defined within an `impl` are called _associated functions_ because they're
 * associated with the type after the `impl`.
 * Associated functions don't have to have `self` as their first parameter, and thus are NOT
 * methods, becuase they don't need an instance of the type to work with.
 */
impl Rectangle {
    fn square(size: u32) -> Self {
        Self {
            width: size,
            height: size,
        }
    }

    fn area(&self) -> u32 {
        self.width * self.height
    }
    
    fn can_hold(&self, other: &Rectangle) -> bool {
        self.height > other.height && self.width > other.width
    }
}

/*
 * There is a core concept to be learned here: Object vs Pointer
 * - Object (Direct Value): Holding the actual box of data in hand.
 * - Pointer / Reference: Holding a note with the memory address of the box.
 * - Dereferencing(`*`): Following the address note to access the actual box.
 *
 * In C / C++: 
 * Manual Tracking. Syntax depends on strictly on what you hold, not on whether you read or mutate:
 * - `object.method()` -> Call directly on the object.
 * - `ptr->method()` -> Follow the pointer first, then call (shorthand for `(*ptr).method()`).
 * 
 * Rust: Automatic Referencing & Dereferencing (Autoderef)
 * There is no `->` operator; you always use `.`(`p.method()`). The compiler checks the method's
 * receiver signature and rewrites the call automatically:
 * - Method expects `&self` (read-only): Rust borrows it for you -> `(&p).method()`
 * - Method expects `&mut self` (mutate): Rust mutably borrows it for you -> `(&mut p).method()
 * - Method expect `self` (consume/move): Rust moves the value, or dereferences it ->
 * `(*p).method()` if `p` was a pointer.
 */
fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };

    println!(
        "The area of the rectangle is {} square pixels.",
        rect1.area()
    );

    let rect2 = Rectangle {
        width: 20,
        height: 40,
    };

    println!("Can rect1 hold rect2? {}", rect1.can_hold(&rect2));

    println!("A square {:?}", Rectangle::square(3));
}

