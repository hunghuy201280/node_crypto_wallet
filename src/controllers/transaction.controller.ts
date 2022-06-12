import { RequestHandler } from "express";
import Web3 from "web3";
import { ErrorResponse, SuccessResponse } from "../utils/base_response";
import { getWeb3Instance, processTransaction } from "../utils/utils";
import { Transaction } from "web3-core";
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
    let { address, page, pageSize } = req.query;
    if (!page) page = "1";
    if (!pageSize) pageSize = "15";
    if (
      !address ||
      typeof address !== "string" ||
      !Web3.utils.isAddress(address?.toString())
    )
      throw "Params not correct";
    const web3 = getWeb3Instance();
    let pageSizeBep20: number = parseInt(pageSize.toString()) / 2;
    let pageSizeBSC: number = parseInt(pageSize.toString()) - pageSizeBep20;
    let listHash: string[] = [];
    //#region Fetch api for bep20 token transaction
    try {
      const resHisotry = await axios.get(
        `${process.env.BSC_URL}/?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&page=${page}&offset=${pageSizeBep20}&sort=desc&apikey=${process.env.BSC_API_KEY}`
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
    //#endregion

    if (listHash.length < pageSizeBep20) {
      pageSizeBSC += pageSizeBep20 - listHash.length;
    }

    //#region Fetch api for history transaction
    try {
      const resHisotry = await axios.get(
        `${process.env.BSC_URL}/?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=${page}&offset=${pageSizeBSC}&sort=desc&apikey=${process.env.BSC_API_KEY}`
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
    //#endregion

    let processData: Promise<Transaction | null>[] = [];
    var func = async (hash: string): Promise<Transaction | null> => {
      try {
        return await web3.eth.getTransaction(hash);
      } catch (e: any) {
        return null;
      }
    };
    listHash.forEach((hash) => {
      processData.push(func(hash));
    });
    let transactions = await Promise.all(processData);

    transactions = transactions.filter(
      (transaction): transaction is Transaction => {
        return transaction !== null;
      }
    );
    let lastResult = await Promise.all(
      transactions.map((transaction) => {
        return processTransaction(address!.toString(), transaction!);
      })
    );
    lastResult = lastResult.sort(function (x: any, y: any) {
      return Number(y.timestamp) - Number(x.timestamp);
    });
    return res
      .status(200)
      .send(new SuccessResponse("Success", res.statusCode, lastResult));
  } catch (err: any) {
    console.log(err);
    return res.status(400).send(new ErrorResponse(err.message, res.statusCode));
  }
};
