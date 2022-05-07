import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

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
    name: "image_url",
  })
  imageUrl: string;
}
