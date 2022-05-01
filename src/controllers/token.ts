import { RequestHandler } from "express";
import Web3 from "web3";
import { ErrorResponse, SuccessResponse } from "../utils/base_response";
import * as erc20AbiJsonRaw from "../utils/erc20.abi.json";
import { AbiItem } from "web3-utils";
import { AppDataSource } from "../db/db";
import { ERC20Token } from "../entity/erc20Token";
import { Wallet } from "../entity/wallet";

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
      new Web3.providers.HttpProvider(process.env.RINKEBY as string)
    );
    const responseJson: {
      balance: number;
      symbol: string;
    }[] = [];

    for (const token of tokens) {
      const contract = new web3.eth.Contract(erc20AbiJson, token.address);

      const tokenBalance = await contract.methods
        .balanceOf(walletAddress)
        .call();
      responseJson.push({
        symbol: token.symbol,
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
      new Web3.providers.HttpProvider(process.env.RINKEBY as string)
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

export const getAvailableTokens: RequestHandler = async (req, res) => {
  const tokenRepo = AppDataSource.manager.getRepository(ERC20Token);
  const tokens = await tokenRepo.find();
  res.send(tokens);
};
