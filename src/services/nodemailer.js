import "dotenv/config";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function sendEmailToVerifiyEmail({ email, verificationToken }) {
  resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Your verification email",
    text: `Hello, click here to confirm your email address for CodersBlog: ${process.env.USER_FRONTEND_URL}verification/${verificationToken}`,
  });

  console.log("EMAIL ABGESENDET");
}

function sendEmailToResetPassword({ email, resetToken }) {
  resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Your reset email",
    text: `Hello, click here to reset your password for CodersBlog: ${process.env.USER_FRONTEND_URL}new-password/${resetToken}`,
  });
}

async function sendNotificationEmailToAllUsers({ users, postId }) {
  const batchGrowth = 10;
  for (let i = 0; i < users.length; i += batchGrowth) {
    const batch = users.slice(i, i + batchGrowth);

    await Promise.allSettled(
      batch.map((user) => {
        resend.emails.send({
          from: "onboarding@resend.dev",
          to: user.email,
          subject: "A new blog post appeared!",
          text: `Hello, A new blog post has been published on codersBlog. Click here to check it out. http://localhost:5000/post/${postId}`,
        });
      }),
    );
  }
}

export {
  sendEmailToVerifiyEmail,
  sendEmailToResetPassword,
  sendNotificationEmailToAllUsers,
};
