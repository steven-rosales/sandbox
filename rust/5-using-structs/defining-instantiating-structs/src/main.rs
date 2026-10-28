struct User {
    active: bool,
    username: String,
    email: String,
    sing_in_count: u64,
}

fn main() {
   let user1 = build_user(String::from("user@email.com"), String::from("steven")); 

   let user2 = build_user(user1.email, String::from("jonathan"));
}

/*
 * If we use the same value for email or username from one user to another (e.g., user2 =
 * build_user(user1.email, ...)), then we cannot use that user from which the value came from. This
 * is only true for the `String` types because the other types are `bool` and `u64`, which implement
 * the Copy trait.
 */
fn build_user(email: String, username: String) -> User {
    User {
        active: true,
        username,
        email,
        sing_in_count: 1,
    }
}

/*
 * Each struct you define is its own type, even though the fields within the struct might have the
 * same type.
 */
struct Color(i32, i32, i32);
struct Point(i32, i32, i32);

fn declare_shape() {
    let _black = Color(0, 0, 0);
    let _origin = Point(0, 0, 0);
}
