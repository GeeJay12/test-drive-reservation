import "dotenv/config";
import { startServer } from "./server.js";

const port = Number(process.env["APP_PORT"] ?? "4000");

void startServer(port);
