import { DataSource } from "typeorm";
import options from "./ormconfig";

export const AppDataSource = new DataSource(options);
