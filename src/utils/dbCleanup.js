import prisma from "../db/prisma.js";

async function refreshTokenCleanup() {
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
}

async function verificationTokenCleanup() {
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
}

async function resetTokenCleanup() {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const result = await prisma.Reset_Token.deleteMany({
    where: {
      created_at: {
        lte: oneDayAgo,
      },
    },
  });

  if (result.count > 0) {
    console.log(`[Cleanup] ${result.count} old reset-tokens deleted`);
  }
}

async function accountCleanup() {
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
}

refreshTokenCleanup();
verificationTokenCleanup();
resetTokenCleanup();
accountCleanup();
