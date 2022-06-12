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
        const events = await nftContract.getPastEvents("Transfer", {
          filter: {
            from: "0x0000000000000000000000000000000000000000",
            to: address,
          },
          fromBlock: 0,
        });

        const list721: {
          tokenId: string;
          name: string;
          addressOwner: string;
          image: string | undefined;
          description: string | undefined;
        }[] = [];
        await Promise.all(
          events.map(async (event) => {
            try {
              const link = await nftContract.methods
                .tokenURI(event.returnValues.tokenId)
                .call();
              const data = await axios.get(link);
              const { name, image, description, addressOwner } = data.data;
              list721.push({
                name: name,
                image: image,
                description: description,
                tokenId: event.returnValues.tokenId,
                addressOwner: addressOwner,
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
