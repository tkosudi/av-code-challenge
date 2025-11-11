import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import { env } from "./shared/config/env.js";
import { pool } from "./infra/db.js";
import { healthRoutes } from "./routes/health.routes.js";
import { adRoutes } from "./routes/ad.routes.js";
import { clickRoutes } from "./routes/click.routes.js";
import { reportsRoutes } from "./routes/reports.routes.js";
import { waitForDB } from "./shared/utils/wait-for-db.js";

dotenv.config();

const app = Fastify({ logger: true });

// CORS intentionally restrictive by default; ALLOWED_ORIGIN env var can open it
// Support engineer should fix this to allow frontend origin
await app.register(cors, {
  origin: env.ALLOWED_ORIGIN
    ? env.ALLOWED_ORIGIN.split(",").map((o) => o.trim())
    : false,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-access-token"],
});

app.register(healthRoutes);
app.register(adRoutes, { prefix: "/api" });
app.register(clickRoutes, { prefix: "/api" });
app.register(reportsRoutes, { prefix: "/reports" });

const start = async () => {
  try {
    await waitForDB(pool, app);
    await app.listen({
      port: Number(env.PORT) || 3000,
      host: "0.0.0.0",
    });
    app.log.info("API running at http://0.0.0.0:3000");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
