#[derive(Debug)]
#[allow(dead_code)]
struct Request {
    actor: String,
    units: u32,
    approved: bool,
}

fn new_request(actor: String) -> Request {
    Request {
        actor,
        units: 1,
        approved: false,
    }
}

fn main() {
    let _request = Request {
        actor: String::from("alice"),
        units: 3,
        approved: false,
    };

    let requested = new_request(String::from("Michael"));

    println!("{requested:?}");
}




