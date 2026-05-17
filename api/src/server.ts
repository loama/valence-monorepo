import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config({ quiet: true });

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

app.get("/", (_request, response) => {
  response.json({
    service: "Valence API",
    message: "Hello from the Valence psychology platform API."
  });
});

app.get("/health", (_request, response) => {
  response.json({
    ok: true
  });
});

app.listen(port, () => {
  console.log(`Valence API listening on port ${port}`);
});
