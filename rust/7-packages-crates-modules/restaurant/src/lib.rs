// mod front_of_house {
//     pub mod hosting {
//         pub fn add_to_waitlist() {}
//     }
// }
//
// use crate::front_of_house::hosting;

mod front_of_house;

pub use crate::front_of_house::hosting;

mod back_of_house {
    fn fix_incorrect_order() {
        cook_order();
        super::deliver_order();
    }

    fn cook_order() {}

    pub struct Breakfast {
        pub toast: String,
        seasonal_fruit: String,
    }

    impl Breakfast {
        pub fn summer(toast: &str) -> Breakfast {
            Breakfast {
                toast: String::from(toast),
                seasonal_fruit: String::from("peaches"),
            }
        }
    }
}

/*
 * `eat_at_restaurant` and `front_of_house` are siblings since they're defined in the same module.
 */
pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();

    // Order a breakfast in the summer with Rye toast.
    let mut meal = back_of_house::Breakfast::summer("Rye");

    // Change our mind about what bread we'd like.
    meal.toast = String::from("Wheat");
    println!("I'd like {} toast please.", meal.toast);
    // `seasonal_fruit` is private. The line below won't compile.
    // println!("It will come with {}", meal.seasonal_fruit);
}

fn deliver_order() {}
