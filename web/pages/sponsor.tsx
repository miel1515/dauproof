import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useReadContract } from "wagmi";
import { cmAbi } from "@/lib/cmAbi";
import Head from "next/head";

function CampaignRow({ id, cmAddress }: { id: number; cmAddress: `0x${string}` }) {
  const { data: camp } = useReadContract({
    address: cmAddress,
    abi: cmAbi,
    functionName: "getCampaign",
    args: [BigInt(id)],
    query: { refetchInterval: 5000 },
  });

  if (!camp) return null;
  const c = camp as any;
  const name = c.name || `Campagne #${id}`;
  const type = c.campaignType || "—";
  const count = Number(c.participantCount);
  const active = Boolean(c.isActive);

  return (
    <tr className="row">
      <td className="cell id">{id}</td>
      <td className="cell name">{name}</td>
      <td className="cell">{type}</td>
      <td className="cell count">{count}</td>
      <td className="cell">
        <span className={`badge ${active ? "active" : "inactive"}`}>
          {active ? "Actif" : "Fermé"}
        </span>
      </td>

      <style jsx>{`
        .row { border-top: 1px solid var(--border); }
        .row:hover { background: #FAFBFC; }
        .cell { padding: 10px 14px; font-size: 13px; }
        .id { font-family: 'JetBrains Mono', monospace; color: var(--subtle); }
        .name { font-weight: 600; }
        .count {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700; color: var(--brand-dark);
        }
        .badge {
          padding: 3px 8px; border-radius: 999px;
          font-size: 10px; font-weight: 700;
        }
        .active { background: #DCFCE7; color: #166534; }
        .inactive { background: #F1F5F9; color: #64748B; }
      `}</style>
    </tr>
  );
}

