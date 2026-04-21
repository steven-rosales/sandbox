create table if not exists messages (
  id bigserial primary key,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id bigserial primary key,
  first_name text not null,
  last_name text not null,
  email text unique,
  phone text not null
);

create table if not exists orders (
  id bigserial primary key,
  user_id bigint not null references users(id),
  amount numeric(12, 2) not null check (amount >= 0),
  created_at timestamptz not null default now()
);

insert into users (id, first_name, last_name, email, phone) values
  (1, 'Demo', 'User', 'demo@example.com', '15551234567')
on conflict do nothing;

insert into messages (body) values 
  ('hello from postgres'),
  ('this row came from raw sql'),
  ('node + sse + docker sandbox')
on conflict do nothing;
