import type { NextApiRequest, NextApiResponse } from "next";
import { createTicket } from "@/lib/store";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { campaignId, expiry, nonce } = req.body;
  if (!campaignId || !expiry || !nonce) return res.status(400).json({ error: "Missing params" });
  const id = createTicket(Number(campaignId), Number(expiry), nonce);
  return res.json({ id });
}
