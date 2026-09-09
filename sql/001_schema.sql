-- Service monitor schema.
-- Run once against an empty database:
--   psql "postgres://monitor:monitor@localhost:5432/monitor" -f sql/001_schema.sql

drop table if exists checks;
drop table if exists services;

-- A thing we want to keep an eye on. One row per URL.
create table services (
  id                     serial primary key,
  name                   text        not null,
  url                    text        not null,
  expected_status        integer     not null default 200,
  check_interval_seconds integer     not null default 30,
  created_at             timestamptz not null default now()
);

-- One row every time we ask a service whether it is alive.
-- status_code is null when we never got an HTTP response at all
-- (server refused the connection, DNS failed, timeout).
create table checks (
  id          bigserial primary key,
  service_id  integer     not null references services(id) on delete cascade,
  status_code integer,
  response_ms integer     not null,
  ok          boolean     not null,
  error_text  text,
  checked_at  timestamptz not null default now()
);

create index checks_service_id_checked_at_idx on checks (service_id, checked_at desc);

insert into services (name, url, expected_status) values
  ('Monitor API',            'http://localhost:3001/health',           200),
  ('Monitor API - services', 'http://localhost:3001/api/services',     200),
  ('Baihgui hayg',           'http://localhost:3001/no-such-endpoint', 200),
  ('Untarsan server',        'http://localhost:9999/',                 200),
  ('Example.com',            'https://example.com',                    200);
