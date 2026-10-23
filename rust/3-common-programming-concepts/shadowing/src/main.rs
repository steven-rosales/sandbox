fn main() {
    let x = 5;

    let x = x + 1;

    {
        let x = x * 2;
        println!("Value of x in inner scope: {x}");
    }

    println!("The value of x is: {x}");
}
