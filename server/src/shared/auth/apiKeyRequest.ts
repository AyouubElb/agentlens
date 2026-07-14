import "fastify";

// Set by apiKeyGuard on the ingest surface; the resolved agent the key belongs to.
declare module "fastify" {
  interface FastifyRequest {
    agentId: string;
  }
}
