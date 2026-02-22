import { useEffect, useRef, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { QRCodeCanvas } from "qrcode.react";
import Head from "next/head";
import { useReadContract } from "wagmi";
import { cmAbi } from "@/lib/cmAbi";

function msUntilNext30s() { return 30_000 - (Date.now() % 30_000); }

function randomNonce(): string {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const buf = new Uint8Array(32);
    window.crypto.getRandomValues(buf);
    return "0x" + Array.from(buf).map(b => b.toString(16).padStart(2, "0")).join("");
  }
  return "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

export default function BdePage() {
  const [campaignId, setCampaignId] = useState(1);
  const [ticketId, setTicketId] = useState("");
  const [msLeft, setMsLeft] = useState(30_000);
  const [pulse, setPulse] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cmAddress = process.env.NEXT_PUBLIC_CM_ADDRESS as `0x${string}`;

  const { data: camp } = useReadContract({
    address: cmAddress, abi: cmAbi, functionName: "getCampaign",
    args: [BigInt(campaignId)], query: { refetchInterval: 2000 },
  });
  const participants = camp ? Number((camp as any).participantCount) : 0;
  const campName = camp ? String((camp as any).name) : "";

  async function refresh() {
    const expiry = Math.floor(Date.now() / 1000) + 3600;
    const nonce = randomNonce();
    try {
      const res = await fetch("/api/create-ticket", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ campaignId, expiry, nonce }),
      });
      const data = await res.json();
      if (data.id) { setTicketId(data.id); setPulse(p => p + 1); }
    } catch (e) { console.error(e); }
  }

  useEffect(() => {
    let alive = true;
    function tick() {
      if (!alive) return;
      refresh();
      timer.current = setTimeout(tick, msUntilNext30s());
    }
    refresh(); // immediate first
    timer.current = setTimeout(tick, msUntilNext30s());
    return () => { alive = false; if (timer.current) clearTimeout(timer.current); };
  }, [campaignId]);

  useEffect(() => {
    const id = setInterval(() => setMsLeft(msUntilNext30s()), 200);
    return () => clearInterval(id);
  }, []);

  const secs = Math.ceil(msLeft / 1000);
  const origin = process.env.NEXT_PUBLIC_PUBLIC_ORIGIN || (typeof window !== "undefined" ? window.location.origin : "");
  const url = ticketId ? `${origin}/claim?t=${ticketId}` : "";

  return (
    <>
      <Head><title>DauProof — BDE</title></Head>
      <div className="page">
        <header className="nav">
          <div className="nl"><a href="/" className="logo">DauProof</a><span className="badge">BDE</span></div>
          <ConnectButton />
        </header>
        <div className="grid">
          <aside className="side">
            <div className="card">
              <h3 className="ct">Campagne</h3>
              <label className="fl">ID</label>
              <input className="fi" type="number" value={campaignId} min={1} onChange={e => setCampaignId(Number(e.target.value))} />
              <div className="tr">
                <div className="tb">{secs}</div>
                <div><div className="ts">QR actif</div><div className="tm">Change toutes les 30s</div></div>
              </div>
              <div className="ib"><div className="il">Contrat</div><code className="ic">{cmAddress}</code></div>
            </div>
            <div className="card dark">
              <div className="big">{participants}</div>
              <div className="bl">participants</div>
              <div className="bs">{campName || `Campagne #${campaignId}`}</div>
            </div>
          </aside>
          <main className="main">
            <div className="qh"><h2 className="qt">QR Code Live</h2><div className="lp"><span className="ld"/>Sepolia</div></div>
            {url ? (
              <div className="qo" key={pulse}><div className="qi">
                <QRCodeCanvas value={url} size={340} bgColor="#FFF" fgColor="#0F1B2D" level="M" />
              </div></div>
            ) : <div className="ph">Chargement...</div>}
            <div className="qf"><div className="qp">Refresh dans <b>{secs}s</b></div></div>
            <p className="qn">Le QR change toutes les 30s et ne peut être scanné qu'une seule fois. Les captures d'écran sont inutiles.</p>
          </main>
        </div>
        <style jsx>{`
          .page{min-height:100vh;background:#FAFBFC}
          .nav{display:flex;justify-content:space-between;align-items:center;padding:14px 24px;background:var(--navy-900);border-bottom:1px solid rgba(255,255,255,.08)}
          .nl{display:flex;align-items:center;gap:10px}
          .logo{font-family:'DM Serif Display',Georgia,serif;font-size:22px;color:white;text-decoration:none}
          .badge{background:#3B82F6;color:white;font-size:10px;font-weight:700;padding:3px 8px;border-radius:999px}
          .grid{display:grid;grid-template-columns:320px 1fr;gap:24px;max-width:1000px;margin:0 auto;padding:24px}
          .side{display:flex;flex-direction:column;gap:14px}
          .card{background:white;border:1px solid var(--border);border-radius:14px;padding:18px}
          .dark{background:var(--navy-900);color:white;border:none}
          .ct{font-weight:800;font-size:13px;margin-bottom:12px}
          .fl{display:block;font-size:10px;color:var(--muted);font-weight:600;text-transform:uppercase;margin-bottom:4px}
          .fi{width:100%;padding:9px 12px;border-radius:10px;border:1px solid var(--border);background:#FAFBFC;font-size:14px;font-family:'JetBrains Mono',monospace;outline:none}
          .tr{display:flex;align-items:center;gap:10px;margin-top:14px}
          .tb{width:36px;height:36px;border-radius:999px;display:grid;place-items:center;background:#F0F4F8;border:1px solid var(--border);font-weight:800;font-size:13px;font-family:'JetBrains Mono',monospace}
          .ts{font-weight:700;font-size:12px}.tm{font-size:10px;color:var(--muted)}
          .ib{margin-top:12px;background:#F8F9FA;border:1px solid #EEF0F5;padding:10px;border-radius:10px}
          .il{font-size:9px;color:var(--subtle);font-weight:600;text-transform:uppercase}
          .ic{display:block;margin-top:3px;font-size:10px;font-family:'JetBrains Mono',monospace;word-break:break-all}
          .big{font-size:52px;font-weight:900;font-family:'JetBrains Mono',monospace;letter-spacing:-2px;line-height:1;color:var(--brand)}
          .bl{font-size:13px;font-weight:700;margin-top:4px}.bs{font-size:11px;color:rgba(255,255,255,.5);margin-top:3px}
          .main{background:white;border:1px solid var(--border);border-radius:14px;padding:24px;display:flex;flex-direction:column;align-items:center}
          .qh{width:100%;display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
          .qt{font-weight:800;font-size:15px}
          .lp{display:flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:#F8F9FA;border:1px solid var(--border);font-size:10px;color:var(--muted)}
          .ld{width:6px;height:6px;border-radius:999px;background:#16a34a;animation:blink 2s infinite}
          @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
          .qo{border-radius:18px;padding:12px;border:1px solid var(--border);background:#F8F9FA;animation:pop .3s}
          .qi{background:white;border-radius:14px;padding:12px;border:1px solid #EEF0F5}
          .ph{padding:80px;color:var(--muted)}
          @keyframes pop{from{opacity:.5;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
          .qf{margin-top:14px}.qp{padding:5px 12px;border-radius:999px;background:#F8F9FA;border:1px solid #EEF0F5;font-size:10px;color:var(--muted)}
          .qn{margin-top:10px;font-size:10px;color:var(--subtle);text-align:center;max-width:360px;line-height:1.5}
          @media(max-width:800px){.grid{grid-template-columns:1fr;max-width:480px}.side{order:2}.qi :global(canvas){width:min(80vw,340px)!important;height:min(80vw,340px)!important}}
        `}</style>
      </div>
    </>
  );
}
