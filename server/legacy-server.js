import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { getAccessToken } from "./openplantbook.js";

dotenv.config();
const app = express();

app.get("/api/plants", async (req, res) => {
  try {
    const token = await getAccessToken();
    const query = req.query.q;

    if (!query) {
      return res.status(400).json({ error: "Missing query" });
    }

    const apiRes = await fetch(
      `${process.env.OPB_API_BASE}/plants/search?query=${query}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await apiRes.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "OpenPlantBook error" });
  }
});

app.listen(3001, () =>
  console.log("Backend running on http://localhost:3001")
);
