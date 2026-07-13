import type { User } from "../../generated/prisma/client.js";
import { ConflictError, InvalidCredentialsError, NotFoundError } from "../../shared/errors/errors.js";
import { hashPassword, verifyPassword } from "../../shared/auth/password.js";
import type { LoginInput, PublicUser, RegisterInput } from "./auth.schema.js";
import * as repo from "./auth.repo.js";

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    createdAt: user.createdAt,
  };
}

export async function register(input: RegisterInput): Promise<PublicUser> {
  if (await repo.findByEmail(input.email)) {
    throw new ConflictError("Email already registered");
  }
  const passwordHash = await hashPassword(input.password);
  const user = await repo.createUser({
    email: input.email,
    username: input.username,
    passwordHash,
  });
  return toPublicUser(user);
}

export async function login(input: LoginInput): Promise<PublicUser> {
  const user = await repo.findByEmail(input.email);
  // Same failure for unknown email and wrong password — no enumeration.
  if (!user || !(await verifyPassword(user.passwordHash, input.password))) {
    throw new InvalidCredentialsError();
  }
  return toPublicUser(user);
}

export async function getById(id: string): Promise<PublicUser> {
  const user = await repo.findById(id);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return toPublicUser(user);
}
