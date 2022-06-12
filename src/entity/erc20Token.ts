import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Transaction } from "./transaction";

@Entity({
  name: "ERC20Token",
})
export class ERC20Token {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  address: string;

  @Column()
  symbol: string;

  @Column({
    name: "token_decimal",
  })
  decimal: number;

  @Column({
    name: "image_url",
  })
  imageUrl: string;

  @OneToMany(() => Transaction, (transaction) => transaction.token)
  transactions: Transaction[];
}
