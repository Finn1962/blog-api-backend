import "dotenv/config";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 587,
  auth: {
    user: process.env.GOOGLE_ACC_EMAIL,
    pass: process.env.GOOGLE_ACC_APP_PASSWORD,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error("❌ Connection failed:", error);
  } else {
    console.log("✅ Server is ready to send emails!");
  }
});

function sendEmailToVerifiyEmail({ email, verificationToken }) {
  const mailOptions = {
    from: process.env.GOOGLE_ACC_EMAIL,
    to: email,
    subject: "Your verification email",
    text: `Hello, click here to confirm your email address for CodersBlog: ${process.env.USER_FRONTEND_URL}verification/${verificationToken}`,
  };

  transporter.sendMail(mailOptions, (error) => {
    if (error) return console.log("Error while sending email:", error);
  });
}

function sendEmailToResetPassword({ email, resetToken }) {
  const mailOptions = {
    from: process.env.GOOGLE_ACC_EMAIL,
    to: email,
    subject: "Your reset email",
    text: `Hello, click here to reset your password for CodersBlog: ${process.env.USER_FRONTEND_URL}new-password/${resetToken}`,
  };

  transporter.sendMail(mailOptions, (error) => {
    if (error) return console.log("Error while sending email:", error);
  });
}

async function sendNotificationEmailToAllUsers({ users, postId }) {
  const batchGrowth = 10;
  for (let i = 0; i < users.length; i += batchGrowth) {
    const batch = users.slice(i, i + batchGrowth);

    await Promise.allSettled(
      batch.map((user) => {
        const mailOptions = {
          from: process.env.GOOGLE_ACC_EMAIL,
          to: user.email,
          subject: "A new blog post appeared!",
          text: `Hello, A new blog post has been published on codersBlog. Click here to check it out. http://localhost:5000/post/${postId}`,
        };

        return transporter.sendMail(mailOptions, (error) => {
          if (error) return console.log("Error while sending email:", error);
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
