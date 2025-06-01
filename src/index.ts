import dotenv from "dotenv";
import express from "express";
import { handleSlackEvent } from "./slack";

dotenv.config();

const app = express();
app.use(express.json());

app.post("/slack/events", async (req: any, res: any) => {
  const { type, event } = req.body;

  if (type === "url_verification") {
    return res.status(200).send(req.body.challenge);
  }

  res.sendStatus(200);

  if (event) {
    handleSlackEvent(event);
  }
});

const PORT = 8080;
app.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));
