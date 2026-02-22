import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { keccak256, stringToBytes } from "viem";
import { cmAbi } from "@/lib/cmAbi";
import Head from "next/head";

function isDauphine(e: string) { return e.trim().toLowerCase().endsWith("@dauphine.eu"); }

const CM = process.env.NEXT_PUBLIC_CM_ADDRESS as `0x${string}`;

export default function ClaimPage() {
  const r = useRouter();
  const ticketId = typeof r.query.t === "string" ? r.query.t : "";

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { writeContract, isPending, data: txHash } = useWriteContract();
  useWaitForTransactionReceipt({ hash: txHash });

  // Crypto params from ticket
  const [params, setParams] = useState<{ campaignId: string; expiry: string; nonce: string } | null>(null);
  const [ticketError, setTicketError] = useState("");
  const [loading, setLoading] = useState(true);

  // Email
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [code, setCode] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);

  // Status
  const [status, setStatus] = useState("");
  const [sType, setSType] = useState<"info" | "success" | "error">("info");

  // Lock ticket on page load
  useEffect(() => {
    if (!ticketId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/claim-ticket", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ticketId }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) { setTicketError(data.error || "Ticket invalide"); setLoading(false); return; }
        setParams({ campaignId: String(data.campaignId), expiry: String(data.expiry), nonce: data.nonce });
        setLoading(false);
      } catch {
        if (!cancelled) { setTicketError("Erreur réseau"); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [ticketId]);

  useEffect(() => {
    if (r.isReady && !ticketId) setLoading(false);
  }, [r.isReady, ticketId]);

  const step = !verifiedEmail ? 1 : (!isConnected || chainId !== 11155111) ? 2 : 3;

  async function sendCode() {
    setStatus(""); setSType("info");
    if (!isDauphine(email)) return;
    const res = await fetch("/api/send-code", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setStatus(data?.error || "Erreur"); setSType("error"); return; }
    setEmailSent(true);
    setStatus("📩 Code envoyé !"); setSType("info");
  }

  async function verifyCode() {
    setStatus(""); setSType("info");
    const res = await fetch("/api/verify-code", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), code }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setStatus(data?.error || "Code invalide"); setSType("error"); return; }
    setVerifiedEmail(data.email);
    setStatus("✅ Email vérifié !"); setSType("success");
  }

  async function participate() {
    if (!address || !verifiedEmail || !params) return;
    setStatus(""); setSType("info");
    if (chainId !== 11155111) { setStatus("⚠️ Passe sur Sepolia"); setSType("error"); return; }

    const nonce32 = keccak256(stringToBytes(params.nonce)) as `0x${string}`;

    // Get signature
    setStatus("Signature..."); setSType("info");
    const qs = new URLSearchParams({
      participant: address,
      campaignId: params.campaignId,
      expiry: params.expiry,
      nonce: nonce32,
    });
    let sig: string;
    try {
      const res = await fetch(`/api/voucher-final?${qs}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) { setStatus(data?.error || "Erreur voucher"); setSType("error"); return; }
      sig = data.signature;
    } catch {
      setStatus("Erreur réseau"); setSType("error"); return;
    }

    // Send tx
    setStatus("Confirme dans ton wallet..."); setSType("info");
    (writeContract as any)(
      {
        address: CM,
        abi: cmAbi,
        functionName: "recordParticipation",
        args: [BigInt(params.campaignId), BigInt(params.expiry), nonce32, sig as `0x${string}`],
        gas: BigInt(200000),
      },
      {
        onSuccess: () => {
          setStatus("✅ Participation enregistrée on-chain !"); setSType("success");
        },
        onError: (err) => {
          const m = err?.message || "Erreur";
          if (m.includes("Already")) setStatus("Déjà participé.");
          else if (m.includes("rejected") || m.includes("denied")) setStatus("Transaction annulée.");
          else setStatus(m.slice(0, 120));
          setSType("error");
        },
      }
    );
  }

  // ─── Loading ───
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#FAFBFC" }}>
      <p style={{ color: "#5A6172" }}>⏳ Validation du QR...</p>
    </div>
  );

  // ─── Ticket error ───
  if (ticketError) return (
    <>
      <Head><title>DauProof — QR invalide</title></Head>
      <div className="page"><div className="card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <h2 className="h2">QR invalide</h2>
        <div className="errBox">{ticketError}</div>
        <p className="hint">Le QR change toutes les 30s et ne peut être scanné qu'une fois. Retourne devant l'écran.</p>
        <a href="/" className="link">← Accueil</a>
      </div>
      <style jsx>{`
        .page{min-height:100vh;background:#FAFBFC;display:grid;place-items:center;padding:20px}
        .card{max-width:420px;width:100%;background:white;border:1px solid var(--border);border-radius:14px;padding:28px}
        .h2{font-family:'DM Serif Display',Georgia,serif;font-size:22px;margin-bottom:12px}
        .errBox{font-size:13px;color:#991B1B;background:#FEF2F2;border:1px solid #FECACA;padding:10px;border-radius:8px;margin-bottom:12px}
        .hint{font-size:12px;color:var(--subtle);line-height:1.6}
        .link{display:inline-block;margin-top:16px;font-size:12px;color:var(--brand-dark)}
      `}</style></div>
    </>
  );

  // ─── No ticket param ───
  if (!params) return (
    <>
      <Head><title>DauProof</title></Head>
      <div className="page"><div className="card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📱</div>
        <h2 style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 22 }}>Scanne le QR code</h2>
        <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 8 }}>Va devant l'écran du BDE et scanne le QR.</p>
        <a href="/" style={{ display: "inline-block", marginTop: 16, fontSize: 12, color: "var(--brand-dark)" }}>← Accueil</a>
      </div>
      <style jsx>{`.page{min-height:100vh;background:#FAFBFC;display:grid;place-items:center;padding:20px}.card{max-width:420px;width:100%;background:white;border:1px solid var(--border);border-radius:14px;padding:28px}`}</style>
      </div>
    </>
  );

  // ─── Main flow ───
  return (
    <>
      <Head><title>DauProof — Participer</title></Head>
      <div className="page"><div className="container">
        <div className="header">
          <a href="/" className="back">← DauProof</a>
          <h1 className="title">Participer</h1>
          <p className="sub">Campagne #{params.campaignId} · Prends ton temps</p>
        </div>

        <div className="steps">
          {[{ n: 1, l: "Email" }, { n: 2, l: "Wallet" }, { n: 3, l: "Signer" }].map(({ n, l }) => (
            <div key={n} className={`si ${step >= n ? "a" : ""} ${step === n ? "c" : ""}`}>
              <div className="sc">{step > n ? "✓" : n}</div><span className="sl">{l}</span>
            </div>
          ))}
        </div>

        {/* Email */}
        <section className="sec">
          <h3 className="st"><span className="sn">1</span> Email @dauphine.eu</h3>
          {verifiedEmail ? <div className="ok">✅ {verifiedEmail}</div> : (
            <div className="col">
              <input className="inp" value={email} onChange={e => setEmail(e.target.value)} placeholder="prenom.nom@dauphine.eu" inputMode="email" />
              {email && !isDauphine(email) && <p className="errS">Doit finir par @dauphine.eu</p>}
              <button className="btn dark" onClick={sendCode} disabled={!isDauphine(email)}>Envoyer le code</button>
              {emailSent && <>
                <div className="sep" />
                <input className="inp codeInp" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" inputMode="numeric" maxLength={6} />
                <button className="btn light" onClick={verifyCode} disabled={code.length !== 6}>Vérifier</button>
                <p className="hint">Copie le code reçu par email.</p>
              </>}
            </div>
          )}
        </section>

        {/* Wallet */}
        <section className={`sec ${step < 2 ? "locked" : ""}`}>
          <h3 className="st"><span className="sn">2</span> Wallet Sepolia</h3>
          <div style={{ marginBottom: 8 }}><ConnectButton /></div>
          {isConnected && chainId !== 11155111 && <div className="errB">⚠️ Passe sur Sepolia</div>}
          {isConnected && chainId === 11155111 && <div className="ok">✅ Connecté</div>}
        </section>

        {/* Sign */}
        <section className={`sec ${step < 3 ? "locked" : ""}`}>
          <h3 className="st"><span className="sn">3</span> Enregistrer</h3>
          <button className="btn brand" onClick={participate} disabled={step < 3 || isPending}>
            {isPending ? "Transaction..." : "PARTICIPER"}
          </button>
        </section>

        {status && (
          <div className={`stat ${sType}`}>
            {status}
            {txHash && sType === "success" && <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" className="txl">Etherscan →</a>}
          </div>
        )}
      </div>

      <style jsx>{`
        .page{min-height:100vh;background:#FAFBFC;padding:16px;display:flex;justify-content:center}
        .container{width:100%;max-width:480px;padding-top:16px}
        .header{margin-bottom:20px}
        .back{font-size:12px;color:var(--muted);text-decoration:none}
        .title{font-family:'DM Serif Display',Georgia,serif;font-size:28px;margin-top:4px}
        .sub{font-size:13px;color:var(--muted);margin-top:4px}
        .steps{display:flex;gap:4px;margin-bottom:18px;background:white;border:1px solid var(--border);border-radius:12px;padding:10px 12px}
        .si{flex:1;display:flex;align-items:center;gap:6px;opacity:.35}
        .si.a{opacity:1}.si.c .sc{background:var(--brand);color:white}
        .sc{width:24px;height:24px;border-radius:999px;display:grid;place-items:center;background:#F0F4F8;border:1px solid var(--border);font-size:11px;font-weight:800}
        .sl{font-size:11px;font-weight:600}
        .sec{background:white;border:1px solid var(--border);border-radius:14px;padding:16px 18px;margin-bottom:10px;transition:opacity .2s}
        .sec.locked{opacity:.4;pointer-events:none}
        .st{font-size:13px;font-weight:800;display:flex;align-items:center;gap:8px;margin-bottom:12px}
        .sn{width:22px;height:22px;border-radius:6px;display:grid;place-items:center;background:var(--navy-900);color:white;font-size:11px;font-weight:800}
        .col{display:flex;flex-direction:column;gap:8px}
        .inp{width:100%;padding:11px 14px;border-radius:10px;border:1px solid var(--border);background:#FAFBFC;font-size:14px;font-family:inherit;outline:none}
        .inp:focus{border-color:var(--brand)}.inp::placeholder{color:#9AA4B8}
        .codeInp{font-family:'JetBrains Mono',monospace;font-size:20px;letter-spacing:4px;text-align:center}
        .sep{border-top:1px solid var(--border);margin:4px 0}
        .btn{width:100%;padding:12px;border-radius:10px;border:1px solid var(--border);font-weight:700;font-size:13px;cursor:pointer;font-family:inherit;transition:all .15s}
        .btn:disabled{opacity:.5;cursor:not-allowed}
        .btn.dark{background:var(--navy-900);color:white;border-color:var(--navy-900)}
        .btn.light{background:white;color:var(--text)}
        .btn.brand{background:var(--brand);color:white;border-color:var(--brand);font-size:15px;padding:14px}
        .hint{font-size:11px;color:var(--subtle)}.errS{font-size:11px;color:#B42318}
        .ok{background:#F0FDF4;border:1px solid #BBF7D0;padding:10px 14px;border-radius:10px;font-size:13px;color:#166534}
        .errB{background:#FEF2F2;border:1px solid #FECACA;padding:10px 14px;border-radius:10px;font-size:12px;color:#991B1B;margin-top:8px}
        .stat{border-radius:12px;padding:12px 14px;font-size:12px;margin-top:4px;display:flex;flex-direction:column;gap:4px}
        .stat.info{background:#F0F4F8;color:var(--muted);border:1px solid var(--border)}
        .stat.success{background:#F0FDF4;color:#166534;border:1px solid #BBF7D0}
        .stat.error{background:#FEF2F2;color:#991B1B;border:1px solid #FECACA}
        .txl{font-size:11px;color:var(--brand-dark);text-decoration:underline}
      `}</style></div>
    </>
  );
}
