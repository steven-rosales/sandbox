import type { PoolClient } from "pg";
import { pool } from "./41-database.js";

export async function inTransaction<T>(
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  // checks out a client
  const client = await pool.connect();

  // flag to release client if true
  let destroyClient = false;

  try {
    // start tx
    await client.query("BEGIN");

    // sets current tx a 5 second limit on each individual SQL query
    await client.query("SET LOCAL statement_timeout = '5s'");

    const result = await operation(client);

    // end tx
    await client.query("COMMIT");

    // if every callback returns without throwing, commit finalizes the DB changes
    return result;
  } catch (error: unknown) {
    try {
      // rollback; reverts all uncommitted mutations, releases acquired locks, and clears postgres's 'aborted' state
      await client.query("ROLLBACK");
    } catch (rollbackErr: unknown) {
      // rolback rejected, release the client
      destroyClient = true;

      console.error({ event: "transaction_rollback_failed", rollbackErr });
    }

    throw error;
  } finally {
    // instructs pg-pool to destroy the underlying socket rather than returning a corrupted or un-rolled back connection to the pool
    client.release(destroyClient);
  }
}
