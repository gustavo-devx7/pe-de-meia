export type CreatePixRequest = {
  name?: string;
  email?: string;
  amount?: number;
};

type BuckPayCreateResponse = {
  id?: string;
  message?: string;
  error?: string | { message?: string };
  pix?: {
    qrcode_base64?: string;
    code?: string;
  };
  data?: {
    id?: string;
    pix?: {
      qrcode_base64?: string;
      code?: string;
    };
  };
};

type PixEnv = {
  BUCKPAY_API_URL?: string;
  BUCKPAY_API_KEY?: string;
  BUCKPAY_USER_AGENT?: string;
};

export type PixResult = {
  status: number;
  body: unknown;
};

export function readPixBody(body: unknown): CreatePixRequest {
  if (typeof body === "string") {
    return JSON.parse(body) as CreatePixRequest;
  }

  if (body && typeof body === "object") {
    return body as CreatePixRequest;
  }

  return {};
}

export async function createPix(body: CreatePixRequest, env: PixEnv): Promise<PixResult> {
  const buckpayApiUrl = env.BUCKPAY_API_URL;
  const buckpayApiKey = env.BUCKPAY_API_KEY;
  const buckpayUserAgent = env.BUCKPAY_USER_AGENT;

  if (!buckpayApiUrl || !buckpayApiKey || !buckpayUserAgent) {
    // If we're in development and BuckPay credentials are missing,
    // return a mocked successful PIX response so frontend can be tested.
    if (process.env.NODE_ENV !== 'production') {
      console.warn('BuckPay credentials missing — returning mock PIX response (dev only)')
      const mockBase64 =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='
      return {
        status: 200,
        body: {
          transactionId: `mock_${Date.now()}`,
          qrCodeBase64: mockBase64,
          copyPaste: 'MOCKPIX:COPYPASTE:1234567890',
          amount: body.amount ?? 0,
        },
      }
    }

    return {
      status: 500,
      body: { error: "Credenciais da API Pix nao configuradas." },
    };
  }

  if (!body.name || !body.email || !body.amount) {
    return {
      status: 400,
      body: { error: "Dados incompletos. Informe nome, email e valor." },
    };
  }

  if (body.amount <= 0) {
    return {
      status: 400,
      body: { error: "O valor deve ser maior que zero." },
    };
  }

  const response = await fetch(`${buckpayApiUrl}/v1/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${buckpayApiKey}`,
      "User-Agent": buckpayUserAgent,
    },
    body: JSON.stringify({
      external_id: `pix_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      payment_method: "pix",
      amount: Math.round(body.amount * 100),
      buyer: {
        name: body.name,
        email: body.email,
      },
    }),
  });

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  const data = contentType.includes("application/json")
    ? (JSON.parse(text) as BuckPayCreateResponse)
    : null;

  if (!response.ok) {
    const errorMessage =
      data?.message ||
      (typeof data?.error === "object" ? data.error?.message : data?.error) ||
      `Erro ao criar transacao PIX (status ${response.status})`;

    console.error('BuckPay non-ok response:', {
      status: response.status,
      contentType,
      body: text?.slice ? text.slice(0, 2000) : text,
    })

    return {
      status: response.status,
      body: { error: errorMessage, debug: text },
    };
  }

  const payload = data ?? {};
  const pixData = payload.data?.pix || payload.pix;

  return {
    status: 200,
    body: {
      transactionId: payload.data?.id || payload.id,
      qrCodeBase64: pixData?.qrcode_base64 || "",
      copyPaste: pixData?.code || "",
      amount: body.amount,
    },
  };
}
