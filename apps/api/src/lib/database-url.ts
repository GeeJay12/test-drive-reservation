export type DatabaseRole = "api" | "dbo";

function getRequiredEnv(name: "POSTGRES_API_PASSWORD" | "POSTGRES_DBO_PASSWORD"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

export function buildDatabaseUrl(role: DatabaseRole): string {
  const host = process.env["POSTGRES_HOST"] ?? "localhost";
  const port = process.env["POSTGRES_PORT"] ?? "5432";
  const database = process.env["POSTGRES_DB"] ?? "nevo";
  const schema = process.env["POSTGRES_SCHEMA"] ?? "public";

  const user = role === "dbo" ? "nevo_dbo" : "nevo_api";
  const password =
    role === "dbo" ? getRequiredEnv("POSTGRES_DBO_PASSWORD") : getRequiredEnv("POSTGRES_API_PASSWORD");

  return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}?schema=${schema}`;
}
