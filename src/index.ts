import express from "express";
import cors from "cors";
import morganBody from "morgan-body";

//routers
import tokenRouter from "./routers/token.route";
import walletRouter from "./routers/wallet.route";
import transactionRouter from "./routers/transaction.route";
import { AppDataSource } from "./db/db";
const app = express();
morganBody(app);

AppDataSource.initialize()
  .then(() => {
    app.use(express.json());
    app.use(cors());
    app.use("/wallet", walletRouter);
    app.use("/token", tokenRouter);
    app.use("/transaction", transactionRouter);

    app.get("/", (_, res) => {
      res.send("OK");
    });

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log("App is running on port:" + port);
    });
  })
  .catch((e: any) => {
    console.log("Can't connect to database with error: " + e);
  });
