import { ERC20Token } from "../entity/erc20Token";

export type TokenResponse = ERC20Token & { balance: number };
