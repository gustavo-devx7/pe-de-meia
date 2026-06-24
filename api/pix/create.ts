type VercelRequest = {
  method?: string;
  body?: unknown;
};

type VercelResponse = {
  status: (statusCode: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

type CreatePixRequest = {
  name?: string;
  email?: string;
  amount?: number | string;
  phoneNumber?: string;
  document?: string;
  offerHash?: string;
  productHash?: string;
  productTitle?: string;
};

type InvictusCreateResponse = {
  success?: boolean;
  message?: string;
  error?: string | { message?: string };
  data?: {
    hash?: string;
    status?: string;
    amount?: number;
    payment_method?: string;
    qr_code?: string;
    pix_code?: string;
    created_at?: string;
    expires_at?: string;
  };
  hash?: string;
  status?: string;
  amount?: number;
  qr_code?: string;
  pix_code?: string;
};

const DEFAULT_API_URL = "https://api.invictuspay.app.br/api/public/v1";

function readPixBody(body: unknown): CreatePixRequest {
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as CreatePixRequest;
    } catch {
      return {};
    }
  }

  if (body && typeof body === "object") {
    return body as CreatePixRequest;
  }

  return {};
}

function parseAmountToCents(amount: CreatePixRequest["amount"]): number {
  if (typeof amount === "number") {
    return Math.round(amount * 100);
  }

  if (typeof amount === "string") {
    const normalized = amount.replace(",", ".").trim();
    const parsed = Number(normalized);
    if (!Number.isNaN(parsed)) {
      return Math.round(parsed * 100);
    }
  }

  return Number.NaN;
}

function normalizeQrCode(value?: string): string {
  if (!value) return "";
  return value.startsWith("data:") ? value : `data:image/png;base64,${value}`;
}

function buildTransactionsUrl(apiUrl: string, apiToken: string): URL {
  // Garante que o caminho base (ex.: /api/public/v1) seja preservado ao
  // anexar /transactions, em vez de ser sobrescrito por um caminho absoluto.
  const base = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
  const targetUrl = new URL(`${base}/transactions`);
  targetUrl.searchParams.set("api_token", apiToken);
  return targetUrl;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  try {
    const body = readPixBody(req.body);

    const apiUrl = process.env.INVICTUSPAY_API_URL || DEFAULT_API_URL;
    const apiToken = process.env.INVICTUSPAY_API_TOKEN;
    const offerHash = body.offerHash || process.env.INVICTUSPAY_OFFER_HASH;
    const productHash = body.productHash || process.env.INVICTUSPAY_PRODUCT_HASH;
    const productTitle = body.productTitle || process.env.INVICTUSPAY_PRODUCT_TITLE || "PIX";
    const customerPhoneNumber = body.phoneNumber || process.env.INVICTUSPAY_CUSTOMER_PHONE_NUMBER;
    const customerDocument = body.document || process.env.INVICTUSPAY_CUSTOMER_DOCUMENT;
    const amountCents = parseAmountToCents(body.amount);

    if (!apiToken || !offerHash || !productHash || !customerPhoneNumber || !customerDocument) {
      return res.status(500).json({
        error:
          "Configuração da InvictusPay incompleta. Configure INVICTUSPAY_API_TOKEN, INVICTUSPAY_OFFER_HASH, INVICTUSPAY_PRODUCT_HASH, INVICTUSPAY_CUSTOMER_PHONE_NUMBER e INVICTUSPAY_CUSTOMER_DOCUMENT.",
      });
    }

    if (!body.name || !body.email) {
      return res.status(400).json({ error: "Dados incompletos. Informe nome, email e valor." });
    }

    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return res.status(400).json({ error: "O valor deve ser maior que zero." });
    }

    const targetUrl = buildTransactionsUrl(apiUrl, apiToken);

    const payload: Record<string, unknown> = {
      amount: amountCents,
      offer_hash: offerHash,
      payment_method: "pix",
      customer: {
        name: body.name,
        email: body.email,
        phone_number: customerPhoneNumber,
        document: customerDocument,
      },
      cart: [
        {
          product_hash: productHash,
          title: productTitle,
          cover: null,
          price: amountCents,
          quantity: 1,
          operation_type: 1,
          tangible: false,
        },
      ],
      expire_in_days: 1,
      transaction_origin: "api",
    };

    if (process.env.INVICTUSPAY_POSTBACK_URL) {
      payload.postback_url = process.env.INVICTUSPAY_POSTBACK_URL;
    }

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();

    let data: InvictusCreateResponse | null = null;
    if (contentType.includes("application/json")) {
      try {
        data = JSON.parse(text) as InvictusCreateResponse;
      } catch (error) {
        console.error("InvictusPay returned invalid JSON:", {
          status: response.status,
          contentType,
          error,
          body: text?.slice ? text.slice(0, 2000) : text,
        });
      }
    }

    if (!response.ok) {
      const errorMessage =
        data?.message ||
        (typeof data?.error === "object" ? data.error?.message : data?.error) ||
        `Erro ao criar transação PIX (status ${response.status})`;

      console.error("InvictusPay non-ok response:", {
        status: response.status,
        contentType,
        body: text?.slice ? text.slice(0, 2000) : text,
      });

      return res.status(response.status).json({ error: errorMessage, debug: text });
    }

    const payloadData = data?.data || data || {};
    const transactionId = payloadData.hash || "";
    const qrCode = normalizeQrCode(payloadData.qr_code);
    const copyPaste = payloadData.pix_code || "";

    return res.status(200).json({
      transactionId,
      qrCodeBase64: qrCode,
      copyPaste,
      amount: amountCents / 100,
    });
  } catch (error) {
    console.error("Erro interno Pix:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
}
