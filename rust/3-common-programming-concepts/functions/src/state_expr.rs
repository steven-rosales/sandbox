// Statements: Instructions that perform some action and do not return a value.
// Expressions: Evaluate to a resultant value.

pub fn statement() {
    let _y = 6;
    // The code below would get a compiler error.
    // `let y = 6` statement does not return a vlue, so nothing `x` can bind to
    // let x = (let y = 6);
}

pub fn expression() {
    // Calling a function and a macro are expressions.
    let y = {
        let x = 3;
        // This is the return, which makes the block an expression.
        x + 1
    };

    println!("The value of y is {y}");
}
