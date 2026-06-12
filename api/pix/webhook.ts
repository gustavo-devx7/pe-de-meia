import { createHmac, timingSafeEqual } from "crypto";
import { createPix, readPixBody } from "../../server/pix";

type VercelRequest = {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
};

type VercelResponse = {
  status: (statusCode: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

function verifyWebhookSignature(payload: string, signature: string | undefined, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  // Verificação de assinatura do webhook BuckPay
  const webhookSecret = process.env.BUCKPAY_WEBHOOK_SECRET;
  if (webhookSecret) {
    const signature = req.headers["x-buckpay-signature"] as string | undefined;
    const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      return res.status(401).json({ error: "Assinatura invalida." });
    }
  }

  try {
    const result = await createPix(readPixBody(req.body), {
      BUCKPAY_API_URL: process.env.BUCKPAY_API_URL,
      BUCKPAY_API_KEY: process.env.BUCKPAY_API_KEY,
      BUCKPAY_USER_AGENT: process.env.BUCKPAY_USER_AGENT,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Erro interno Webhook:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
}
