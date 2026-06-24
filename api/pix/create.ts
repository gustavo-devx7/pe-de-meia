type VercelRequest = {
  method?: string;
  body?: unknown;
};

type VercelResponse = {
  status: (statusCode: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

type TrackingParameters = {
  src?: string | null;
  sck?: string | null;
  utm_source?: string | null;
  utm_campaign?: string | null;
  utm_medium?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
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
  utms?: TrackingParameters;
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

const UTMIFY_API_URL = "https://api.utmify.com.br/api-credentials/orders";

// Envia (ou atualiza) o pedido na UTMify. Usado tanto na criação do Pix
// (status "waiting_payment") quanto na confirmação via webhook (status
// "paid"). A UTMify identifica o pedido pelo orderId, então os dois eventos
// se referem ao mesmo registro.
async function sendOrderToUtmify(order: Record<string, unknown>) {
  const apiToken = process.env.UTMIFY_API_TOKEN;
  if (!apiToken) {
    console.warn("UTMIFY_API_TOKEN não configurado — pulando envio para UTMify.");
    return;
  }

  try {
    const response = await fetch(UTMIFY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-token": apiToken,
      },
      body: JSON.stringify(order),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("UTMify respondeu com erro:", response.status, text);
    }
  } catch (error) {
    console.error("Falha ao enviar pedido para UTMify:", error);
  }
}

function normalizeTracking(utms?: TrackingParameters) {
  return {
    src: utms?.src ?? null,
    sck: utms?.sck ?? null,
    utm_source: utms?.utm_source ?? null,
    utm_campaign: utms?.utm_campaign ?? null,
    utm_medium: utms?.utm_medium ?? null,
    utm_content: utms?.utm_content ?? null,
    utm_term: utms?.utm_term ?? null,
  };
}

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

// Varre recursivamente a resposta coletando todos os valores string com seus
// respectivos nomes de campo. Isso nos permite encontrar o código PIX e o QR
// independentemente de como a InvictusPay aninha/nomeia os campos.
function collectStrings(value: unknown, key = "", acc: Array<{ key: string; value: string }> = []) {
  if (typeof value === "string") {
    acc.push({ key: key.toLowerCase(), value });
  } else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, key, acc);
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      collectStrings(v, k, acc);
    }
  }
  return acc;
}

// O "copia e cola" do PIX (payload EMV) sempre começa com "000201".
function extractPixCode(strings: Array<{ key: string; value: string }>): string {
  const emv = strings.find((s) => s.value.replace(/\s/g, "").startsWith("000201"));
  if (emv) return emv.value.trim();

  const byKey = strings.find(
    (s) =>
      /pix_?code|copia|copy_?paste|emv|qr_?code_?text|br_?code|payload/.test(s.key) &&
      s.value.length > 20,
  );
  return byKey ? byKey.value.trim() : "";
}

// Procura uma imagem de QR já pronta (data URL ou base64 de imagem).
function extractQrImage(strings: Array<{ key: string; value: string }>): string {
  const dataUrl = strings.find((s) => s.value.startsWith("data:image"));
  if (dataUrl) return dataUrl.value;

  const base64Key = strings.find(
    (s) => /qr/.test(s.key) && /base64|image|img/.test(s.key) && s.value.length > 100,
  );
  if (base64Key) return normalizeQrCode(base64Key.value);

  return "";
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
    const allStrings = collectStrings(data);

    const transactionId =
      payloadData.hash || (typeof data?.hash === "string" ? data.hash : "") || "";

    const copyPaste = payloadData.pix_code || extractPixCode(allStrings);
    let qrCodeBase64 = normalizeQrCode(payloadData.qr_code) || extractQrImage(allStrings);

    // Se a gateway não devolveu uma imagem de QR, gera uma a partir do
    // código copia-e-cola para que o frontend sempre tenha o que exibir.
    let qrCode = "";
    if (!qrCodeBase64 && copyPaste) {
      qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&data=${encodeURIComponent(
        copyPaste,
      )}`;
    }

    if (!copyPaste && !qrCodeBase64 && !qrCode) {
      console.error("InvictusPay: não foi possível extrair o código PIX da resposta:", {
        keys: allStrings.map((s) => s.key),
        body: text?.slice ? text.slice(0, 2000) : text,
      });
      return res.status(502).json({
        error: "O gateway não retornou o código PIX.",
        debug: text?.slice ? text.slice(0, 2000) : text,
      });
    }

    // Registra o pedido na UTMify com os UTMs capturados no frontend.
    // Sem isso, a UTMify nunca sabe que esse Pix existe, e a confirmação
    // de pagamento (no webhook) não tem o que atualizar.
    if (transactionId) {
      await sendOrderToUtmify({
        orderId: transactionId,
        platform: "InvictusPay",
        paymentMethod: "pix",
        status: "waiting_payment",
        createdAt: new Date().toISOString().replace("T", " ").slice(0, 19),
        approvedDate: null,
        refundedAt: null,
        customer: {
          name: body.name,
          email: body.email,
          phone: customerPhoneNumber || null,
          document: customerDocument || null,
          country: "BR",
        },
        products: [
          {
            id: productHash,
            name: productTitle,
            planId: offerHash,
            planName: productTitle,
            quantity: 1,
            priceInCents: amountCents,
          },
        ],
        commission: {
          totalPriceInCents: amountCents,
          gatewayFeeInCents: 0,
          userCommissionInCents: amountCents,
        },
        trackingParameters: normalizeTracking(body.utms),
        isTest: false,
      });
    }

    return res.status(200).json({
      transactionId,
      qrCodeBase64,
      qrCode,
      copyPaste,
      amount: amountCents / 100,
    });
  } catch (error) {
    console.error("Erro interno Pix:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
}
