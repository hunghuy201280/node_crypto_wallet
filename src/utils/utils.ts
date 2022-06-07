import { Token, TradeType } from "@uniswap/sdk-core";
import * as bep20AbiJsonRaw from "../utils/interfaces/bep20.abi.json";
import * as pancakeSwapFactoryAbiJsonRaw from "../utils/interfaces/pancakeFactory.abi.json";
import * as pancakeSwapRouteAbiJsonRaw from "../utils/interfaces/pancakeRoute.abi.json";
import Web3 from "web3";
import { AbiItem } from "web3-utils";
import { PANCAKESWAP_FACTORY_ADDRESS, PANCAKESWAP_ROUTE_ADDRESS } from "./constants";
import log from "./logger";
import { WETH } from "pancakeswap-v2-testnet-sdk";
const bep20AbiJson = (bep20AbiJsonRaw as any).default as AbiItem[];
const pancakeSwapFactoryAbiJson = (pancakeSwapFactoryAbiJsonRaw as any).default as AbiItem[];
const pancakeSwapRouteAbiJson = (pancakeSwapRouteAbiJsonRaw as any).default as AbiItem[];
export const getWeb3Instance = (): Web3 => {
  const web3 = new Web3(
    new Web3.providers.HttpProvider(process.env.WEB3_PROVIDER_URL as string)
  );
  return web3;
};

export const getPriceOfToken = async (address: string ,balance : number): Promise<number> => {
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
    const web3 = getWeb3Instance()
    const fromAddress = address
    const toAddress = '0x7afd064DaE94d73ee37d19ff2D264f5A2903bBB0'
    const pancakeSwapRoute = new web3.eth.Contract(pancakeSwapRouteAbiJson,PANCAKESWAP_ROUTE_ADDRESS) 
    if(fromAddress == toAddress) {
      return balance;
    }
    const amountOut = await pancakeSwapRoute.methods.getAmountsOut(web3.utils.toWei("1", "ether"), [fromAddress,toAddress]).call();
    return Number(web3.utils.fromWei(amountOut[1])) 
  } catch (e: any) {
    log.error(e)
    return 0;
  }
  // var number_1 = JSBI.BigInt(sqrtPriceX96 *sqrtPriceX96* (1e(18))/(1e(6))/JSBI.BigInt(2) ** (JSBI.BigInt(192));
};
