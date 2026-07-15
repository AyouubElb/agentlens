import type { FastifyRequest } from "fastify";
import { prisma } from "../../db/client.js";
import { hashApiKey } from "../auth/apiKey.js";
import { UnauthorizedError } from "../errors/errors.js";

function bearerToken(req: FastifyRequest): string | null {
  const header = req.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice(7) : null;
}

// Ingest auth: resolve the API key to its agent. Not user-scoped — the key is the identity.
export async function apiKeyGuard(request: FastifyRequest): Promise<void> {
  const token = bearerToken(request);
  if (!token) throw new UnauthorizedError();

  const key = await prisma.apiKey.findFirst({
    where: { keyHash: hashApiKey(token), revokedAt: null },
    select: { agentId: true },
  });
  if (!key) throw new UnauthorizedError();

  request.agentId = key.agentId;
}
