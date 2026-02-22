import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";
import { storeCode } from "@/lib/store";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { email } = req.body;
  if (!email || !email.trim().toLowerCase().endsWith("@dauphine.eu")) {
    return res.status(400).json({ error: "Adresse @dauphine.eu requise" });
  }

  const normalized = email.trim().toLowerCase();
  const code = String(Math.floor(100000 + Math.random() * 900000));
  storeCode(normalized, code);
  console.log(`[CODE] ${normalized} → ${code}`);

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ ok: true });
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: "DauProof <onboarding@resend.dev>",
      to: normalized,
      subject: `DauProof — Code : ${code}`,
      html: `<div style="font-family:system-ui;max-width:400px;margin:0 auto;padding:24px">
        <h2 style="color:#0F1B2D">DauProof</h2>
        <div style="font-size:36px;font-weight:900;letter-spacing:4px;color:#0891B2;background:#F0F9FF;border-radius:12px;padding:16px;text-align:center;margin:16px 0">${code}</div>
        <p style="color:#94A3B8;font-size:12px">Expire dans 15 minutes.</p>
      </div>`,
    });
  } catch (err) {
    console.error("Resend error:", err);
  }

  return res.status(200).json({ ok: true });
}
