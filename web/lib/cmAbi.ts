export const cmAbi = [
  {
    type: "function",
    name: "recordParticipation",
    stateMutability: "nonpayable",
    inputs: [
      { name: "campaignId", type: "uint256" },
      { name: "expiry", type: "uint256" },
      { name: "nonce", type: "bytes32" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getCampaign",
    stateMutability: "view",
    inputs: [{ name: "_campaignId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "name", type: "string" },
          { name: "campaignType", type: "string" },
          { name: "owner", type: "address" },
          { name: "createdAt", type: "uint256" },
          { name: "participantCount", type: "uint256" },
          { name: "isActive", type: "bool" },
        ],
      },
    ],
  },
] as const;