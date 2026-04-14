create table if not exists messages (
  id bigserial primary key,
  body text not null,
  created_at timestamptz not null default now()
);

insert into messages (body) values 
  ('hello from postgres'),
  ('this row came from raw sql'),
  ('bun + sse + docker sandbox')
on conflict do nothing;
