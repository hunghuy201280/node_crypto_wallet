import express from "express";
import logger  from "./utils/logger";
import cors from "cors";

//routers
import walletRouter from "./routers/wallet";
import tokenRouter from "./routers/token";
import { AppDataSource } from "./db/db";
const app = express();

AppDataSource.initialize()
  .then(() => {
    app.use(express.json());
    app.use(cors());
    app.use("/wallet", walletRouter);
    app.use("/token", tokenRouter);

    app.get("/", (_, res) => {
      res.send("OK");
    });

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log("App is running on port:" + port);
    });
  })
  .catch((e) => {
    console.log("Can't connect to database with error: " + e);
  });
