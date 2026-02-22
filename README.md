# DauProof — L'engagement étudiant, prouvé et récompensé

Plateforme de preuve de présence on-chain. Vérifié par signature EIP-712 sur Sepolia.

## Architecture

```
dauproof-final/
├── contracts/                    # Smart contracts déployés sur Sepolia
│   ├── CampaignManager.sol       # EIP-712, anti-replay, participation
│   └── ReputationScore.sol       # Score de réputation par asso
├── scripts/
│   └── deploy-sepolia.js         # Script de déploiement
├── hardhat.config.js
├── web/                          # App Next.js (Pages Router)
│   ├── pages/
│   │   ├── index.tsx             # Landing page
│   │   ├── bde.tsx               # Dashboard BDE — QR live + compteur on-chain
│   │   ├── claim.tsx             # Étudiant — email + wallet + participation
│   │   ├── sponsor.tsx           # Sponsor — analytics on-chain
│   │   ├── expired.tsx           # QR expiré
│   │   ├── validated.tsx         # Email vérifié, rescanner
│   │   ├── _app.tsx              # Wagmi + RainbowKit providers
│   │   └── api/
│   │       ├── send-code.ts      # Envoie code 6 chiffres via Resend
│   │       ├── verify-code.ts    # Vérifie le code, crée session
│   │       ├── me.ts             # Session courante
│   │       ├── voucher-final.ts  # Signe le voucher EIP-712
│   │       └── logout.ts
│   └── lib/
│       ├── wagmi.ts              # Config Wagmi/RainbowKit Sepolia
│       ├── signer.ts             # EIP-712 signer server-side
│       ├── store.ts              # In-memory code + session store
│       ├── cmAbi.ts              # ABI CampaignManager
│       └── stampAbi.ts           # ABI Stamp (legacy)
└── .env / .env.local             # Clés privées, API keys
```

## Flux complet

```
BDE affiche QR (campaignId + expiry + nonce)
    ↓ QR change toutes les 30s
Étudiant scanne le QR → /claim?campaignId=1&expiry=...&nonce=...
    ↓
1. Vérifie email @dauphine.eu (code 6 chiffres via Resend)
2. Connecte wallet MetaMask (réseau Sepolia)
3. Clique PARTICIPER
    ↓
Backend vérifie : email OK + QR non expiré → signe voucher EIP-712
    ↓
Transaction on-chain : CampaignManager.recordParticipation()
    ↓ vérifie signature, anti-replay, anti-doublon
Participation enregistrée. Compteur monte en live sur /bde.
Sponsor voit les stats vérifiées sur /sponsor.
```

---

## 🚀 Installation sur Mac

### Prérequis

```bash
# Node.js 18+ (avec Homebrew)
brew install node

# Vérifie
node --version   # v18+ ou v20+
npm --version
```

### Setup

```bash
cd dauproof-final

# 1. Installe les dépendances Hardhat
npm install

# 2. Installe les dépendances web
cd web
npm install
cd ..
```

### Configuration

Le contrat est **déjà déployé sur Sepolia** à l'adresse `0x6bc0a27FE8Bf3289AB4AAEC407613cD6164D6f32`.

**Hardhat** (racine du projet) — crée `.env` :
```bash
cp .env.example .env
# Remplis avec tes vraies clés
```

**Next.js** (dossier web) — crée `.env.local` :
```bash
cd web
cp .env.local.example .env.local
```

Remplis `.env.local` avec :
```
NEXT_PUBLIC_PUBLIC_ORIGIN=http://localhost:3000
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_CM_ADDRESS=0x6bc0a27FE8Bf3289AB4AAEC407613cD6164D6f32
SIGNER_PK=0x... (ta clé privée signer)
RESEND_API_KEY=re_... (ta clé Resend)
```

> **Important** : `SIGNER_PK` doit correspondre à l'adresse passée au constructeur du CampaignManager lors du déploiement.

---

## ▶️ Lancement

```bash
cd web
npm run dev
```

Ouvre **http://localhost:3000**

### Pages

| URL | Rôle | Description |
|-----|------|-------------|
| `/` | Tous | Landing — choix du rôle |
| `/bde` | Association | QR code live + compteur on-chain |
| `/claim` | Étudiant | Email verif + wallet + participer |
| `/sponsor` | Sponsor | Analytics on-chain en temps réel |

---

## 🧪 Tester le flux complet

1. Ouvre **http://localhost:3000/bde** → connecte un wallet (MetaMask sur Sepolia)
2. Le QR code se génère automatiquement (campagne #1)
3. **Sur un téléphone** (ou autre onglet) : scanne le QR ou va à l'URL affichée
4. Sur `/claim` :
   - Entre ton email `@dauphine.eu`
   - Reçois le code par email, tape-le
   - Connecte ton wallet MetaMask (Sepolia)
   - Clique **PARTICIPER**
5. La transaction passe on-chain → le compteur sur `/bde` monte
6. Ouvre `/sponsor` pour voir les stats

### Pour exposer en public (ngrok)

```bash
ngrok http 3000
# Copie l'URL https://... et mets-la dans .env.local :
# NEXT_PUBLIC_PUBLIC_ORIGIN=https://xxxxx.ngrok-free.dev
# PUBLIC_ORIGIN=https://xxxxx.ngrok-free.dev
# Redémarre le serveur
```

---

## 🔐 Sécurité

- **Anti-fraude QR** : le QR expire après 30s. Le smart contract vérifie `block.timestamp <= expiry`
- **Anti-replay** : chaque ticket (participant + campaignId + expiry + nonce) est marqué `usedTickets[hash] = true`
- **Anti-doublon** : `hasParticipated[campaignId][address]` empêche la double participation
- **Email gate** : seuls les `@dauphine.eu` vérifiés obtiennent un voucher signé
- **EIP-712** : signature typée, non falsifiable, vérifiée on-chain

---

## 📝 Commandes utiles

```bash
# Compiler les contrats
npm run compile

# Déployer sur Sepolia (si besoin de redéployer)
npm run deploy:sepolia

# Lancer le web
cd web && npm run dev

# Build production
cd web && npm run build && npm start
```

---

## Licence

MIT — Projet hackathon, Université Paris-Dauphine 2026
