import Web3 from "web3";
import HDWalletProvider from "@truffle/hdwallet-provider";
import { RequestHandler } from "express";

export const verifyMnemonic: RequestHandler = async (req, res) => {
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
      res.send({
        data: wallets,
      });
    } else {
      res.status(400).send({
        error: "Invalid secret phrase",
      });
    }
  } catch (err: any) {
    console.log(err);
    res.status(400).send({
      error: err.toString(),
    });
  }
};

export const getTokens: RequestHandler = async (req, res) => {
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
      res.send({
        data: wallets,
      });
    } else {
      res.status(400).send({
        error: "Invalid secret phrase",
      });
    }
  } catch (err: any) {
    console.log(err);
    res.status(400).send({
      error: err.toString(),
    });
  }
};
