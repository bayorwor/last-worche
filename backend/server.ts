// Application entry point: connects to the database and starts listening.
import { env } from "./src/config/dotenv.ts";
import { createApp } from "./src/app.ts";
import { openDatabase } from "./src/repositories/database.ts";

const db = await openDatabase(env.DATABASE_URL);

createApp(db).listen(env.PORT, () => {
  console.log(`lastWorche API listening on http://localhost:${env.PORT}`);
});
