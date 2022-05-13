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
      numberOfAddresses: 1,
      derivationPath: `${k.WALLET_PATH}1`,
    });
    const wallet = provider.getAddress();

    res.json(
      new SuccessResponse("success", 201, {
        address: wallet,
        privateKey,
      })
    );
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

export const importWalletFromMnemonic: RequestHandler = async (req, res) => {
  try {
    let { mnemonic } = req.body;
    mnemonic = mnemonic.trim();
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error("Mnemonic invalid or undefined");
    }
    const wallet = ethers.Wallet.fromMnemonic(mnemonic, `${k.WALLET_PATH}1`);
    let privateKey = wallet.privateKey;
    let address = wallet.address;
    return res.status(201).json(
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
    return res
      .status(400)
      .send(new ErrorResponse(err.toString(), res.statusCode));
  }
};
