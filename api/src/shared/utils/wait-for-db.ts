import { FastifyInstance } from "fastify";
import { Pool } from "pg";

export async function waitForDB(pool: Pool, app: FastifyInstance) {
  // Wait for database connection before starting server
  let retries = 5;
  while (retries > 0) {
    try {
      await pool.query("SELECT 1");
      break;
    } catch (err) {
      retries--;
      if (retries === 0) throw err;
      app.log.info(`Waiting for database... ${retries} retries left`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}