export default function SponsorPage() {
  const cmAddress = process.env.NEXT_PUBLIC_CM_ADDRESS as `0x${string}`;
  const [maxId, setMaxId] = useState(5);

  // Read campaignCount on-chain
  const { data: countData } = useReadContract({
    address: cmAddress,
    abi: [
      { type: "function", name: "campaignCount", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
    ] as const,
    functionName: "campaignCount",
    query: { refetchInterval: 5000 },
  });

  const campaignCount = countData ? Number(countData) : 0;
  const ids = Array.from({ length: Math.min(campaignCount, maxId) }, (_, i) => i + 1);

  return (
    <>
      <Head><title>DauProof — Sponsor Dashboard</title></Head>
      <div className="page">
        <nav className="nav">
          <div className="navLeft">
            <a href="/" className="navLogo">DauProof</a>
            <span className="navBadge">Sponsor</span>
          </div>
          <ConnectButton />
        </nav>

        <div className="container">
          <div className="header">
            <div>
              <h1 className="title">Dashboard Sponsor</h1>
              <p className="subtitle">Données vérifiées on-chain · Sepolia · Temps réel</p>
            </div>
          </div>

          {/* Stats */}
          <div className="statsGrid">
            <div className="statCard">
              <div className="statValue">{campaignCount}</div>
              <div className="statLabel">Campagnes créées</div>
            </div>
            <div className="statCard highlight">
              <div className="statValue">
                {ids.length > 0 ? "Live" : "—"}
              </div>
              <div className="statLabel">Données on-chain</div>
            </div>
            <div className="statCard">
              <div className="statValue">Sepolia</div>
              <div className="statLabel">Réseau</div>
            </div>
          </div>

          {/* Table */}
          <div className="tableCard">
            <div className="tableHeader">
              <h2 className="tableTitle">Campagnes — Présences vérifiées</h2>
              <div className="livePill">
                <span className="liveDot" /> Refresh auto
              </div>
            </div>
            <table className="table">
              <thead>
                <tr className="thead">
                  <th className="th">ID</th>
                  <th className="th">Nom</th>
                  <th className="th">Type</th>
                  <th className="th">Participants</th>
                  <th className="th">Statut</th>
                </tr>
              </thead>
              <tbody>
                {ids.map((id) => (
                  <CampaignRow key={id} id={id} cmAddress={cmAddress} />
                ))}
              </tbody>
            </table>
            {ids.length === 0 && (
              <div className="emptyState">
                <p>Aucune campagne trouvée on-chain.</p>
                <p className="emptyHint">Le contrat est à l'adresse {cmAddress}</p>
              </div>
            )}
            {campaignCount > maxId && (
              <button className="loadMore" onClick={() => setMaxId(m => m + 10)}>
                Charger plus...
              </button>
            )}
          </div>

          {/* Blockchain badge */}
          <div className="chainCard">
            <span className="chainIcon">🔗</span>
            <div>
              <strong>Données certifiées blockchain</strong>
              <p className="chainSub">
                Chaque participation est enregistrée on-chain via signature EIP-712.
                Les données sont vérifiables par n'importe qui sur Etherscan.
              </p>
            </div>
          </div>
        </div>

        <style jsx>{`
          .page { min-height: 100vh; background: var(--bg); }
          .nav {
            display: flex; justify-content: space-between; align-items: center;
            padding: 14px 24px;
            background: var(--navy-900); border-bottom: 1px solid rgba(255,255,255,0.08);
          }
          .navLeft { display: flex; align-items: center; gap: 10px; }
          .navLogo {
            font-family: 'DM Serif Display', Georgia, serif;
            font-size: 22px; color: white; text-decoration: none;
          }
          .navBadge {
            background: #8B5CF6; color: white;
            font-size: 10px; font-weight: 700;
            padding: 3px 8px; border-radius: 999px;
          }
          .container {
            max-width: 860px; margin: 0 auto; padding: 24px;
          }
          .header { margin-bottom: 20px; }
          .title {
            font-family: 'DM Serif Display', Georgia, serif;
            font-size: 24px;
          }
          .subtitle { font-size: 12px; color: var(--muted); margin-top: 4px; }

          .statsGrid {
            display: grid; grid-template-columns: repeat(3, 1fr);
            gap: 12px; margin-bottom: 20px;
          }
          .statCard {
            background: var(--card); border: 1px solid var(--border);
            border-radius: 12px; padding: 16px;
          }
          .statCard.highlight { background: var(--navy-900); color: white; border: none; }
          .statCard.highlight .statLabel { color: rgba(255,255,255,0.6); }
          .statCard.highlight .statValue { color: var(--brand); }
          .statValue {
            font-size: 28px; font-weight: 900;
            font-family: 'JetBrains Mono', monospace;
            letter-spacing: -1px;
          }
          .statLabel { font-size: 11px; color: var(--muted); margin-top: 2px; }

          .tableCard {
            background: var(--card); border: 1px solid var(--border);
            border-radius: 14px; overflow: hidden;
            box-shadow: 0 4px 16px rgba(0,0,0,0.04);
            margin-bottom: 16px;
          }
          .tableHeader {
            display: flex; justify-content: space-between; align-items: center;
            padding: 14px 18px; border-bottom: 1px solid var(--border);
          }
          .tableTitle { font-size: 14px; font-weight: 800; }
          .livePill {
            display: flex; align-items: center; gap: 6px;
            padding: 4px 10px; border-radius: 999px;
            background: #FAFBFC; border: 1px solid var(--border);
            font-size: 10px; color: var(--muted);
          }
          .liveDot {
            width: 6px; height: 6px; border-radius: 999px; background: #16a34a;
            animation: blink 2s ease-in-out infinite;
          }
          @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

          .table { width: 100%; border-collapse: collapse; }
          .thead { background: #FAFBFC; }
          .th {
            padding: 8px 14px; font-size: 10px; font-weight: 700;
            color: var(--subtle); text-transform: uppercase;
            letter-spacing: 0.5px; text-align: left;
          }

          .emptyState {
            padding: 32px; text-align: center;
            font-size: 13px; color: var(--muted);
          }
          .emptyHint { font-size: 10px; color: var(--subtle); margin-top: 4px; font-family: 'JetBrains Mono', monospace; }
          .loadMore {
            width: 100%; padding: 10px; font-size: 12px; font-weight: 600;
            background: none; border: none; border-top: 1px solid var(--border);
            color: var(--brand-dark); cursor: pointer;
          }

          .chainCard {
            display: flex; gap: 12px; align-items: flex-start;
            background: var(--navy-900); border-radius: 14px;
            padding: 16px 18px; color: white;
          }
          .chainIcon { font-size: 20px; }
          .chainCard strong { font-size: 13px; }
          .chainSub { font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 4px; line-height: 1.5; }

          @media (max-width: 640px) {
            .statsGrid { grid-template-columns: 1fr; }
            .statValue { font-size: 22px; }
          }
        `}</style>
      </div>
    </>
  );
}
