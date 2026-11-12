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

      const verificationTokenResult =
        await prisma.Verification_Token.deleteMany({
          where: {
            created_at: {
              lte: oneHourAgo,
            },
          },
        });

      if (verificationTokenResult.count > 0)
        console.log(
          `[Cleanup] ${verificationTokenResult.count} old verification-tokens deleted`,
        );

      const resetTokenResult = await prisma.Reset_Token.deleteMany({
        where: {
          created_at: {
            lte: oneHourAgo,
          },
        },
      });

      if (resetTokenResult.count > 0)
        console.log(
          `[Cleanup] ${resetTokenResult.count} old reset-tokens deleted`,
        );

      const userResult = await prisma.User.deleteMany({
        where: {
          AND: [
            {
              created_at: {
                lte: oneDayAgo,
              },
            },
            { is_verified: false },
          ],
        },
      });

      if (userResult.count > 0)
        console.log(`[Cleanup] ${userResult.count} accounts deleted`);
    } catch (error) {
      console.error(error);
    }
  });
}

export { dbCleanup };
