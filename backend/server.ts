// Application entry point: connects to the database and starts listening.
import { env } from "./src/config/dotenv.ts";
import { createApp } from "./src/app.ts";
import { openDatabase } from "./src/repositories/database.ts";
import { createMysqlActivityRepository } from "./src/repositories/mysqlActivityRepository.ts";
import { createMysqlBookingRepository } from "./src/repositories/mysqlBookingRepository.ts";
import { createMysqlUserRepository } from "./src/repositories/mysqlUserRepository.ts";

const db = await openDatabase(env.DATABASE_URL);

const app = createApp({
  bookingRepository: createMysqlBookingRepository(db),
  userRepository: createMysqlUserRepository(db),
  activityRepository: createMysqlActivityRepository(db),
});

const server = app.listen(env.PORT, () => {
  console.log(`lastWorche API listening on http://localhost:${env.PORT}`);
});

// Finishes the requests in progress before stopping, so a restart cannot cut a booking in half.
function shutDown() {
  server.close(async () => {
    await db.end();
    process.exit(0);
  });
}
process.on("SIGTERM", shutDown);
process.on("SIGINT", shutDown);
