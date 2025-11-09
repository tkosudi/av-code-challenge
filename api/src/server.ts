import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const fastify = Fastify({ logger: true });

// CORS intentionally restrictive by default; ALLOWED_ORIGIN env var can open it
// Support engineer should fix this to allow frontend origin
await fastify.register(cors, {
  origin: process.env.ALLOWED_ORIGIN || "https://publisher.example.com",
});

// Postgres pool
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || "postgresql://support:support@db:5432/adtech",
});

fastify.get("/api/ad", async (request, reply) => {
  return {
    image: "https://via.placeholder.com/300x250?text=Ad+Creative",
    destination: "https://www.google.com",
    ad_id: "ad-001",
  };
});

// Click tracking endpoint
fastify.post("/api/click", async (request, reply) => {
  const { ad_id, user_agent, ip_address } = request.body as {
    ad_id?: string;
    user_agent?: string;
    ip_address?: string;
  };

  const q = `
    INSERT INTO click_events (ad_id, user_agent, ip_address)
    VALUES ($1, $2, $3)
    RETURNING id, clicked_at;
  `;

  const ip =
    ip_address || request.ip || request.headers["x-forwarded-for"] || "unknown";
  const ua = user_agent || request.headers["user-agent"] || "unknown";

  const res = await pool.query(q, [ad_id || "unknown", ua, ip]);
  return { success: true, event: res.rows[0] };
});

// Healthcheck
fastify.get("/health", async () => {
  try {
    const res = await pool.query("SELECT 1 as ok");
    return { ok: res.rowCount === 1 };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
});

// Reports endpoints - sample SQL queries for the challenge
// Note: The HAVING clause filters out publishers with avg_revenue <= 100
// This means publisher_id 2 (FoodDaily) won't appear due to the zero-revenue record
fastify.get("/reports/avg-revenue", async (request, reply) => {
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

fastify.get("/reports/ctr", async (request, reply) => {
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

const start = async () => {
  try {
    // Wait for database connection before starting server
    let retries = 5;
    while (retries > 0) {
      try {
        await pool.query("SELECT 1");
        break;
      } catch (err) {
        retries--;
        if (retries === 0) throw err;
        fastify.log.info(`Waiting for database... ${retries} retries left`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    await fastify.listen({
      port: Number(process.env.PORT) || 3000,
      host: "0.0.0.0",
    });
    fastify.log.info("API running at http://0.0.0.0:3000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
