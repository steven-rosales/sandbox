mod parameters;
mod state_expr;

fn main() {
    parameters::parameter(5);
    parameters::multiple_parameters(20, 'm');

    state_expr::statement();
    state_expr::expression();
}
