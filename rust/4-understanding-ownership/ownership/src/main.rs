mod string_type;
mod variable_scope;
mod memory_allocation;
mod functions;

use memory_allocation::{ variables_data_move, scope_assignment, variables_data_clone, stack_only_copy };

fn main() {
    string_type::string_type();
    variable_scope::variable_scope();
    scope_assignment();
    variables_data_move();
    variables_data_clone();
    stack_only_copy();
    functions::ownership_function();
}
