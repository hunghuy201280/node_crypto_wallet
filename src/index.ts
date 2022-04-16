import express from "express";
import logger  from "./utils/logger";
import cors from "cors";

//routers
import walletRouter from "./routers/wallet.route";
const app = express();

app.use(express.json());
app.use(cors());
app.use("/wallet", walletRouter);

app.get("/", (_, res) => {
  res.send("OK");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info("App is running on port:" + port);
});
