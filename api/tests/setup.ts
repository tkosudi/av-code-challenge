import Fastify from "fastify";
import { reportsRoutes } from "../src/routes/reports.routes.js";
import { pool } from "../src/infra/db.js";

export async function createTestApp() {
  const app = Fastify();
  await app.register(reportsRoutes, { prefix: "/reports" });
  await app.ready();
  return app;
}

export async function closeTestApp(app: any) {
  await pool.end();
  await app.close();
}
