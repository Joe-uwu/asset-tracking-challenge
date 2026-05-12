import type { FastifyInstance } from "fastify";
import { FACILITIES_RECORDS } from "../seed/facilities.js";
import { FINANCE_RECORDS } from "../seed/finance.js";
import {
  PROCEDURAL_FACILITIES,
  PROCEDURAL_FINANCE,
} from "../seed/procedural.js";

// Hand-crafted records carry the planted mismatches; procedural records form a
// clean baseline so the lists feel real. Concatenated at startup, served as
// one response.
const ALL_FACILITIES = [...FACILITIES_RECORDS, ...PROCEDURAL_FACILITIES];
const ALL_FINANCE = [...FINANCE_RECORDS, ...PROCEDURAL_FINANCE];

export async function mocksRoutes(app: FastifyInstance): Promise<void> {
  app.get("/v1/mock/facilities/spaces", async (_req, reply) => {
    return reply.send(ALL_FACILITIES);
  });

  app.get("/v1/mock/finance/equipment", async (_req, reply) => {
    return reply.send(ALL_FINANCE);
  });
}
