# ddia

This repo now runs on Node.

To install dependencies:

```bash
npm install
```

To run the server:

```bash
npm run dev
```

The dev and start scripts expect Node 20.6+.
They also load the repo's `.env` file via Node's `--env-file` flag.

The browser-side SSE page can be authored in TypeScript. Build it once with:

```bash
npm run build:client
```

Or watch it during development in a second terminal with:

```bash
npm run dev:client
```

To start Postgres with the repo configuration:

```bash
docker compose up -d db
```

This repo maps Postgres to host port `5433` so it does not collide with a locally installed Postgres already using `5432`.

The schema bootstrap script lives in `src/sql/init.sql` and is mounted into `/docker-entrypoint-initdb.d`, so it only runs when Postgres initializes a fresh data directory. If you change the schema and need to re-run the bootstrap on a local sandbox database, recreate the container with an empty volume:

```bash
docker compose down -v
docker compose up -d db
```

If you already have an older non-Compose container named `sandbox`, remove it before starting Compose or the repo's port and init-script settings will not apply.

To connect from the host shell, force a TCP connection instead of the local Unix socket:

```bash
PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d sandbox
```
