import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
  type Mock,
} from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import request from "supertest";
import { pool } from "../src/infra/db.js";
import {
  reportsRoutes,
  AvgRevenueRow,
  CtrRow,
} from "../src/routes/reports.routes.js";

vi.mock("../src/infra/db.js", () => ({
  pool: { query: vi.fn() },
}));

describe("Reports Routes — /avg-revenue", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    await app.register(reportsRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return average revenue data successfully", async () => {
    const mockRows: AvgRevenueRow[] = [
      { publisher_id: 3, name: "TravelNow", avg_revenue: "200.00" },
      { publisher_id: 1, name: "TechMedia", avg_revenue: "135.63" },
      { publisher_id: 2, name: "FoodDaily", avg_revenue: "41.38" },
    ];

    (pool.query as unknown as Mock).mockResolvedValueOnce({
      rows: mockRows,
    });

    const response = await request(app.server).get("/avg-revenue");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockRows);
    expect(response.body).toHaveLength(3);
    expect(typeof response.body[0].avg_revenue).toBe("string");
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it("should handle database query failure gracefully", async () => {
    (pool.query as unknown as Mock).mockRejectedValueOnce(
      new Error("DB connection lost")
    );

    const response = await request(app.server).get("/avg-revenue");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Database query failed" });
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it("should return empty array when no reports exist", async () => {
    (pool.query as unknown as Mock).mockResolvedValueOnce({ rows: [] });

    const response = await request(app.server).get("/avg-revenue");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it("should return results ordered by avg_revenue DESC", async () => {
    const mockRows: AvgRevenueRow[] = [
      { publisher_id: 3, name: "TravelNow", avg_revenue: "200.00" },
      { publisher_id: 1, name: "TechMedia", avg_revenue: "135.63" },
      { publisher_id: 2, name: "FoodDaily", avg_revenue: "41.38" },
    ];

    (pool.query as unknown as Mock).mockResolvedValueOnce({
      rows: mockRows,
    });

    const response = await request(app.server).get("/avg-revenue");
    const avgs = response.body.map((r: AvgRevenueRow) => r.avg_revenue);

    expect(avgs).toEqual(["200.00", "135.63", "41.38"]);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });
});

describe("Reports Routes — /ctr", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    await app.register(reportsRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return average CTR data successfully", async () => {
    const mockRows: CtrRow[] = [
      { publisher_id: 3, name: "TravelNow", avg_ctr: "2.67" },
      { publisher_id: 1, name: "TechMedia", avg_ctr: "2.48" },
      { publisher_id: 2, name: "FoodDaily", avg_ctr: "2.26" },
    ];

    (pool.query as unknown as Mock).mockResolvedValueOnce({ rows: mockRows });

    const res = await request(app.server).get("/ctr");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockRows);
    expect(res.body).toHaveLength(3);
    expect(typeof res.body[0].avg_ctr).toBe("string");
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it("should return empty array when no CTR data exists", async () => {
    (pool.query as unknown as Mock).mockResolvedValueOnce({ rows: [] });

    const res = await request(app.server).get("/ctr");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it("should handle database query failure gracefully", async () => {
    (pool.query as unknown as Mock).mockRejectedValueOnce(
      new Error("DB connection lost")
    );

    const res = await request(app.server).get("/ctr");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Database query failed" });
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it("should return results ordered by avg_ctr DESC", async () => {
    const mockRows: CtrRow[] = [
      { publisher_id: 3, name: "TravelNow", avg_ctr: "2.67" },
      { publisher_id: 1, name: "TechMedia", avg_ctr: "2.48" },
      { publisher_id: 2, name: "FoodDaily", avg_ctr: "2.26" },
    ];

    (pool.query as unknown as Mock).mockResolvedValueOnce({ rows: mockRows });

    const res = await request(app.server).get("/ctr");
    const ctrs = res.body.map((r: CtrRow) => r.avg_ctr);

    expect(ctrs).toEqual(["2.67", "2.48", "2.26"]);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });
});
