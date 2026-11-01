// Builds the Express app and connects the layers:
// routes -> controllers -> services -> domain, with services using repositories for storage.
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/dotenv.ts";
import { createActivityController } from "./controllers/activityController.ts";
import { createAiController } from "./controllers/aiController.ts";
import { createAuthController } from "./controllers/authController.ts";
import { createBookingController } from "./controllers/bookingController.ts";
import { createForecastController } from "./controllers/forecastController.ts";
import { createProofOfWorkController } from "./controllers/proofOfWorkController.ts";
import { createPurchasingController } from "./controllers/purchasingController.ts";
import { openapiDocument } from "./docs/openapiDocument.ts";
import { createAuthGuards } from "./middlewares/authentication.ts";
import { errorHandler } from "./middlewares/errorHandler.ts";
import type { ActivityRepository } from "./repositories/activityRepository.ts";
import type { BookingRepository } from "./repositories/bookingRepository.ts";
import type { UserRepository } from "./repositories/userRepository.ts";
import { createActivityRoutes } from "./routes/activityRoutes.ts";
import { createAiRoutes } from "./routes/aiRoutes.ts";
import { createAuthRoutes } from "./routes/authRoutes.ts";
import { createBookingRoutes } from "./routes/bookingRoutes.ts";
import { createIntegrationRoutes } from "./routes/integrationRoutes.ts";
import { createForecastRoutes } from "./routes/forecastRoutes.ts";
import { createProofOfWorkRoutes } from "./routes/proofOfWorkRoutes.ts";
import { createPurchasingRoutes } from "./routes/purchasingRoutes.ts";
import { createActivityService } from "./services/activityService.ts";
import { createAuthService } from "./services/authService.ts";
import { sendEmail } from "./services/emailService.ts";
import { createFollowUpService } from "./services/followUpService.ts";
import { createForecastService } from "./services/forecastService.ts";
import { createProofOfWorkService } from "./services/proofOfWorkService.ts";
import { createPurchasingService } from "./services/purchasingService.ts";
import { createBookingService } from "./services/bookingService.ts";

type AppDependencies = {
  bookingRepository: BookingRepository;
  userRepository: UserRepository;
  activityRepository: ActivityRepository;
  signInLimitPerMinute?: number;
};

export function createApp({ bookingRepository, userRepository, activityRepository, signInLimitPerMinute = env.SIGN_IN_LIMIT_PER_MINUTE }: AppDependencies) {
  const bookingService = createBookingService(bookingRepository);
  const authService = createAuthService(userRepository, {
    sessionSecret: env.JWT_SECRET,
    showCodes: env.MAIL_MOCK,
    testAccountsEnabled: env.TEST_ACCOUNTS_ENABLED,
    sendEmail,
    activities: activityRepository,
  });
  const guards = createAuthGuards(authService);

  const app = express();
  app.use(morgan("dev", { skip: () => process.env.NODE_ENV === "test" }));
  app.use(cors({ origin: env.CORS_ORIGINS }));

  // Before helmet, because Swagger UI needs its own inline script, which helmet's rules rightly forbid elsewhere.
  app.get("/api/openapi.json", (_req, res) => {
    res.json(openapiDocument);
  });
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));

  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", async (_req, res) => {
    try {
      await bookingRepository.ping();
      res.json({ status: "ok", database: "ok" });
    } catch {
      res.status(503).json({ status: "unavailable", database: "unreachable" });
    }
  });

  app.use("/api/auth", createAuthRoutes(createAuthController(authService), guards, signInLimitPerMinute));
  app.use("/api", createBookingRoutes(createBookingController(bookingService), guards));
  app.use("/api", createProofOfWorkRoutes(createProofOfWorkController(createProofOfWorkService(bookingRepository)), guards));
  app.use("/api", createForecastRoutes(createForecastController(createForecastService(bookingRepository), createFollowUpService(bookingRepository)), guards));
  app.use("/api/integrations", createIntegrationRoutes(bookingService, env.SUPPLIER_API_KEYS));
  app.use("/api/ai", createAiRoutes(createAiController(bookingService), guards));
  app.use("/api/activity", createActivityRoutes(createActivityController(createActivityService(activityRepository)), guards));
  app.use("/api/purchasing", createPurchasingRoutes(createPurchasingController(createPurchasingService(bookingRepository)), guards));

  // An unknown API address answers in JSON too, not with the framework's HTML page.
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "This API address does not exist." });
  });

  app.use(errorHandler); // must stay last, after all routes
  return app;
}
