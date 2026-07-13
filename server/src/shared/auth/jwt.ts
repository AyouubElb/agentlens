import "@fastify/jwt";

export interface AuthTokenPayload {
  sub: string;
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: AuthTokenPayload;
    user: AuthTokenPayload;
  }
}
