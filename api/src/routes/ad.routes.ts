import { FastifyInstance } from "fastify";

export async function adRoutes(app: FastifyInstance) {
  app.get("/ad", async (req, reply) => ({
    image: "https://via.placeholder.com/300x250?text=Ad+Creative",
    destination: "https://www.google.com",
    ad_id: "ad-001",
  }));
}
