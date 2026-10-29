use std::net::IpAddr;

/*
 * It's preferred code to panic when it could end up in a _bad state_. Here, bad state is when some
 * assumption, guarantee, contract, or invariant has been broken, such as when invalid values,
 * contradictory values, or missing values are passed to your code; plus the follow [in the book]
 * which is unexpect, proceding code can't afford bad state, no way to encode in types we use.
 *
 * Return a `Result` when failure is expected, such as malinformed data or an HTTP request reutrning
 * a status that indicates you have hit a rate limit.
 */
fn main() {
    let _home: IpAddr = "127.0.0.1".parse().expect("Hardcoded IP address should be valid");

}
