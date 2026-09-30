export function readCookie(req: Request, name: string): string | undefined {
  const prefix = `${name}=`;
  return req.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(prefix))
    ?.slice(prefix.length);
}
