import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "DauProof",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "placeholder",
  chains: [sepolia],
  ssr: true,
});
