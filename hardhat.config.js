require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: __dirname + "/.env" });

module.exports = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC,
      accounts: [process.env.DEPLOYER_PK],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY, // une seule key
  },
};