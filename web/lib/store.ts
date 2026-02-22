// ─── Email codes + verified emails (in memory) ────────────────

const codes = new Map<string, { code: string; expiresAt: number }>();

export function storeCode(email: string, code: string) {
  codes.set(email.toLowerCase().trim(), { code, expiresAt: Date.now() + 15 * 60 * 1000 });
}

export function checkCode(email: string, code: string): boolean {
  const entry = codes.get(email.toLowerCase().trim());
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) return false;
  return entry.code === code;
}

const verifiedEmails = new Map<string, number>();

export function markVerified(email: string) {
  verifiedEmails.set(email.toLowerCase().trim(), Date.now());
}

export function isVerified(email: string): boolean {
  const t = verifiedEmails.get(email.toLowerCase().trim());
  if (!t) return false;
  if (Date.now() - t > 2 * 60 * 60 * 1000) return false;
  return true;
}

// ─── QR Tickets (in memory) ───────────────────────────────────
// - BDE creates ticket every 30s via POST /api/create-ticket
// - QR = {origin}/claim?t={ticketId}  (no crypto params in URL)
// - Student opens URL → POST /api/claim-ticket {ticketId}
//   → if valid & not consumed & <30s old → returns crypto params
//   → student stores them in React state, has 1h to complete
// - No cookies, no sessions, no persistence

type Ticket = {
  campaignId: number;
  expiry: number;
  nonce: string;
  createdAt: number;
  used: boolean;
};

const tickets = new Map<string, Ticket>();

// Cleanup old tickets every 60s
setInterval(() => {
  const now = Date.now();
  tickets.forEach((t, id) => {
    if (now - t.createdAt > 120_000) tickets.delete(id);
  });
}, 60_000);

function rid(): string {
  const c = "abcdefghijklmnopqrstuvwxyz0123456789";
  let r = "";
  for (let i = 0; i < 20; i++) r += c[Math.floor(Math.random() * c.length)];
  return r;
}

export function createTicket(campaignId: number, expiry: number, nonce: string): string {
  const id = rid();
  tickets.set(id, { campaignId, expiry, nonce, createdAt: Date.now(), used: false });
  return id;
}

export function claimTicket(ticketId: string): 
  { ok: true; campaignId: number; expiry: number; nonce: string } | 
  { ok: false; error: string } {
  const t = tickets.get(ticketId);
  if (!t) return { ok: false, error: "QR invalide ou expiré. Rescanne le QR affiché à l'écran." };
  if (t.used) return { ok: false, error: "Ce QR a déjà été scanné. Rescanne le QR actuel." };
  if (Date.now() - t.createdAt > 30_000) return { ok: false, error: "QR expiré (>30s). Rescanne le QR affiché à l'écran." };
  t.used = true;
  return { ok: true, campaignId: t.campaignId, expiry: t.expiry, nonce: t.nonce };
}
