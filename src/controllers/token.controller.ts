import { RequestHandler } from "express";
import Web3 from "web3";
import { ErrorResponse, SuccessResponse } from "../utils/base_response";
import * as rpsAbiJsonRaw from "../utils/rps.abi.json";
import * as ERC20AbiJsonRaw from "../utils/bep20.abi.json";
import { AbiItem } from "web3-utils";
import { AppDataSource } from "../db/db";
import { ERC20Token } from "../entity/erc20Token";
import { Wallet } from "../entity/wallet";
import { TokenResponse } from "../types/types";
import { AlphaRouter, ChainId } from "@uniswap/smart-order-router";
import { Token, CurrencyAmount, TradeType, Percent } from "@uniswap/sdk-core";
import { ethers, BigNumber } from "ethers";
import JSBI from "jsbi";
import { getPriceOfToken, getWeb3Instance } from "../utils/utils";
import { V3_SWAP_ROUTER_ADDRESS } from "../utils/constants";
import log from "../utils/logger";
import { In } from "typeorm";

const rpsAbiJson = (rpsAbiJsonRaw as any).default["abi"] as AbiItem[];
const ERC20AbiJson = (ERC20AbiJsonRaw as any).default as AbiItem[];

export const getWalletTokens: RequestHandler = async (req, res) => {
  try {
    let { address, tokenArray } = req.query;
    let tokens: string[] = [];
    if (tokenArray) tokens = tokenArray.toString().split(",");
    if (
      !Web3.utils.isAddress(address?.toString() ?? "", ChainId.POLYGON_MUMBAI)
    ) {
      throw "Invalid wallet address";
    }

    const web3 = getWeb3Instance();
    const responseJson: TokenResponse[] = [];

    for (const token of tokens) {
      try {
        const contract = new web3.eth.Contract(rpsAbiJson, token);
        const decimals = await contract.methods.decimals().call();
        let tokenBalance: number = await contract.methods
          .balanceOf(address)
          .call();
        tokenBalance = tokenBalance / 10 ** decimals;
        responseJson.push({
          address: token,
          balance: tokenBalance,
          amount: await getPriceOfToken(token),
        });
      } catch (e) {
        log.error(e);
      }
    }
    res.send(new SuccessResponse("success", 200, responseJson));
  } catch (err: any) {
    console.log(err);
    res.status(400).send(new ErrorResponse(err.toString(), 400));
  }
};

export const importWalletTokens: RequestHandler = async (req, res) => {
  try {
    const { tokenAddress, walletAddress } = req.body;
    if (!tokenAddress || !walletAddress) {
      throw "Either token address or wallet address is empty";
    }

    if (!Web3.utils.isAddress(walletAddress)) {
      throw "Invalid wallet address";
    }

    const tokenRepo = AppDataSource.getRepository(ERC20Token);
    const walletRepo = AppDataSource.getRepository(Wallet);

    let wallet = await walletRepo.findOne({
      where: {
        address: walletAddress,
      },
      relations: ["tokens"],
    });
    //Add wallet to db if doesnt exist
    if (!wallet) {
      wallet = new Wallet();
      wallet.address = walletAddress;
      await walletRepo.save(wallet);
    }
    const web3 = new Web3(
      new Web3.providers.HttpProvider(process.env.WEB3_PROVIDER_URL as string)
    );
    try {
      const contract = new web3.eth.Contract(rpsAbiJson, tokenAddress);
      let token = await tokenRepo.findOneBy({
        address: tokenAddress,
      });
      //If this token doesnt exist then add to db
      if (!token) {
        const symbol = await contract.methods.symbol().call();
        const decimals = await contract.methods.decimals().call();
        token = new ERC20Token();
        token.address = tokenAddress;
        token.symbol = symbol;
        token.demical = decimals;

        await tokenRepo.save(token);
      }
      if (!wallet.tokens) {
        wallet.tokens = [token];
      } else {
        wallet.tokens.push(token);
      }
      await walletRepo.save(wallet);
    } catch (e) {
      console.log(e);
      throw "Invalid token";
    }

    res.status(201).send(new SuccessResponse("Added", res.statusCode, {}));
  } catch (err: any) {
    console.log(err);
    res.status(400).send(new ErrorResponse(err.toString(), res.statusCode));
  }
};

