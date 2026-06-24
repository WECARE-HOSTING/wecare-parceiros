const ADMIN_ONLY_ROUTE_PREFIXES = [
  "/admin/kanban",
  "/partners",
  "/properties",
  "/materials",
  "/notifications",
] as const;

export function isAdminOnlyRoute(pathname: string): boolean {
  return ADMIN_ONLY_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
