import { Token, TradeType } from "@uniswap/sdk-core";
import * as transactionAbiJsonRaw from "../utils/interfaces/transaction.abi.json";
import * as pancakeSwapFactoryAbiJsonRaw from "../utils/interfaces/pancakeFactory.abi.json";
import * as pancakeSwapRouteAbiJsonRaw from "../utils/interfaces/pancakeRoute.abi.json";
import Web3 from "web3";
import { AbiItem } from "web3-utils";
import {
  PANCAKESWAP_FACTORY_ADDRESS,
  PANCAKESWAP_ROUTE_ADDRESS,
} from "./constants";
import log from "./logger";
const pancakeSwapRouteAbiJson = (pancakeSwapRouteAbiJsonRaw as any)
  .default as AbiItem[];
import { Transaction, TransactionReceipt } from "web3-core";
import InputDataDecoder from "ethereum-input-data-decoder";
import { TransactionType } from "../types/enums";
export const getWeb3Instance = (): Web3 => {
  const web3 = new Web3(
    new Web3.providers.HttpProvider(process.env.WEB3_PROVIDER_URL as string)
  );
  return web3;
};

export const getPriceOfToken = async (
  address: string,
  balance: number
): Promise<number> => {
  try {
    const web3 = getWeb3Instance();
    const fromAddress = address;
    const toAddress = "0x7afd064DaE94d73ee37d19ff2D264f5A2903bBB0";
    const pancakeSwapRoute = new web3.eth.Contract(
      pancakeSwapRouteAbiJson,
      PANCAKESWAP_ROUTE_ADDRESS
    );
    if (fromAddress == toAddress) {
      return balance;
    }
    const amountOut = await pancakeSwapRoute.methods
      .getAmountsOut(web3.utils.toWei("1", "ether"), [fromAddress, toAddress])
      .call();
    return Number(web3.utils.fromWei(amountOut[1]));
  } catch (e: any) {
    log.error(e);
    return 0;
  }
};

export const getTypeOfTransaction = async (
  address: string,
  transaction: Transaction
): Promise<TransactionType> => {
  const decoder = new InputDataDecoder((transactionAbiJsonRaw as any).default);
  const dataDecoder = decoder.decodeData(transaction.input);
  const method = dataDecoder["method"]?.toLowerCase();
  if (!method) {
    if (transaction.input == "0x") {
      if (transaction.from === address) return TransactionType.WITHDRAW;
      else return TransactionType.DEPOSIT;
    }
    return TransactionType.UNDEFINED;
  }
  switch (true) {
    case method.includes("withdraw"):
      return TransactionType.WITHDRAW;
    case method.includes("swap"):
      return TransactionType.SWAP;
    case method.includes("transfer"):
      if (transaction.from === address) return TransactionType.WITHDRAW;
      else return TransactionType.DEPOSIT;
    default:
      return TransactionType.UNDEFINED;
  }
};

export const processTransaction = async (
  address: string,
  transaction: Transaction
): Promise<Object> => {
  console.log(transaction)
  const type = await getTypeOfTransaction(address,transaction);
  const web3 = getWeb3Instance();
  const timestamp = (await web3.eth.getBlock(transaction.blockNumber?.toString() ?? '')).timestamp
  return {
    hash : transaction.hash,
    from : transaction.from,
    to : transaction.to,
    timestamp : timestamp,
    type : type
  }
};
