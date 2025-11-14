// api/contact.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_FORM_RECEIVER;

  if (!RESEND_API_KEY || !toEmail) {
    return res.status(500).json({
      error: "Missing RESEND_API_KEY or CONTACT_FORM_RECEIVER in environment variables."
    });
  }

  const { firstName, lastName, email, message } = req.body;

  const payload = {
    from: "Silky Road <noreply@silkyroad.vercel.app>",
    to: [toEmail],
    subject: "New Contact Form Message",
    html: `
      <h2>New Message from Silky Road</h2>
      <p><strong>Name:</strong> ${firstName} ${lastName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong><br>${message}</p>
    `
  };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();

  if (response.ok) {
    return res.status(200).json({ success: true, message: "Email sent" });
  } else {
    return res.status(500).json({ error: "Email send failed", details: result });
  }
}
