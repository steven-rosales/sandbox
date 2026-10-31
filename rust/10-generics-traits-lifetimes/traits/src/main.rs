use traits::{SocialPost, NewsArticle, Summary};
use std::fmt::Display;

/*
 * An important restriction to keep in mind is that we can implement a trait on a type only if either the trait or the type, or both, are local to our crate. For example, we can't implement `Display` trait on `Vec<T>` within our `trait` since both are defined in the std library. 
 * This restriction is part of a property called _coherence_, and more specifically, _the orphan
 * rule_, so names because the **parent is not present**. 
 * For example, we can implement std traits like `Display` on a custom type like `SocialPost` as
 * part of our `trait` crate functionality (set in Cargo.toml as name="trait") because the type
 * `SocialPost` is local to our `trait` crate.
 * We can also implement `Summary` on `Vec<T>` in our `trait` crate because the trait `Summary`
 * is local to our `trait` crate because the trait `Summary` is local to our `trait` crate.
*/
fn main() {
    let post1 = SocialPost {
        username: String::from("horse_ebooks"),
        content: String::from("of course, as you probably already know, people"),
        reply: false,
        repost: false,
    };

    println!("1 new post: {}", post1.summarize());

    let mut posts: Vec<SocialPost> = Vec::new();

    posts.push(post1);
    posts.push(SocialPost {
        username: String::from("donkey_ebooks"),
        content: String::from("people keep spanking me"),
        reply: false,
        repost: false,
    });

    println!("All posts:\n{}", posts.summarize());

    let article1 = NewsArticle {
        headline: String::from("US Midterms"),
        location: String::from("NYC"),
        author: String::from("John"),
        content: String::from("Coming Soon..."),
    };

    println!("{}", article1.summarize());
}

pub fn notify(item: &(impl Summary + Display)) {
    println!("Breaking news! {}", item.summarize());
}

// 1. Create pair. 2. Create the impl init with new. 3. Create impl with Dispaly and PartialOrd for
// cmp_display

struct Pair<T> {
    x: T,
    y: T,
}

impl<T> Pair<T> {
    fn new(x: T, y: T) -> Self {
        Self { x, y }
    }
}

impl<T: Display + PartialOrd> Pair<T> {
    fn cmp_display(&self) {
        if self.x > self.y {
            println!("The largest number is x: {}", self.x);
        } else {
            println!("The largest number is y: {}", self.y);
        }
    }
}

/*
 * This code won't compile because the type must be deterministic. The compiler must solve `impl
 * Trait` to a single, identical concrete type across every execution path at compile time.
 */
// fn returns_summarizable(switch: bool) -> impl Summary {
//     if switch {
//         NewsArticle {
//             headline: String::from(
//                 "Penguins win the Stanley Cup Championship!",
//             ),
//             location: String::from("Pittsburgh, PA, USA"),
//             author: String::from("Iceburgh"),
//             content: String::from(
//                 "The Pittsburgh Penguins once again are the best \
//                  hockey team in the NHL.",
//             ),
//         }
//     } else {
//         SocialPost {
//             username: String::from("horse_ebooks"),
//             content: String::from(
//                 "of course, as you probably already know, people",
//             ),
//             reply: false,
//             repost: false,
//         }
//     }
// }
