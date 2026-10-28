fn main() {
    // let s = String::from("initial contents");
    
    let mut s = String::new();

    {
        let data = "initial contents";
        let s = data.to_string();

        println!("inner scope s: {s}");
    }

    s.push_str("foo bar");

    let s1 = String::from("Hello, ");
    let s2 = String::from("world!");
    // note s1 has been moved here and can no longer be used.
    // The reason why s1 is no longr valid after the addition, and the reason we used a reference to
    // s2, has to do with the signatrue of the method that's called when we use the + oprator. The +
    // operator uses the `add` method, whose signatrue looks something like this: `fn add(self, s:
    // &str) -> String { .. };`.
    // We can only add a string slice to a `String`. Here, `s2` is **coerced** from `&String` to
    // `&str`. So, here, Rust turns `&s2` into `&s2[..]`. 
    // We can also see that in the `add` function, it takes ownership of `self` since `self` does
    // not have an `&`. Therefore, it takes ownership of `s1`.
    let s3 = s1 + &s2;

    println!("the concatenated string is {s3}");

    let a = String::from("Goodbye");
    let a1 = &a[0..4];
    println!("{a1}");

    let a2 = a.as_bytes()[0] as char;
    println!("{a2}");

    let s = AsciiString(String::from("Hello"));
    println!("s is {}", s.as_str());

    if let Some(c) = s.get_char_at(0) {
        println!("Extracted char: {}", c);
    }

    for c in "hi".chars() {
        println!("{c}");
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AsciiString(String);

impl AsciiString {
    pub fn new(input: impl Into<String>) -> Result<Self, &'static str> {
        let s = input.into();

        if s.is_ascii() {
            Ok(Self(s))
        } else {
            Err("Input contains non-ASCII characters")
        }
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }

    pub fn as_bytes(&self) -> &[u8] {
        &self.0.as_bytes()
    }

    // Since every character is guaranteed 1 byte, O(1) indexing is safe:
    pub fn get_char_at(&self, index: usize) -> Option<char> {
        self.0.as_bytes().get(index).map(|&b| b as char)
    }
}
