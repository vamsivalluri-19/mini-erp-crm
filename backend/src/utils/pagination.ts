export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

export function getPaginationParams(queryPage?: unknown, queryLimit?: unknown): PaginationParams {
  const page = Math.max(1, parseInt(String(queryPage || '1'), 10));
  const limit = Math.max(1, Math.min(100, parseInt(String(queryLimit || '10'), 10))); // clamp limit to max 100
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
    take: limit,
  };
}

export function getPaginationMeta(total: number, page: number, limit: number) {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
  };
}
