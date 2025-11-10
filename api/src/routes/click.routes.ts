import { FastifyInstance } from "fastify";
import { pool } from "../infra/db.js";

interface ClickRequestBody {
  ad_id?: string;
  user_agent?: string;
  ip_address?: string;
}

export async function clickRoutes(app: FastifyInstance) {
  // Click tracking endpoint
  app.post("/click", async (request, reply) => {
    const { ad_id, user_agent, ip_address } = request.body as ClickRequestBody;

    if (!ad_id) {
      reply.status(400);
      return { error: "ad_id is required" };
    }

    const ip =
      ip_address ||
      request.ip ||
      request.headers["x-forwarded-for"] ||
      "unknown";

    const ua = user_agent || request.headers["user-agent"] || "unknown";

    const q = `
      INSERT INTO click_events (ad_id, user_agent, ip_address)
      VALUES ($1, $2, $3)
      RETURNING id, clicked_at;
    `;

    const res = await pool.query(q, [ad_id || "unknown", ua, ip]);
    return { success: true, event: res.rows[0] };
  });
}
