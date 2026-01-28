import express from "express";
import helmet from "helmet";
import morgan from "morgan";

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

const PORT = Number(process.env.PORT ?? 3000);
const TIME_ZONE = Number(process.env.TIME_ZONE ?? -5);

function getEnv() {
  return {
    PAYPHONE_TOKEN: process.env.PAYPHONE_TOKEN,
    PAYPHONE_STORE_ID: process.env.PAYPHONE_STORE_ID,
    PAYPHONE_RESPONSE_URL: process.env.PAYPHONE_RESPONSE_URL,
    PAYPHONE_CANCELLATION_URL:
      process.env.PAYPHONE_CANCELLATION_URL || process.env.PAYPHONE_RESPONSE_URL,
  };
}

function requireEnv() {
  const env = getEnv();
  const missing = [];
  if (!env.PAYPHONE_TOKEN) missing.push("PAYPHONE_TOKEN");
  if (!env.PAYPHONE_STORE_ID) missing.push("PAYPHONE_STORE_ID");
  if (!env.PAYPHONE_RESPONSE_URL) missing.push("PAYPHONE_RESPONSE_URL");
  return { env, missing };
}

async function safeJsonOrText(response) {
  const raw = await response.text();
  try {
    return { raw, json: JSON.parse(raw) };
  } catch {
    return { raw, json: null };
  }
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, name: "miketech-payphone-api" });
});

// ---------------------------
// PREPARE
// POST https://pay.payphonetodoesposible.com/api/button/Prepare
// ---------------------------
app.post("/api/payphone/prepare", async (req, res) => {
  const { env, missing } = requireEnv();
  if (missing.length) {
    return res.status(500).json({
      message: `Faltan variables de entorno: ${missing.join(", ")}`,
    });
  }

  const body = req.body ?? {};

  // Montos en CENTAVOS (enteros)
  const amount = Number(body.amount);
  const amountWithoutTax = Number(body.amountWithoutTax);
  const amountWithTax = Number(body.amountWithTax ?? 0);
  const tax = Number(body.tax ?? 0);

  if (!Number.isInteger(amount) || amount <= 0) {
    return res
      .status(400)
      .json({ message: "amount debe ser entero (centavos) y mayor a 0." });
  }
  if (!Number.isInteger(amountWithoutTax) || amountWithoutTax < 0) {
    return res.status(400).json({
      message: "amountWithoutTax debe ser entero (centavos) y >= 0.",
    });
  }
  if (!Number.isInteger(amountWithTax) || amountWithTax < 0) {
    return res.status(400).json({
      message: "amountWithTax debe ser entero (centavos) y >= 0.",
    });
  }
  if (!Number.isInteger(tax) || tax < 0) {
    return res
      .status(400)
      .json({ message: "tax debe ser entero (centavos) y >= 0." });
  }

  const clientTransactionId = String(body.clientTransactionId || "");
  if (!clientTransactionId) {
    return res.status(400).json({ message: "clientTransactionId es requerido." });
  }

  const reference = String(body.reference || "Pago Tienda MikeTech S.A");
  const items = Array.isArray(body.items) ? body.items : [];

  const payload = {
    amount,
    amountWithoutTax,
    amountWithTax,
    tax,
    service: 0,
    tip: 0,
    clientTransactionId,
    reference,
    storeId: env.PAYPHONE_STORE_ID,
    currency: "USD",
    responseUrl: env.PAYPHONE_RESPONSE_URL,
    cancellationUrl: env.PAYPHONE_CANCELLATION_URL,
    timeZone: TIME_ZONE,
    order: items.length ? { lineItems: items } : undefined,
  };

  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

  try {
    const r = await fetch("https://pay.payphonetodoesposible.com/api/button/Prepare", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // importante: PayPhone acepta Bearer; si te diera 401, probamos "bearer"
        Authorization: `bearer ${env.PAYPHONE_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const parsed = await safeJsonOrText(r);

    if (!r.ok) {
      return res.status(r.status).json({
        message: "PayPhone rechazó la preparación.",
        status: r.status,
        payphone: parsed.json ?? { raw: parsed.raw },
        sent: {
          storeId: env.PAYPHONE_STORE_ID,
          responseUrl: env.PAYPHONE_RESPONSE_URL,
          cancellationUrl: env.PAYPHONE_CANCELLATION_URL,
        },
      });
    }

    return res.json(parsed.json ?? { raw: parsed.raw });
  } catch (err) {
    console.error("ERROR /prepare:", err);
    return res
      .status(500)
      .json({ message: "Error conectando con PayPhone.", error: String(err?.message || err) });
  }
});

// ---------------------------
// CONFIRM (V2)
// POST https://pay.payphonetodoesposible.com/api/button/V2/Confirm
// ---------------------------
async function confirmTransaction({ id, clientTransactionId, token }) {
  const r = await fetch("https://pay.payphonetodoesposible.com/api/button/V2/Confirm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id, clientTransactionId }),
  });

  const parsed = await safeJsonOrText(r);

  return {
    ok: r.ok,
    status: r.status,
    data: parsed.json ?? { raw: parsed.raw },
  };
}

// GET confirm (para tu result.html)
app.get("/api/payphone/confirm", async (req, res) => {
  const { env, missing } = requireEnv();
  if (missing.length) {
    return res.status(500).json({ message: `Faltan variables de entorno: ${missing.join(", ")}` });
  }

  const id = String(req.query.id || "");
  const clientTransactionId = String(req.query.clientTransactionId || "");

  if (!id || !clientTransactionId) {
    return res
      .status(400)
      .json({ message: "Se requieren query params: id y clientTransactionId" });
  }

  try {
    const result = await confirmTransaction({
      id,
      clientTransactionId,
      token: env.PAYPHONE_TOKEN,
    });

    if (!result.ok) {
      return res.status(result.status).json({
        message: "PayPhone rechazó la confirmación.",
        status: result.status,
        payphone: result.data,
      });
    }

    return res.json(result.data);
  } catch (err) {
    console.error("ERROR /confirm (GET):", err);
    return res
      .status(500)
      .json({ message: "Error confirmando con PayPhone.", error: String(err?.message || err) });
  }
});

// POST confirm (por si luego quieres confirmarlo desde backend con body)
app.post("/api/payphone/confirm", async (req, res) => {
  const { env, missing } = requireEnv();
  if (missing.length) {
    return res.status(500).json({ message: `Faltan variables de entorno: ${missing.join(", ")}` });
  }

  const id = String(req.body?.id || "");
  const clientTransactionId = String(req.body?.clientTransactionId || "");

  if (!id || !clientTransactionId) {
    return res.status(400).json({ message: "Body requerido: { id, clientTransactionId }" });
  }

  try {
    const result = await confirmTransaction({
      id,
      clientTransactionId,
      token: env.PAYPHONE_TOKEN,
    });

    if (!result.ok) {
      return res.status(result.status).json({
        message: "PayPhone rechazó la confirmación.",
        status: result.status,
        payphone: result.data,
      });
    }

    return res.json(result.data);
  } catch (err) {
    console.error("ERROR /confirm (POST):", err);
    return res
      .status(500)
      .json({ message: "Error confirmando con PayPhone.", error: String(err?.message || err) });
  }
});

app.listen(PORT, () => {
  console.log(`✅ API MikeTech corriendo en http://localhost:${PORT}`);
});