export const getAvailableTokens: RequestHandler = async (_, res) => {
  try {
    const tokenRepo = AppDataSource.manager.getRepository(ERC20Token);
    const tokens = await tokenRepo.find();
    res
      .status(200)
      .send(new SuccessResponse("Get Tokens Success", res.statusCode, tokens));
  } catch (e: any) {
    log.error(e);
    res
      .status(400)
      .send(new ErrorResponse("Get Tokens Failure", res.statusCode));
  }
};

export const importAvailableTokens: RequestHandler = async (req, res) => {
  try {
    const tokenAddresses = req.body;
    const tokenRepo = AppDataSource.manager.getRepository(ERC20Token);
    const web3 = new Web3(
      new Web3.providers.HttpProvider(process.env.WEB3_PROVIDER_URL as string)
    );
    for (let tokenAddress of tokenAddresses) {
      try {
        let token = await tokenRepo.findOneBy({ address: tokenAddress });
        if (
          !token &&
          web3.utils.isAddress(tokenAddress, ChainId.POLYGON_MUMBAI)
        ) {
          const contract = new web3.eth.Contract(rpsAbiJson, tokenAddress);
          const symbol = await contract.methods.symbol().call();
          const decimals = await contract.methods.decimals().call();
          token = new ERC20Token();
          token.address = tokenAddress;
          token.symbol = symbol;
          token.demical = decimals;
          await tokenRepo.save(token);
        }
      } catch (e: any) {
        log.error(e);
      }
    }
    const tokens = await tokenRepo.find({
      where: { address: In(tokenAddresses) },
    });
    res
      .status(200)
      .send(
        new SuccessResponse("Import Tokens Success", res.statusCode, tokens)
      );
  } catch (e: any) {
    log.error(e);
    res
      .status(400)
      .send(new ErrorResponse("Import Tokens Failure", res.statusCode));
  }
};

export const getDetailOfToken: RequestHandler = async (req, res) => {
  try {
    const { tokenAddress } = req.params;
    const tokenRepo = AppDataSource.manager.getRepository(ERC20Token);
    const web3 = new Web3(
      new Web3.providers.HttpProvider(process.env.WEB3_PROVIDER_URL as string)
    );
    let token = await tokenRepo.findOneBy({ address: tokenAddress });
    if (token)
      return res
        .status(200)
        .send(
          new SuccessResponse("Get Detail Token Success", res.statusCode, token)
        );

    if (web3.utils.isAddress(tokenAddress, ChainId.POLYGON_MUMBAI)) {
      const contract = new web3.eth.Contract(rpsAbiJson, tokenAddress);
      const symbol = await contract.methods.symbol().call();
      const decimals = await contract.methods.decimals().call();
      token = new ERC20Token();
      token.address = tokenAddress;
      token.symbol = symbol;
      token.demical = decimals;
      await tokenRepo.save(token);
      return res
        .status(200)
        .send(
          new SuccessResponse("Get Detail Token Success", res.statusCode, token)
        );
    } else throw Error("Token isn't valid");
  } catch (e: any) {
    log.error(e);
    res
      .status(400)
      .send(new ErrorResponse("Token isn't valid", res.statusCode));
  }
};

