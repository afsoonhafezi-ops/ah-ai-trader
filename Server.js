const express = require("express");
const OpenAI = require("openai");

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

app.get("/", (req, res) => {
  res.status(200).send("AH AI TRADER V1 is running.");
});

app.post("/webhook", async (req, res) => {
  try {
    if (
      !WEBHOOK_SECRET ||
      req.get("x-webhook-secret") !== WEBHOOK_SECRET
    ) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const alert = req.body;

    if (!alert || typeof alert !== "object") {
      return res.status(400).json({ error: "Invalid alert data" });
    }

    if (!OPENAI_API_KEY) {
      return res.status(503).json({
        error: "OpenAI API key is not configured"
      });
    }

    const client = new OpenAI({ apiKey: OPENAI_API_KEY });

    const response = await client.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are AH AI TRADER. Analyze only the supplied market data. Never invent missing prices or indicators. Return JSON with keys: decision (LONG, SHORT, or WAIT), confidence (0-100), entry, stop_loss, tp1, tp2, tp3, risk_reward, reasons, warnings. If data is insufficient, choose WAIT and explain why. This is analysis, not a guarantee."
        },
        {
          role: "user",
          content: JSON.stringify(alert)
        }
      ]
    });

    const result = JSON.parse(
      response.choices[0].message.content || "{}"
    );

    console.log("AH AI TRADER result:", JSON.stringify(result));

    return res.status(200).json(result);
  } catch (error) {
    console.error("Webhook error:", error.message);
    return res.status(500).json({ error: "Analysis failed" });
  }
});

app.listen(PORT, () => {
  console.log(AH AI TRADER listening on port ${PORT});
});
