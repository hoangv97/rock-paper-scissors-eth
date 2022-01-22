// deploy/00_deploy_your_contract.js

const { ethers } = require("hardhat");

const localChainId = "31337";

// const sleep = (ms) =>
//   new Promise((r) =>
//     setTimeout(() => {
//       console.log(`waited for ${(ms / 1000).toFixed(3)} seconds`);
//       r();
//     }, ms)
//   );

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  await deploy("GameToken", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: ["RPS", "RPS", 1000],
    log: true,
    waitConfirmations: 5,
  });

  // Getting a previously deployed contract
  const yourContract = await ethers.getContract("GameToken", deployer);

  // Transfer tokens to wallet
  await yourContract.transfer(
    "0xCcA02230229372c7618E11391C313a863E5a0F75",
    1000
  );

  await deploy("GameToken2", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    contract: "GameToken",
    args: ["RPS 2", "RPS2", 2000],
    log: true,
    waitConfirmations: 5,
  });

  // Getting a previously deployed contract
  const yourContract2 = await ethers.getContract("GameToken2", deployer);

  // Transfer tokens to wallet
  await yourContract2.transfer(
    "0xCcA02230229372c7618E11391C313a863E5a0F75",
    2000
  );
};
module.exports.tags = ["YourContract"];
