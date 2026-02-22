import Head from "next/head";
export default function Validated() {
  return (<>
    <Head><title>DauProof — Email vérifié</title></Head>
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#F0F4F8", padding: 20 }}>
      <div style={{ maxWidth: 420, width: "100%", background: "white", border: "1px solid #E2E8F0", borderRadius: 14, padding: 28, textAlign: "center" }}>
        <div style={{ fontSize: 48 }}>✅</div>
        <h1 style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 22, marginTop: 8 }}>Email vérifié</h1>
        <p style={{ color: "#5A6172", fontSize: 13, marginTop: 8 }}>Rescanne le QR actuel pour participer.</p>
        <a href="/" style={{ display: "inline-block", marginTop: 16, fontSize: 12, color: "#0891B2" }}>← Accueil</a>
      </div>
    </div>
  </>);
}
