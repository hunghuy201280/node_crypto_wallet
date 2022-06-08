import { RequestHandler } from "express";
import Web3 from "web3";
import { ErrorResponse, SuccessResponse } from "../utils/base_response";
import * as bep20AbiJsonRaw from "../utils/interfaces/bep20.abi.json";
import { AbiInput, AbiItem } from "web3-utils";
import {
  getTypeOfTransaction,
  getWeb3Instance,
  processTransaction,
} from "../utils/utils";
import { Transaction, TransactionReceipt } from "web3-core";
import { P } from "pino";
import log from "../utils/logger";
import axios from "axios";

export const getHashDetail: RequestHandler = async (req, res) => {
  try {
    const { address, hash } = req.query;
    if (
      typeof address !== "string" ||
      !Web3.utils.isAddress(address) ||
      typeof hash !== "string"
    )
      throw "Params not correct";
    const web3 = getWeb3Instance();
    const transaction: Transaction = await web3.eth.getTransaction(hash);
    if (!transaction) throw "Transaction not exist";

    return res
      .status(200)
      .send(
        new SuccessResponse(
          "Success",
          res.statusCode,
          await processTransaction(address, transaction)
        )
      );
  } catch (err: any) {
    console.log(err);
    return res.status(400).send(new ErrorResponse(err.message, res.statusCode));
  }
};

export const getHistoryTransaction: RequestHandler = async (req, res) => {
  try {
    const { address } = req.query;
    if (typeof address !== "string" || !Web3.utils.isAddress(address))
      throw "Params not correct";
    const web3 = getWeb3Instance();
    let listHash: string[] = [];
    // Fetch api for history transaction
    try {
      const resHisotry = await axios.get(
        `${process.env.BSC_URL}/?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=30&sort=asc&apikey=${process.env.BSC_API_KEY}`
      );
      const result = ((resHisotry.data as any)["result"] as any[]).map(
        (body) => {
          return body.hash.toString();
        }
      );
      listHash = listHash.concat(result);
    } catch (e: any) {
      log.error(e);
    }

    // Fetch api for bep20 token transaction
    try {
      const resHisotry = await axios.get(
        `${process.env.BSC_URL}/?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&page=1&offset=30&sort=asc&apikey=${process.env.BSC_API_KEY}`
      );
      const result = ((resHisotry.data as any)["result"] as any[]).map(
        (body) => {
          return body.hash.toString();
        }
      );
      listHash = listHash.concat(result);
    } catch (e: any) {
      log.error(e);
    }

    let processData :Promise<Transaction | null>[] = []
    var func = async (hash : string) : Promise<Transaction | null> => {
      try{
        return await web3.eth.getTransaction(hash)
      }catch(e:any) {
        return null
      }
    }
    listHash.forEach((hash) => {
      processData.push(func(hash))
    })
    let transactions = await Promise.all(
      processData
    );

    transactions = transactions.filter(
      (transaction): transaction is Transaction => {
        return transaction !== null;
      }
    );
    let lastResult = await Promise.all(
      transactions.map((transaction) => {
        return processTransaction(address, transaction!);
      })
    );
    lastResult = lastResult.sort(function(x :any, y : any){
      return Number(y.timestamp) - Number(x.timestamp);
  })
    return res
      .status(200)
      .send(new SuccessResponse("Success", res.statusCode, lastResult));
  } catch (err: any) {
    console.log(err);
    return res.status(400).send(new ErrorResponse(err.message, res.statusCode));
  }
};