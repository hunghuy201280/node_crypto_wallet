import express, { Request, Response } from "express";

import cors from "cors";
import * as ethers from "ethers";
import * as bip39 from "bip39";

//routers
import walletRouter from "./routers/wallet";
const app = express();

app.use(express.json());
app.use(cors());
app.use("/wallet", walletRouter);

app.get("/test", async (_: Request, res: Response) => {
  const mnemonic = bip39.generateMnemonic();

  let mnemonicWallet = ethers.Wallet.fromMnemonic(mnemonic);
  console.log(mnemonicWallet.privateKey);
  const result = mnemonicWallet.privateKey;
  res.send(result);
});

app.get("/", (_, res) => {
  res.send("OK");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("App is running on port:" + port);
});
