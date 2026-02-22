import type { NextApiRequest, NextApiResponse } from "next";
import { checkCode, markVerified } from "@/lib/store";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: "Email et code requis" });

  if (!checkCode(email, code)) {
    return res.status(400).json({ error: "Code invalide ou expiré" });
  }

  markVerified(email);
  return res.status(200).json({ ok: true, email: email.trim().toLowerCase() });
}
