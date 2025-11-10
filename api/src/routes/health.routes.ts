import { FastifyInstance } from "fastify";
import { pool } from "../infra/db.js";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async (req, res) => {
    try {
      const res = await pool.query("SELECT 1 as ok");
      return { ok: res.rowCount === 1 };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  });
}
