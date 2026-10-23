mod scalars;
mod compounds;

fn main() {
    scalars::floating();
    scalars::numeric();
    scalars::boolean();
    scalars::char();

    compounds::tuples();
    compounds::arrays();
    compounds::array_access();
}

