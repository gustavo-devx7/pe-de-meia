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
      BUCKPAY_API_URL: process.env.BUCKPAY_API_URL,
      BUCKPAY_API_KEY: process.env.BUCKPAY_API_KEY,
      BUCKPAY_USER_AGENT: process.env.BUCKPAY_USER_AGENT,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Erro interno Pix:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
}
