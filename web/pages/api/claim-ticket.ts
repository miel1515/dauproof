import type { NextApiRequest, NextApiResponse } from "next";
import { claimTicket } from "@/lib/store";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { ticketId } = req.body;
  if (!ticketId) return res.status(400).json({ error: "ticketId required" });
  const result = claimTicket(ticketId);
  if (!result.ok) return res.status(400).json({ error: (result as any).error });
  return res.json({ campaignId: (result as any).campaignId, expiry: (result as any).expiry, nonce: (result as any).nonce });
}
