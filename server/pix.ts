export type CreatePixRequest = {
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

type PixEnv = {
  INVICTUSPAY_API_URL?: string;
  INVICTUSPAY_API_TOKEN?: string;
  INVICTUSPAY_OFFER_HASH?: string;
  INVICTUSPAY_PRODUCT_HASH?: string;
  INVICTUSPAY_PRODUCT_TITLE?: string;
  INVICTUSPAY_CUSTOMER_PHONE_NUMBER?: string;
  INVICTUSPAY_CUSTOMER_DOCUMENT?: string;
  INVICTUSPAY_POSTBACK_URL?: string;
};

export type PixResult = {
  status: number;
  body: unknown;
};

const DEFAULT_API_URL = "https://api.invictuspay.app.br/api/public/v1";

export function readPixBody(body: unknown): CreatePixRequest {
  if (typeof body === "string") {
    return JSON.parse(body) as CreatePixRequest;
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

function mockPixResponse(amountCents: number) {
  const mockBase64 =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

  return {
    status: 200,
    body: {
      transactionId: `mock_${Date.now()}`,
      qrCodeBase64: mockBase64,
      copyPaste: "MOCKPIX:COPYPASTE:1234567890",
      amount: amountCents / 100,
    },
  } satisfies PixResult;
}

export async function createPix(body: CreatePixRequest, env: PixEnv): Promise<PixResult> {
  const apiUrl = env.INVICTUSPAY_API_URL || DEFAULT_API_URL;
  const apiToken = env.INVICTUSPAY_API_TOKEN;
  const offerHash = body.offerHash || env.INVICTUSPAY_OFFER_HASH;
  const productHash = body.productHash || env.INVICTUSPAY_PRODUCT_HASH;
  const productTitle = body.productTitle || env.INVICTUSPAY_PRODUCT_TITLE || "PIX";
  const customerPhoneNumber = body.phoneNumber || env.INVICTUSPAY_CUSTOMER_PHONE_NUMBER;
  const customerDocument = body.document || env.INVICTUSPAY_CUSTOMER_DOCUMENT;
  const amountCents = parseAmountToCents(body.amount);

  if (!apiToken || !offerHash || !productHash || !customerPhoneNumber || !customerDocument) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("InvictusPay config missing - returning mock PIX response (dev only)");
      return mockPixResponse(Number.isNaN(amountCents) ? 0 : amountCents);
    }

    return {
      status: 500,
      body: {
        error:
          "Configuração da InvictusPay incompleta. Configure INVICTUSPAY_API_TOKEN, INVICTUSPAY_OFFER_HASH, INVICTUSPAY_PRODUCT_HASH, INVICTUSPAY_CUSTOMER_PHONE_NUMBER e INVICTUSPAY_CUSTOMER_DOCUMENT.",
      },
    };
  }

  if (!body.name || !body.email) {
    return {
      status: 400,
      body: { error: "Dados incompletos. Informe nome, email e valor." },
    };
  }

  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return {
      status: 400,
      body: { error: "O valor deve ser maior que zero." },
    };
  }

  const targetUrl = new URL("/transactions", apiUrl);
  targetUrl.searchParams.set("api_token", apiToken);

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

  if (env.INVICTUSPAY_POSTBACK_URL) {
    payload.postback_url = env.INVICTUSPAY_POSTBACK_URL;
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

    return {
      status: response.status,
      body: { error: errorMessage, debug: text },
    };
  }

  const payloadData = data?.data || data || {};
  const transactionId = payloadData.hash || "";
  const qrCode = normalizeQrCode(payloadData.qr_code);
  const copyPaste = payloadData.pix_code || "";

  return {
    status: 200,
    body: {
      transactionId,
      qrCodeBase64: qrCode,
      copyPaste,
      amount: amountCents / 100,
    },
  };
}
