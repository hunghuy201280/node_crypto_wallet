import { Percent, Token, TradeType } from "@uniswap/sdk-core";
import * as rpsAbiJsonRaw from "../utils/rps.abi.json";
import {
  AlphaRouter,
  ChainId,
  CurrencyAmount,
  TokenProvider,
} from "@uniswap/smart-order-router";
import JSBI from "jsbi";
import Web3 from "web3";
import { Contract, ethers } from "ethers";
import { AbiItem } from "web3-utils";
const rpsAbiJson = ((rpsAbiJsonRaw as any).default)['abi'] as AbiItem[];
export const getWeb3Instance = (): Web3 => {
  const web3 = new Web3(
    new Web3.providers.HttpProvider(process.env.WEB3_PROVIDER_URL as string)
  );
  return web3;
};

export const getPriceOfToken = async (address: string): Promise<number> => {
  // const provider = new ethers.providers.JsonRpcProvider(process.env.WEB3_PROVIDER_URL as string)
  // const abisFactory = ((IUniswapV3FactoryABI as any).default)["abi"]
  // const abisPool = ((IUniswapV3PoolABI as any).default)["abi"]
  // var factoryV3 = new ethers.Contract(FACTORY_ADDRESS,abisFactory,provider);
  // var poolAddress = await factoryV3.getPool(address,"0x3813e82e6f7098b9583FC0F33a962D02018B6803" , 8000)
  // var poolContract = new ethers.Contract(poolAddress,abisPool,provider);
  // var poolBalance = await poolContract.slot0();
  // var sqrtPriceX96 = poolBalance[0];
  // return sqrtPriceX96;
  try {
    const fromTokenAddress = address;
    const toTokenAddress = "0x3813e82e6f7098b9583FC0F33a962D02018B6803";
    const web3 = getWeb3Instance()
    const provider = new ethers.providers.JsonRpcProvider(
      process.env.SUB_PROVIDER_URL as string
    );
  
    //#region load meta data
    const fromTokenContract = new web3.eth.Contract(
      rpsAbiJson,
      fromTokenAddress
    );
    const toTokenContract = new web3.eth.Contract(rpsAbiJson, toTokenAddress);
    const promiseResult = await Promise.all([
      fromTokenContract.methods.decimals().call(),
      toTokenContract.methods.decimals().call(),
    ]);
    const temp = {
      from: {
        decimals: parseInt(promiseResult[0]),
        address: fromTokenAddress,
      },
      to: {
        decimals: parseInt(promiseResult[1]),
        address: toTokenAddress,
      },
    };
  
    const fromToken = new Token(
      ChainId.POLYGON_MUMBAI,
      temp.from.address,
      temp.from.decimals,
    );
    const toToken = new Token(
      ChainId.POLYGON_MUMBAI,
      temp.to.address,
      temp.to.decimals,
    );
    //#endregion
  
    //#region convert amount
    const wei = ethers.utils.parseUnits("1", temp.from.decimals);
    const inputAmount = CurrencyAmount.fromRawAmount(fromToken, JSBI.BigInt(wei));
    //#endregion
  
    //#region create router
    const alphaRouter = new AlphaRouter({
      chainId: ChainId.POLYGON_MUMBAI,
      provider: provider,
    });
    const route = await alphaRouter.route(
      inputAmount,
      toToken,
      TradeType.EXACT_INPUT
    );
    console.log(route);
    return 0;
  }
  catch(e : any) {
    return 0
  }
  // var number_1 = JSBI.BigInt(sqrtPriceX96 *sqrtPriceX96* (1e(18))/(1e(6))/JSBI.BigInt(2) ** (JSBI.BigInt(192));
};
