fn main() {
    let v1 = vec![1, 2, 3];
    let v1_iter = v1.iter();

    for val in v1_iter {
        println!("Got: {val}");
    }

    let v2: Vec<i32> = vec![1, 2, 3];
    let mapped_v2: Vec<_> = v2.iter().map(|x| x + 1).collect();
    assert_eq!(mapped_v2, vec![2, 3, 4]);
}
