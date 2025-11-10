import { FastifyInstance } from "fastify";
import { pool } from "../infra/db.js";

export async function reportsRoutes(app: FastifyInstance) {
  // Reports endpoints - sample SQL queries for the challenge
  // Note: The HAVING clause filters out publishers with avg_revenue <= 100
  // This means publisher_id 2 (FoodDaily) won't appear due to the zero-revenue record
  app.get("/avg-revenue", async (req, reply) => {
    const q = `
      SELECT p.id AS publisher_id, p.name,
        ROUND(AVG(r.revenue)::numeric, 2) AS avg_revenue
      FROM publishers p
      JOIN reports r ON r.publisher_id = p.id
      GROUP BY p.id, p.name
      HAVING AVG(r.revenue) > 100
      ORDER BY avg_revenue DESC;
    `;
    const res = await pool.query(q);
    return res.rows;
  });

  app.get("/ctr", async (req, reply) => {
    const q = `
      SELECT p.id AS publisher_id, p.name,
        ROUND(AVG(CASE WHEN r.impressions > 0 THEN (r.clicks::numeric / r.impressions) * 100 ELSE 0 END)::numeric, 2) AS avg_ctr
      FROM publishers p
      JOIN reports r ON r.publisher_id = p.id
      GROUP BY p.id, p.name
      ORDER BY avg_ctr DESC;
    `;
    const res = await pool.query(q);
    return res.rows;
  });
}
