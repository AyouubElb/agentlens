import { z, type ZodType } from "zod";

// Shared list-pagination contract: every list endpoint accepts `?page=&limit=` and returns the same
// envelope, so the client's Pager can consume any list identically.
export const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type PageParams = z.infer<typeof pageQuery>;

// Response-schema factory: paginated(itemSchema) → { items, page, limit, total }.
export function paginated<T extends ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
  });
}

export interface Page<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

// Prisma skip/take from page params — one place owns the offset arithmetic.
export function skipTake({ page, limit }: PageParams): { skip: number; take: number } {
  return { skip: (page - 1) * limit, take: limit };
}