export const swapToken: RequestHandler = async (req, res) => {
  try {
    const {
      fromTokenAddress,
      toTokenAddress,
      amount,
      walletAddress,
      privateKey,
    } = req.body;
    if (
      !fromTokenAddress ||
      !toTokenAddress ||
      !amount ||
      !walletAddress ||
      !privateKey
    ) {
      throw "Invalid input";
    }

    const web3 = getWeb3Instance();
    const web3Provider = new ethers.providers.JsonRpcProvider(
      process.env.WEB3_PROVIDER_URL
    );
    console.log(ERC20AbiJson);
    //#region load meta data
    const fromTokenContract = new web3.eth.Contract(
      ERC20AbiJson,
      fromTokenAddress
    );

    const toTokenContract = new web3.eth.Contract(ERC20AbiJson, toTokenAddress);
    const promiseResult = await Promise.all([
      fromTokenContract.methods.decimals().call(),
      fromTokenContract.methods.symbol().call(),
      fromTokenContract.methods.name().call(),
      toTokenContract.methods.decimals().call(),
      toTokenContract.methods.symbol().call(),
      toTokenContract.methods.name().call(),
    ]);
    const temp = {
      from: {
        decimals: parseInt(promiseResult[0]),
        symbol: promiseResult[1],
        name: promiseResult[2],
        address: fromTokenAddress,
      },
      to: {
        decimals: parseInt(promiseResult[3]),
        symbol: promiseResult[4],
        name: promiseResult[5],
        address: toTokenAddress,
      },
    };

    const fromToken = new Token(
      parseInt(process.env.CHAIN_ID!),
      temp.from.address,
      temp.from.decimals,
      temp.from.symbol,
      temp.from.name
    );
    const toToken = new Token(
      parseInt(process.env.CHAIN_ID!),
      temp.to.address,
      temp.to.decimals,
      temp.to.symbol,
      temp.to.name
    );
    //#endregion
    console.log(fromToken, toToken, parseInt(process.env.CHAIN_ID!));
    //#region convert amount
    const wei = ethers.utils.parseUnits(amount.toString(), temp.from.decimals);
    const inputAmount = CurrencyAmount.fromRawAmount(
      fromToken,
      JSBI.BigInt(wei)
    );
    //#endregion

    //#region create router
    const alphaRouter = new AlphaRouter({
      chainId: parseInt(process.env.CHAIN_ID!),
      provider: web3Provider,
    });
    const route = await alphaRouter.route(
      inputAmount,
      toToken,
      TradeType.EXACT_INPUT,
      {
        recipient: walletAddress,
        slippageTolerance: new Percent(1, 100),
        deadline: Math.floor(Date.now() / 1000 + 1800),
      }
    );
    //#endregion

    if (route == null) {
      throw "Unavailable";
    }

    //#region create transaction
    const transaction = {
      data: route!.methodParameters!.calldata,
      to: V3_SWAP_ROUTER_ADDRESS,
      value: BigNumber.from(route.methodParameters!.value),
      from: walletAddress,
      gasPrice: BigNumber.from(route.gasPriceWei),
      gasLimit: ethers.utils.hexlify(1000000),
    };
    //#endregion

    //#region create and connect to wallet
    const wallet = new ethers.Wallet(privateKey);
    const connectedWallet = wallet.connect(web3Provider);
    //#endregion

    //#region create contract and sign transaction
    const approvalAmount = ethers.utils
      .parseUnits(amount.toString(), temp.from.decimals)
      .toString();
    const contract0 = new ethers.Contract(
      fromTokenAddress,
      (ERC20AbiJson as any).default,
      web3Provider
    );
    await contract0
      .connect(connectedWallet)
      .approve(V3_SWAP_ROUTER_ADDRESS, approvalAmount);

    const tradeTransaction = await connectedWallet.sendTransaction(transaction);
    //#endregion
    res.send(new SuccessResponse("Success", 200, tradeTransaction));
  } catch (error: any) {
    console.log(error);
    res.status(400).send(new ErrorResponse(error.toString(), 400));
  }
};

export const sendToken: RequestHandler = async (req, res) => {
  try {
    const { fromAddress, toAddress, tokenAddress, value, fromPrivateKey } =
      req.body;
    const tokenRepo = AppDataSource.manager.getRepository(ERC20Token);

    const web3 = getWeb3Instance();
    const contract = new web3.eth.Contract(ERC20AbiJson, tokenAddress);
    let token = await tokenRepo.findOneBy({
      address: tokenAddress,
    });
    //If this token doesnt exist then add to db
    if (!token) {
      const symbol = await contract.methods.symbol().call();
      const decimals = await contract.methods.decimals().call();
      token = new ERC20Token();
      token.address = tokenAddress;
      token.symbol = symbol;
      token.demical = decimals;
      await tokenRepo.save(token);
    }

    const amount = Web3.utils.toHex(Web3.utils.toWei(value.toString()));
    const data = contract.methods.transfer(toAddress, amount).encodeABI();

    const txObj = {
      gas: Web3.utils.toHex(100000),
      to: tokenAddress,
      value: "0x00",
      data: data,
      from: fromAddress,
    };
    const signedTransaction = await web3.eth.accounts.signTransaction(
      txObj,
      fromPrivateKey
    );
    const result = await web3.eth.sendSignedTransaction(
      signedTransaction.rawTransaction!
    );
    res.status(200).send(
      new SuccessResponse("Import Tokens Success", res.statusCode, {
        result,
      })
    );
  } catch (e: any) {
    log.error(e);
    res
      .status(400)
      .send(new ErrorResponse("Import Tokens Failure", res.statusCode));
  }
};
