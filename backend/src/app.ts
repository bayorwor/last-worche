// Builds the Express app and connects the layers:
// routes -> controllers -> services -> domain, with services using repositories for storage.
import cors from "cors";
import express from "express";
import morgan from "morgan";
import { env } from "./config/dotenv.ts";
import { createAiController } from "./controllers/aiController.ts";
import { createAuthController } from "./controllers/authController.ts";
import { createBookingController } from "./controllers/bookingController.ts";
import { createAuthGuards } from "./middlewares/authentication.ts";
import { errorHandler } from "./middlewares/errorHandler.ts";
import type { BookingRepository } from "./repositories/bookingRepository.ts";
import { TEST_PASSWORD } from "./repositories/seedData.ts";
import type { UserRepository } from "./repositories/userRepository.ts";
import { createAiRoutes } from "./routes/aiRoutes.ts";
import { createAuthRoutes } from "./routes/authRoutes.ts";
import { createBookingRoutes } from "./routes/bookingRoutes.ts";
import { createAuthService } from "./services/authService.ts";
import { createBookingService } from "./services/bookingService.ts";

type AppDependencies = {
  bookingRepository: BookingRepository;
  userRepository: UserRepository;
};

export function createApp({ bookingRepository, userRepository }: AppDependencies) {
  const bookingService = createBookingService(bookingRepository);
  const authService = createAuthService(userRepository, {
    sessionSecret: env.JWT_SECRET,
    testAccountPassword: env.TEST_ACCOUNTS_ENABLED ? TEST_PASSWORD : null,
  });
  const guards = createAuthGuards(authService);

  const app = express();
  app.use(morgan("dev", { skip: () => process.env.NODE_ENV === "test" }));
  app.use(cors({ origin: env.CORS_ORIGINS }));
  app.use(express.json());

  app.use("/api/auth", createAuthRoutes(createAuthController(authService), guards));
  app.use("/api", createBookingRoutes(createBookingController(bookingService), guards));
  app.use("/api/ai", createAiRoutes(createAiController(), guards));

  app.use(errorHandler); // must stay last, after all routes
  return app;
}
