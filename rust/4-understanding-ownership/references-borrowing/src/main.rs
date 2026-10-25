mod intro;
mod mutable;
mod dangling;

fn main() {
    intro::a_reference();
    mutable::mutable();
    mutable::valid_multi_reference();
    dangling::try_dangle();
}
