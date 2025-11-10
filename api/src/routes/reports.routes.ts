import { FastifyInstance } from "fastify";
import { pool } from "../infra/db.js";

export interface AvgRevenueRow {
  publisher_id: number;
  name: string;
  avg_revenue: string;
}

export interface CtrRow {
  publisher_id: number;
  name: string;
  avg_ctr: string;
}

export async function reportsRoutes(app: FastifyInstance) {
  // Reports endpoints - sample SQL queries for the challenge
  // Note: The HAVING clause filters out publishers with avg_revenue <= 100
  // This means publisher_id 2 (FoodDaily) won't appear due to the zero-revenue record
  app.get("/avg-revenue", async (req, reply) => {
    try {
      const q = `
        SELECT 
          p.id AS publisher_id,
          p.name,
          ROUND(AVG(sub.daily_avg)::numeric, 2) AS avg_revenue
        FROM publishers p
        JOIN (
          SELECT 
            publisher_id,
            date,
            AVG(DISTINCT revenue) AS daily_avg
          FROM reports
          GROUP BY publisher_id, date
        ) sub ON sub.publisher_id = p.id
        GROUP BY p.id, p.name
        ORDER BY avg_revenue DESC;
      `;
      const res = await pool.query<AvgRevenueRow>(q);
      return reply.code(200).send(res.rows);
    } catch (err) {
      req.log.error(err);
      return reply.code(500).send({ error: "Database query failed" });
    }
  });

  app.get("/ctr", async (req, reply) => {
    try {
      const q = `
        SELECT
          p.id   AS publisher_id,
          p.name,
          COALESCE(
            ROUND(100 * (SUM(r.clicks)::numeric / NULLIF(SUM(r.impressions), 0)), 2),
            0
          ) AS avg_ctr
        FROM publishers p
        LEFT JOIN reports r
          ON r.publisher_id = p.id
        GROUP BY p.id, p.name
        ORDER BY avg_ctr DESC;
      `;
      const res = await pool.query<CtrRow>(q);
      return reply.code(200).send(res.rows);
    } catch (err) {
      req.log.error(err);
      return reply.code(500).send({ error: "Database query failed" });
    }
  });
}
