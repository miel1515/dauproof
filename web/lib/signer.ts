import { ethers } from "ethers";

// EIP-712 domain matching the CampaignManager constructor: EIP712("Stamp", "1")
const DOMAIN = {
  name: "Stamp",
  version: "1",
  chainId: 11155111, // Sepolia
  verifyingContract: process.env.NEXT_PUBLIC_CM_ADDRESS as string,
};

const TYPES = {
  Participate: [
    { name: "participant", type: "address" },
    { name: "campaignId", type: "uint256" },
    { name: "expiry", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
};

export async function signVoucher(
  participant: string,
  campaignId: string,
  expiry: string,
  nonce: string
): Promise<string> {
  const pk = process.env.SIGNER_PK;
  if (!pk) throw new Error("SIGNER_PK not set");

  const wallet = new ethers.Wallet(pk);

  const value = {
    participant,
    campaignId: BigInt(campaignId),
    expiry: BigInt(expiry),
    nonce,
  };

  const signature = await wallet.signTypedData(DOMAIN, TYPES, value);
  return signature;
}
