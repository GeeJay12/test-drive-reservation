import type { Server } from "node:http";
import { createApp } from "./app.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";

export async function startServer(port: number): Promise<Server> {
  const app = createApp();
  const server = app.listen(port, () => {
    logger.info("API server started", { port });
  });

  const shutdown = async (signal: string) => {
    logger.info("Shutdown signal received", { signal });
    server.close(async () => {
      await prisma.$disconnect();
      logger.info("API server stopped");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });

  return server;
}
