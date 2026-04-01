type Meta = Record<string, unknown>;

function write(level: "INFO" | "WARN" | "ERROR", message: string, meta?: Meta): void {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta } : {}),
  };
  console.log(JSON.stringify(payload));
}

export const logger = {
  info: (message: string, meta?: Meta) => write("INFO", message, meta),
  warn: (message: string, meta?: Meta) => write("WARN", message, meta),
  error: (message: string, meta?: Meta) => write("ERROR", message, meta),
};
