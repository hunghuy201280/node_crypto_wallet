import Web3 from "web3";
import HDWalletProvider from "@truffle/hdwallet-provider";
import { RequestHandler } from "express";
import * as ethers from "ethers";
import { ErrorResponse, SuccessResponse } from "../utils/base_response";
import * as k from "../utils/constants";
import * as bip39 from "bip39";
export const importWalletFromPrivateKey: RequestHandler = async (req, res) => {
  try {
    const privateKey = req.body.privateKey;

    const provider = new HDWalletProvider({
      privateKeys: [privateKey],
      providerOrUrl: process.env.RINKEBY,
    });
    const web3 = new Web3();
    web3.setProvider(provider);
    const wallets = await web3.eth.getAccounts();
    if (wallets.length > 0) {
      res.json(
        new SuccessResponse("success", 201, {
          wallets,
        })
      );
    } else {
      throw "Invalid secret phrase";
    }
  } catch (err: any) {
    console.log(err);
    res.status(400).send(new ErrorResponse(err.toString(), 400));
  }
};

export const createWallet: RequestHandler = async (_, res) => {
  try {
    const mnemonic = bip39.generateMnemonic();
    // const mnemonic =
    //   "cause almost leaf coast ability mesh oval media marine purse parade chapter";

    let wallet = ethers.Wallet.fromMnemonic(mnemonic, `${k.WALLET_PATH}1`);
    const privateKey = wallet.privateKey;
    const address = await wallet.getAddress();

    res.status(201).json(
      new SuccessResponse("success", 201, {
        mnemonic,
        wallet: {
          address,
          privateKey,
        },
      })
    );
  } catch (err: any) {
    console.log(err);
    res.status(500).send(new ErrorResponse(err.toString(), 500));
  }
};
