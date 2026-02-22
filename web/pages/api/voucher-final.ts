import type { NextApiRequest, NextApiResponse } from "next";
import { signVoucher } from "@/lib/signer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { participant, campaignId, expiry, nonce } = req.query;

  if (!participant || !campaignId || !expiry || !nonce) {
    return res.status(400).json({ error: "Paramètres manquants" });
  }

  // Check expiry
  const now = Math.floor(Date.now() / 1000);
  if (now > Number(expiry)) {
    return res.status(400).json({ error: "QR expiré. Rescanne le QR." });
  }

  try {
    const signature = await signVoucher(
      participant as string,
      campaignId as string,
      expiry as string,
      nonce as string,
    );
    return res.status(200).json({ signature });
  } catch (err: any) {
    console.error("Sign error:", err);
    return res.status(500).json({ error: err.message });
  }
}
