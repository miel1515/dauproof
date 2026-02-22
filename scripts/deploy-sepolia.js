const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddr = await deployer.getAddress();

  // signer = adresse du wallet correspondant à SIGNER_PK (pour la démo même clé)
  const signerAddr = deployerAddr;

  const CM = await hre.ethers.getContractFactory("CampaignManager");
  const cm = await CM.deploy(signerAddr);
  await cm.waitForDeployment();

  console.log("Deployer:", deployerAddr);
  console.log("CampaignManager:", await cm.getAddress());
  console.log("Signer:", signerAddr);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});