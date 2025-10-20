import { app } from "./app.js";
import nodemailer from "nodemailer";
import "dotenv/config";

app.get("/", (req, res) => res.send("Hello from NodeMailer app!"));

app.get("/send-mail", async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL_USER,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      },
    });

    await transporter.verify();

    const info = await transporter.sendMail({
      from: `"PK" <${process.env.EMAIL_USER}>`,
      to: "razzzpriyanshu@gmail.com",
      subject: "Hello ✔",
      text: "Hello world?",
      html: "<b>Hello world?</b>",
    });

    console.log("Mail info:", info);

    res.status(200).json({ ok: true, messageId: info.messageId });
  } catch (err) {
    console.error("Mail error:", err);
    res
      .status(500)
      .json({ ok: false, error: (err && err.message) || String(err) });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
