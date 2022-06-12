import { ErrorResponse, SuccessResponse } from "../utils/base_response";
import { CHAIN_ID } from "../utils/constants";
import * as nftAbiJsonRaw from "../utils/interfaces/nft.abi.json";
import { RequestHandler } from "express";
import { AbiItem } from "web3-utils";
import Web3 from "web3";
import axios from "axios";
import log from "../utils/logger";
import { getWeb3Instance } from "../utils/utils";
import { ERC721Validator } from "@nibbstack/erc721-validator";
import { TransactionType } from "../types/enums";
const nftAbiJson = (nftAbiJsonRaw as any).default as AbiItem[];

export const getNftOwner: RequestHandler = async (req, res) => {
  try {
    const { address, collections } = req.query;
    let collectionArray: string[] = [];
    if (collections)
      collectionArray = collections
        .toString()
        .split(",")
        .filter((tk) => Web3.utils.isAddress(tk ?? "", CHAIN_ID));
    if (
      typeof address !== "string" ||
      !Web3.utils.isAddress(address?.toString() ?? "", CHAIN_ID)
    ) {
      throw "Invalid wallet address";
    }

    const web3 = getWeb3Instance();
    const result = [];
    for (let collection of collectionArray) {
      try {
        const nftContract = new web3.eth.Contract(nftAbiJson, collection);
        const name = await nftContract.methods.name().call();
        const sendLogs = await nftContract.getPastEvents("Transfer", {
          filter: {
            from: address,
          },
          fromBlock: 0,
        });
        const receiveLogs = await nftContract.getPastEvents("Transfer", {
          filter: {
            to: address,
          },
          fromBlock: 0,
        });

        // Filter Token
        const logs = sendLogs
          .concat(receiveLogs)
          .sort(
            (a, b) =>
              a.blockNumber - b.blockNumber ||
              a.transactionIndex - b.transactionIndex
          );

        const owned = new Set<string>();

        for (const log of logs) {
          const { from, to, tokenId } = log.returnValues;

          if (to.toLowerCase() === address.toLowerCase()) {
            owned.add(tokenId.toString());
          } else if (from.toLowerCase() === address.toLowerCase()) {
            owned.delete(tokenId.toString());
          }
        }

        const list721: {
          tokenId: string;
          name: string;
          addressOwner: string;
          image: string | undefined;
          description: string | undefined;
        }[] = [];
        await Promise.all(
          [...owned].map(async (token) => {
            try {
              const link = await nftContract.methods.tokenURI(token).call();
              const data = await axios.get(link);
              const { name, image, description } = data.data;
              list721.push({
                name: name,
                image: image,
                description: description,
                tokenId: token,
                addressOwner: address,
              });
            } catch (e) {}
          })
        );
        console.log(list721);

        result.push({
          address: collection,
          name: name,
          items: list721,
        });
      } catch (e) {
        log.error(e);
      }
    }

    return res
      .status(200)
      .send(new SuccessResponse("Success", res.statusCode, result));
  } catch (err: any) {
    log.error(err);
    return res.status(400).send(new ErrorResponse(err.message, res.statusCode));
  }
};

export const getInfoCollection: RequestHandler = async (req, res) => {
  try {
    const { address } = req.params;
    if (
      typeof address !== "string" ||
      !Web3.utils.isAddress(address?.toString() ?? "", CHAIN_ID)
    ) {
      throw "Invalid wallet address";
    }

    const web3 = getWeb3Instance();
    const nftContract = new web3.eth.Contract(nftAbiJson, address);
    const name = await nftContract.methods.name().call();
    const symbol = await nftContract.methods.symbol().call();

    return res.status(200).send(
      new SuccessResponse("Success", res.statusCode, {
        address: address,
        name: name,
        symbol: symbol,
      })
    );
  } catch (err: any) {
    log.error(err);
    return res.status(400).send(new ErrorResponse(err.message, res.statusCode));
  }
};

export const getErc721ValidAddress: RequestHandler = async (req, res) => {
  try {
    const { address } = req.params;

    if (!Web3.utils.isAddress(address)) {
      throw "Address is not valid";
    }

    const web3 = getWeb3Instance();
    const validator = new ERC721Validator(
      web3,
      "0x7afd064DaE94d73ee37d19ff2D264f5A2903bBB0"
    );
    const result = await validator.basic(2, address);

    return res.status(200).send(
      new SuccessResponse("Success", res.statusCode, {
        address: address,
        isValid: result.result,
      })
    );
  } catch (err: any) {
    console.log(err);
    return res.status(400).send(new ErrorResponse(err.message, res.statusCode));
  }
};

export const transferNFT: RequestHandler = async (req, res) => {
  try {
    const { fromAddress, toAddress, contractAddress, tokenId, fromPrivateKey } =
      req.body;
    if (
      !Web3.utils.isAddress(fromAddress) ||
      !Web3.utils.isAddress(toAddress)
    ) {
      throw "Address is not valid";
    }
    const web3 = getWeb3Instance();
    const validator = new ERC721Validator(
      web3,
      "0x7afd064DaE94d73ee37d19ff2D264f5A2903bBB0"
    );
    const valid = await validator.basic(2, contractAddress);
    if (!valid.result) throw "Contract address is not valid";

    const nftContract = new web3.eth.Contract(nftAbiJson, contractAddress);
    const dataField = await nftContract.methods
      .transferFrom(fromAddress, toAddress, tokenId)
      .encodeABI();

    const data = {
      gas: Web3.utils.toHex(100000),
      to: contractAddress,
      data: dataField,
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

    return res
      .status(200)
      .send(
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
