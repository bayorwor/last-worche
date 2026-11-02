// Sends the weekly email digest once and stops. Run it weekly from the operating system's scheduler,
// for example cron on Monday at 07:00, as decided in docs/adr/0019-weekly-digest-job.md.
import { env } from "./src/config/dotenv.ts";
import { openDatabase } from "./src/repositories/database.ts";
import { createMysqlBookingRepository } from "./src/repositories/mysqlBookingRepository.ts";
import { createMysqlDigestRepository } from "./src/repositories/mysqlDigestRepository.ts";
import { createDigestService } from "./src/services/digestService.ts";
import { sendEmail } from "./src/services/emailService.ts";
import { createForecastService } from "./src/services/forecastService.ts";

const db = await openDatabase(env.DATABASE_URL);
const bookings = createMysqlBookingRepository(db);

try {
  const digests = createDigestService({ digests: createMysqlDigestRepository(db), bookings, forecasts: createForecastService(bookings), sendEmail });
  const { sent, alreadySent, failed } = await digests.sendWeeklyDigests();
  console.log(`Weekly digest: ${sent} sent, ${alreadySent} already sent this week, ${failed} failed.`);
  process.exitCode = failed > 0 ? 1 : 0;
} finally {
  await db.end();
}
