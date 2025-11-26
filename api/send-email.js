import nodemailer from "nodemailer";

export default async function handler(req, res) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: req.body.to,
      subject: req.body.subject,
      html: req.body.html
    });

    return res.status(200).json({ success: true, message: "Email sent", info });
  } catch (err) {
    console.error("Email error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
