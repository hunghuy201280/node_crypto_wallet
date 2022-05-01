import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ERC20Token } from "./erc20Token";

@Entity()
export class Wallet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  address: string;

  @ManyToMany(() => ERC20Token)
  @JoinTable()
  tokens: ERC20Token[];
}
