import express from "express";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/register", async (req, res) => {
  const { name, phone, email, city, gender, company, form_time: formTime } =
    req.body;

  if (!name || !phone || !email || !city || !gender) {
    return res.status(400).json({ ok: false, error: "missing_fields" });
  }

  if (company) {
    return res.status(400).json({ ok: false, error: "bot_detected" });
  }

  const submittedAt = Number(formTime);
  if (!Number.isFinite(submittedAt)) {
    return res.status(400).json({ ok: false, error: "invalid_form_time" });
  }

  const elapsedMs = Date.now() - submittedAt;
  if (elapsedMs < 3000) {
    return res.status(400).json({ ok: false, error: "too_fast" });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const fromAddress =
      process.env.MAIL_FROM || "hello@magicapturecreative.com";
    const toAddress =
      process.env.MAIL_TO || "hello@magicapturecreative.com";

    const text = [
      "New registration",
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Email: ${email}`,
      `City: ${city}`,
      `Gender: ${gender}`
    ].join("\n");

    await transporter.sendMail({
      from: fromAddress,
      to: toAddress,
      subject: "New TikTok Masterclass Registration",
      text
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("Email send failed:", error);
    res.status(500).json({ ok: false, error: "send_failed" });
  }
});

app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
