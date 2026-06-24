type VercelRequest = {
  method?: string;
  body?: unknown;
};

type VercelResponse = {
  status: (statusCode: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

const UTMIFY_API_URL = "https://api.utmify.com.br/api-credentials/orders";

// Status que a InvictusPay pode enviar para indicar que o Pix foi pago.
const PAID_STATUSES = new Set(["paid", "approved", "completed", "confirmed"]);

function formatUtmifyDate(date: Date): string {
  return date.toISOString().replace("T", " ").slice(0, 19);
}

// Repassa a confirmação de pagamento para a UTMify, atualizando o mesmo
// orderId que foi criado em /api/pix/create.ts com status "waiting_payment".
// Sem essa chamada, a UTMify nunca sabe que o Pix foi pago e a venda nunca
// aparece como convertida no painel/Meta Pixel.
async function notifyUtmifyPaid(transactionId: string) {
  const apiToken = process.env.UTMIFY_API_TOKEN;
  if (!apiToken) {
    console.warn("UTMIFY_API_TOKEN não configurado — não foi possível notificar pagamento à UTMify.");
    return;
  }

  try {
    const response = await fetch(UTMIFY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-token": apiToken,
      },
      body: JSON.stringify({
        orderId: transactionId,
        status: "paid",
        approvedDate: formatUtmifyDate(new Date()),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("UTMify respondeu com erro ao confirmar pagamento:", response.status, text);
    }
  } catch (error) {
    console.error("Falha ao notificar pagamento para UTMify:", error);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo nao permitido." });
  }

  try {
    const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const data = (payload && typeof payload === "object" && "data" in payload
      ? (payload as { data?: Record<string, unknown> }).data
      : payload) as Record<string, unknown> | undefined;

    const transactionId = (data?.hash ?? data?.id ?? data?.transaction_id ?? null) as
      | string
      | null;
    const status = (data?.status ?? null) as string | null;

    console.log("Webhook InvictusPay recebido:", {
      event: (payload as { event?: unknown } | null)?.event ?? (payload as { type?: unknown } | null)?.type,
      transactionId,
      status,
    });

    if (transactionId && status && PAID_STATUSES.has(status.toLowerCase())) {
      await notifyUtmifyPaid(transactionId);
    }

    return res.status(200).json({
      received: true,
      transactionId,
      status,
    });
  } catch (error) {
    console.error("Erro interno Webhook:", error);
    return res.status(200).json({ received: true, error: "Erro ao processar." });
  }
}

