pub fn tuples() {
    let tup: (i32, f64, u8) = (500, 6.4, 1);
    println!("{:?}", tup);

    let a_tup = (500, 6.4, 1);
    let (_x, y, _z) = a_tup;
    println!("The value of y is {y}");

    let x: (i32, f64, u8) = (500, 6.4, 1);
    let _five_hundred = x.0;
    let _six_point_four = x.1;
    let _one = x.2;
}

pub fn arrays() {
    let a = [1, 2, 3, 4, 5];
    println!("{:?}", a);

    // i32 is the type of each element; 5 indicates the array contains five elements
    let a: [i32; 5] = [1, 2, 3, 4, 5];
    println!("{:?}", a);

    let a = [3; 5];
    println!("{:?}", a);
}

pub fn array_access() {
    let a = [1, 2, 3, 4, 5];

    let first = a[0];
    println!("first: {first}");
    let second = a[1];
    println!("second: {second}");
}
