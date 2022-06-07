import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ERC20Token } from "./erc20Token";
@Entity({
  name: "Transaction",
})
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fromAddress: string;

  @Column()
  toAddress: string;

  @Column()
  createdTime: Date;

  @Column()
  value: number;

  @ManyToOne(() => ERC20Token, (token) => token.transactions)
  token: ERC20Token;
}
