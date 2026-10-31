// Builds the Express app and connects the layers:
// routes -> controllers -> services -> domain, with services using repositories for storage.
import express from "express";
import morgan from "morgan";
import type { Pool } from "mysql2/promise";
import { createAiController } from "./controllers/aiController.ts";
import { createBookingController } from "./controllers/bookingController.ts";
import { errorHandler } from "./middlewares/errorHandler.ts";
import { createMysqlBookingRepository } from "./repositories/mysqlBookingRepository.ts";
import { createAiRoutes } from "./routes/aiRoutes.ts";
import { createBookingRoutes } from "./routes/bookingRoutes.ts";
import { createBookingService } from "./services/bookingService.ts";

export function createApp(db: Pool) {
  const bookingService = createBookingService(createMysqlBookingRepository(db));

  const app = express();
  app.use(morgan("dev"));
  app.use(express.json());

  app.use("/api", createBookingRoutes(createBookingController(bookingService)));
  app.use("/api/ai", createAiRoutes(createAiController()));

  app.use(errorHandler); // must stay last, after all routes
  return app;
}
