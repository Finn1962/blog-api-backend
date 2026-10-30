import cron from "node-cron";
import prisma from "../db/prisma.js";

function refreshTokenCleanup() {
  cron.schedule("0 0 * * *", async () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const result = await prisma.Refresh_Token.deleteMany({
      where: {
        created_at: {
          lte: oneWeekAgo, // kleiner oder gleich vor einer Woche
        },
      },
    });

    if (result.count > 0) {
      console.log(`[Cleanup] ${result.count} old refresh-tokens deleted`);
    }
  });
}

function verificationTokenCleanup() {
  cron.schedule("0 0 * * *", async () => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const result = await prisma.Verification_Token.deleteMany({
      where: {
        created_at: {
          lte: oneDayAgo,
        },
      },
    });

    if (result.count > 0) {
      console.log(`[Cleanup] ${result.count} old verification-tokens deleted`);
    }
  });
}

function accountCleanup() {
  cron.schedule("*/15 * * * *", async () => {
    const fifteenMinutesAgo = new Date();
    fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

    const result = await prisma.User.deleteMany({
      where: {
        AND: [
          {
            created_at: {
              lte: fifteenMinutesAgo,
            },
          },
          { is_verified: false },
        ],
      },
    });

    if (result.count > 0) {
      console.log(`[Cleanup] ${result.count} accounts deleted`);
    }
  });
}

export { refreshTokenCleanup, verificationTokenCleanup, accountCleanup };
