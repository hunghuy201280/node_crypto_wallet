import { RequestHandler } from "express";
import Web3 from "web3";
import { ErrorResponse, SuccessResponse } from "../utils/base_response";
import * as erc20AbiJsonRaw from "../utils/erc20.abi.json";
import { AbiItem } from "web3-utils";
import { AppDataSource } from "../db/db";
import { ERC20Token } from "../entity/erc20Token";
import { Wallet } from "../entity/wallet";
import { TokenResponse } from "../types/types";
import { AlphaRouter, ChainId } from "@uniswap/smart-order-router";
import { Token, CurrencyAmount, TradeType, Percent } from "@uniswap/sdk-core";
import { ethers, BigNumber } from "ethers";
import JSBI from "jsbi";
import { getWeb3Instance } from "../utils/utils";
import { V3_SWAP_ROUTER_ADDRESS } from "../utils/constants";

const erc20AbiJson = (erc20AbiJsonRaw as any).default as AbiItem[];

export const getTokens: RequestHandler = async (req, res) => {
  try {
    const walletAddress = req.query.address as string;
    if (!Web3.utils.isAddress(walletAddress)) {
      throw "Invalid wallet address";
    }

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
    const tokens = wallet.tokens ?? [];
    const web3 = new Web3(
      new Web3.providers.HttpProvider(process.env.WEB3_PROVIDER_URL as string)
    );
    const responseJson: TokenResponse[] = [];

    for (const token of tokens) {
      const contract = new web3.eth.Contract(erc20AbiJson, token.address);

      const tokenBalance = await contract.methods
        .balanceOf(walletAddress)
        .call();
      responseJson.push({
        ...token,
        balance: Number(Web3.utils.fromWei(tokenBalance)),
      });
    }
    res.send(new SuccessResponse("success", 200, responseJson));
  } catch (err: any) {
    console.log(err);
    res.status(400).send(new ErrorResponse(err.toString(), 400));
  }
};

export const importTokens: RequestHandler = async (req, res) => {
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
      const contract = new web3.eth.Contract(erc20AbiJson, tokenAddress);
      let token = await tokenRepo.findOneBy({
        address: tokenAddress,
      });
      //If this token doesnt exist then add to db
      if (!token) {
        const symbol = await contract.methods.symbol().call();
        token = new ERC20Token();
        token.address = tokenAddress;
        token.symbol = symbol;
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

    res.send(new SuccessResponse("Added", 201, {}));
  } catch (err: any) {
    console.log(err);
    res.status(400).send(new ErrorResponse(err.toString(), 400));
  }
};

export const getAvailableTokens: RequestHandler = async (_, res) => {
  const tokenRepo = AppDataSource.manager.getRepository(ERC20Token);
  const tokens = await tokenRepo.find();
  res.send(tokens);
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

    //#region load meta data
    const fromTokenContract = new web3.eth.Contract(
      erc20AbiJson,
      fromTokenAddress
    );
    const toTokenContract = new web3.eth.Contract(erc20AbiJson, toTokenAddress);
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
      4,
      temp.from.address,
      temp.from.decimals,
      temp.from.symbol,
      temp.from.name
    );
    const toToken = new Token(
      4,
      temp.to.address,
      temp.to.decimals,
      temp.to.symbol,
      temp.to.name
    );
    //#endregion

    //#region convert amount
    const wei = ethers.utils.parseUnits(amount.toString(), temp.from.decimals);
    const inputAmount = CurrencyAmount.fromRawAmount(
      fromToken,
      JSBI.BigInt(wei)
    );
    //#endregion

    //#region create router
    const alphaRouter = new AlphaRouter({
      chainId: ChainId.RINKEBY,
      provider: web3Provider,
    });
    const route = await alphaRouter.route(
      inputAmount,
      toToken,
      TradeType.EXACT_INPUT,
      {
        recipient: walletAddress,
        slippageTolerance: new Percent(25, 100),
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
      (erc20AbiJsonRaw as any).default,
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
