import { useRouter } from "next/router";
import Head from "next/head";

export default function Home() {
  const router = useRouter();
  return (
    <>
      <Head><title>DauProof</title></Head>
      <div className="page">
        <div className="center">
          <h1 className="logo">DauProof</h1>
          <p className="tag">L'engagement étudiant, prouvé et récompensé.</p>

          <div className="cards">
            <button className="card" onClick={() => router.push("/bde")}>
              <span className="icon">🏛️</span>
              <span className="label">Dashboard BDE</span>
              <span className="desc">QR code live · Campagnes</span>
            </button>
            <button className="card" onClick={() => router.push("/claim")}>
              <span className="icon">🎓</span>
              <span className="label">Étudiant</span>
              <span className="desc">Scanner · Participer</span>
            </button>
            <button className="card" onClick={() => router.push("/sponsor")}>
              <span className="icon">📊</span>
              <span className="label">Sponsor</span>
              <span className="desc">Analytics on-chain</span>
            </button>
          </div>

          <p className="foot">Sepolia · EIP-712 · Smart Contracts vérifiés</p>
        </div>

        <style jsx>{`
          .page { min-height:100vh; background:#FAFBFC; display:flex; align-items:center; justify-content:center; padding:24px; }
          .center { text-align:center; max-width:560px; width:100%; }
          .logo { font-family:'DM Serif Display',Georgia,serif; font-size:48px; color:var(--navy-900); }
          .tag { font-size:15px; color:var(--muted); margin-top:6px; font-style:italic; }
          .cards { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:32px; }
          .card {
            background:white; border:1px solid var(--border); border-radius:14px;
            padding:20px 14px; text-align:left; cursor:pointer;
            display:flex; flex-direction:column; gap:6px;
            transition:all 0.15s; font-family:inherit; color:var(--text);
          }
          .card:hover { border-color:var(--brand); box-shadow:0 4px 16px rgba(6,182,212,0.08); transform:translateY(-2px); }
          .icon { font-size:24px; }
          .label { font-weight:700; font-size:13px; }
          .desc { font-size:11px; color:var(--subtle); }
          .foot { margin-top:32px; font-size:11px; color:var(--subtle); }
          @media(max-width:560px) { .cards{grid-template-columns:1fr; max-width:300px; margin:32px auto 0;} .logo{font-size:38px;} }
        `}</style>
      </div>
    </>
  );
}
