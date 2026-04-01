import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/error-handler.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { apiRoutes } from "./routes/index.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(
    cors({
      origin: "http://localhost:3000",
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(requestIdMiddleware);

  app.use("/api", apiRoutes);
  app.use(errorHandler);

  return app;
}
