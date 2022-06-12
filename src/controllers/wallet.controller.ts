import HDWalletProvider from "@truffle/hdwallet-provider";
import { RequestHandler } from "express";
import * as ethers from "ethers";
import { ErrorResponse, SuccessResponse } from "../utils/base_response";
import * as k from "../utils/constants";
import * as bip39 from "bip39";
import Web3 from "web3";
import { getPriceOfBalance, getWeb3Instance } from "../utils/utils";
import { TransactionType } from "../types/enums";
export const importWalletFromPrivateKey: RequestHandler = async (req, res) => {
  try {
    const privateKey = req.body.privateKey;

    const provider = new HDWalletProvider({
      privateKeys: [privateKey],
      providerOrUrl: process.env.WEB3_PROVIDER_URL,
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
    res.status(400).send(new ErrorResponse(err.message, 400));
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
    res.status(500).send(new ErrorResponse(err.message, 500));
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
    return res.status(400).send(new ErrorResponse(err.message, res.statusCode));
  }
};

export const getWalletInfo: RequestHandler = async (req, res) => {
  try {
    const { address } = req.params;
    if (!Web3.utils.isAddress(address)) {
      throw "Invalid wallet address";
    }
    const web3 = getWeb3Instance();
    const balance = Number(
      Web3.utils.fromWei(await web3.eth.getBalance(address))
    );

    return res.status(200).send(
      new SuccessResponse("Success", res.statusCode, {
        symbol: "BNB",
        address: "",
        decimal: 0,
        imageUrl:
          "https://icons.iconarchive.com/icons/cjdowner/cryptocurrency-flat/512/Binance-Coin-BNB-icon.png",
        balance: balance,
        amount: balance * (await getPriceOfBalance()),
      })
    );
  } catch (err: any) {
    console.log(err);
    return res.status(400).send(new ErrorResponse(err.message, res.statusCode));
  }
};

export const getWalletValidAddress: RequestHandler = async (req, res) => {
  try {
    const { address } = req.params;

    if (!Web3.utils.isAddress(address)) {
      throw "Address is not valid";
    }

    const web3 = getWeb3Instance();
    const code = await web3.eth.getCode(address);

    return res.status(200).send(
      new SuccessResponse("Success", res.statusCode, {
        address: address,
        isValid: code === "0x",
      })
    );
  } catch (err: any) {
    console.log(err);
    return res.status(400).send(new ErrorResponse(err.message, res.statusCode));
  }
};

export const sendBalance: RequestHandler = async (req, res) => {
  try {
    const { fromAddress, toAddress, value, fromPrivateKey } = req.body;

    if (
      !Web3.utils.isAddress(fromAddress) ||
      !Web3.utils.isAddress(toAddress)
    ) {
      throw "Address is not valid";
    }

    const web3 = getWeb3Instance();
    const nonce = await web3.eth.getTransactionCount(fromAddress, "latest");
    const data = {
      from: fromAddress,
      gas: Web3.utils.toHex(100000),
      to: toAddress,
      value: Web3.utils.toWei(value.toString()),
      nonce: nonce,
    };
    const signedTx = await web3.eth.accounts.signTransaction(
      data,
      fromPrivateKey
    );
    const result = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction!
    );
    const timestamp = (
      await web3.eth.getBlock(result.blockNumber?.toString() ?? "")
    ).timestamp;
    return res.status(200).send(
      new SuccessResponse("Success", res.statusCode, {
        hash: result.transactionHash,
        from: result.from,
        to: result.to,
        timestamp: timestamp,
        type: TransactionType.WITHDRAW,
      })
    );
  } catch (err: any) {
    console.log(err);
    return res.status(400).send(new ErrorResponse(err.message, res.statusCode));
  }
};

export const addAccount: RequestHandler = async (_, res) => {
  try {
    const { mnemonic, walletNumber } = _.body;

    let wallet = ethers.Wallet.fromMnemonic(
      mnemonic,
      `${k.WALLET_PATH}${walletNumber}`
    );
    const privateKey = wallet.privateKey;
    const address = await wallet.getAddress();

    res.status(201).json(
      new SuccessResponse("success", 201, {
        address,
        privateKey,
      })
    );
  } catch (err: any) {
    console.log(err);
    res.status(500).send(new ErrorResponse(err.message, 500));
  }
};
