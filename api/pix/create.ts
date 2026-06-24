import { createPix, readPixBody } from "../../server/pix";

type VercelRequest = {
  method?: string;
  body?: unknown;
};

type VercelResponse = {
  status: (statusCode: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  try {
    const result = await createPix(readPixBody(req.body), {
      INVICTUSPAY_API_URL: process.env.INVICTUSPAY_API_URL,
      INVICTUSPAY_API_TOKEN: process.env.INVICTUSPAY_API_TOKEN,
      INVICTUSPAY_OFFER_HASH: process.env.INVICTUSPAY_OFFER_HASH,
      INVICTUSPAY_PRODUCT_HASH: process.env.INVICTUSPAY_PRODUCT_HASH,
      INVICTUSPAY_PRODUCT_TITLE: process.env.INVICTUSPAY_PRODUCT_TITLE,
      INVICTUSPAY_CUSTOMER_PHONE_NUMBER: process.env.INVICTUSPAY_CUSTOMER_PHONE_NUMBER,
      INVICTUSPAY_CUSTOMER_DOCUMENT: process.env.INVICTUSPAY_CUSTOMER_DOCUMENT,
      INVICTUSPAY_POSTBACK_URL: process.env.INVICTUSPAY_POSTBACK_URL,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Erro interno Pix:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
}
