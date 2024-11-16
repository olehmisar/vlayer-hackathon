import { optimismSepolia, sepolia } from "viem/chains";
import { createVlayerClient } from "@vlayer/sdk";
import proverSpec from "../out/AverageBalance.sol/AverageBalance";
import verifierSpec from "../out/AverageBalanceVerifier.sol/AverageBalanceVerifier";
import {
  createContext,
  deployVlayerContracts,
  getConfig,
  waitForTransactionReceipt,
} from "@vlayer/sdk/config";

const tokenOwner = "0x406C90A36c66A42Cb4699d4Dc46DF7af5dDEe199"; // Owner of the USDC token at OP Sepolia
const usdcTokenAddr = "0xf08a50178dfcde18524640ea6618a1f965821715"; // Test USDC at OP Sepolia
const startBlock = 7086996n;
const endBlock = 7087013n;
const step = 9000n;

const config = getConfig();
const { ethClient, account, proverUrl } = await createContext(config);

const { prover, verifier } = await deployVlayerContracts({
  proverSpec,
  verifierSpec,
  proverArgs: [usdcTokenAddr, startBlock, endBlock, step],
  verifierArgs: [],
});

const vlayer = createVlayerClient({
  url: proverUrl,
});

const provingHash = await vlayer.prove({
  address: prover,
  proverAbi: proverSpec.abi,
  functionName: "averageBalanceOf",
  args: [tokenOwner],
  chainId: sepolia.id,
});

console.log("Waiting for proving result: ");

const result = await vlayer.waitForProvingResult(provingHash);

console.log("Proof:", result[0]);
console.log("Verifying...");

const verificationHash = await ethClient.writeContract({
  address: verifier,
  abi: verifierSpec.abi,
  functionName: "claim",
  args: result,
  account,
});

const receipt = await waitForTransactionReceipt({
  hash: verificationHash,
});

console.log(`Verification result: ${receipt.status}`);
