/* 
 * There are two important points in time here:
 * 1. When `a` comes into scope, it is valid.
 * 2. It remains valid until it goes out of scope.
 */
pub fn variable_scope() {
    let _s = "hello";

    {                   // a is not valid here
      let _a = "hello";  // a is valid from this point forward
                        // do stuff with a here
    }

    // this scope is now over, and a is no longer valid.
}



