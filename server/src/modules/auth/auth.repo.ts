import type { User } from "../../generated/prisma/client.js";
import { prisma } from "../../db/client.js";

export function findByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export function findById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export function createUser(data: {
  email: string;
  username: string;
  passwordHash: string;
}): Promise<User> {
  return prisma.user.create({ data });
}
