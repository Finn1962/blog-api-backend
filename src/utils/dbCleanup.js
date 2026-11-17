import cron from "node-cron";
import prisma from "../db/prisma.js";

function dbCleanup() {
  cron.schedule("*/10 * * * *", async () => {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const refreshTokenResult = await prisma.Refresh_Token.deleteMany({
        where: {
          created_at: {
            lte: oneWeekAgo,
          },
        },
      });

      if (refreshTokenResult.count > 0)
        console.log(
          `[Cleanup] ${refreshTokenResult.count} old refresh-tokens deleted`,
        );
    } catch (error) {
      console.error(error);
    }
  });
}

export { dbCleanup };
