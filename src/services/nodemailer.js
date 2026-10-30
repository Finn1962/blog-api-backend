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
    from: "process.env.GOOGLE_ACC_EMAIL",
    to: email,
    subject: "Your verification email",
    text: `Hello, click here to confirm your email address for CodersBlog: ${process.env.USER_FRONTEND_URL}verification/${verificationToken}`,
  };

  transporter.sendMail(mailOptions, (error) => {
    if (error) return console.log("Error while sending email:", error);
  });
}

export { sendEmailToVerifiyEmail };
