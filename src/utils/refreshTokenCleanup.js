import cron from "node-cron";
import prisma from "../db/prisma.js";

function refreshTokenCleanup() {
  cron.schedule("*/10 * * * *", async () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const ergebnis = await prisma.post.deleteMany({
      where: {
        created_at: {
          lte: oneWeekAgo, // kleiner oder gleich vor einer Woche
        },
      },
    });

    console.log(`${ergebnis.count} alte Elemente wurden erfolgreich gelöscht.`);
  });
}

export { refreshTokenCleanup };
