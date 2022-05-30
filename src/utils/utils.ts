import Web3 from "web3";

export const getWeb3Instance = (): Web3 => {
  const web3 = new Web3(
    new Web3.providers.HttpProvider(process.env.WEB3_PROVIDER_URL as string)
  );
  return web3;
};
