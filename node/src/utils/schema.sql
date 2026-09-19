CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS provider;

CREATE TABLE IF NOT EXISTS app.orders (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  
  status text NOT NULL CHECK (status IN ('accepted', 'submitted', 'failed')),

  version integer NOT NULL DEFAULT 0,
  provider_reference text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_tenant_created_idx ON app.orders (tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS app.api_idempotency (
  tenant_id uuid NOT NULL,
  idempotency_key text NOT NULL,
  request_hash text NOT NULL,

  response_status integer,
  response_body jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '24 hours',

  PRIMARY KEY (tenant_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS app.outbox_events (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,

  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,

  event_type text NOT NULL,
  event_version integer NOT NULL,
  payload jsonb NOT NULL,

  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN (
      'pending', 'processing', 'published', 'dead'
    )
  ),

  attempts integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),

  lease_owner text,
  lease_expires_at timestamptz,
  lease_token integer NOT NULL DEFAULT 0,

  last_error text,
  published_at timestamptz,
  dead_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),

  CHECK (
    status <> 'processing'
    OR (
      lease_owner IS NOT NULL
      AND lease_expires_at IS NOT NULL
    )
  )
);

CREATE INDEX IF NOT EXISTS outbox_ready_idx ON app.outbox_events (
  available_at, created_at
) WHERE status IN ('pending', 'processing');

-- This belongs logically to the external provider.
-- It is the same PostgreSQL instance only to simplify the lab.
CREATE TABLE IF NOT EXISTS provider.operations (
  idempotency_key text PRIMARY KEY,
  request_hash text NOT NULL,

  order_id uuid NOT NULL,
  provider_reference text NOT NULL,
  response_body jsonb NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now()
);