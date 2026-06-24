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
    const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const data = (payload && typeof payload === "object" && "data" in payload
      ? (payload as { data?: Record<string, unknown> }).data
      : payload) as Record<string, unknown> | undefined;

    console.log("Webhook InvictusPay recebido:", {
      event: (payload as { event?: unknown } | null)?.event ?? (payload as { type?: unknown } | null)?.type,
      transactionId: data?.hash ?? data?.id ?? data?.transaction_id,
      status: data?.status,
    });

    return res.status(200).json({
      received: true,
      transactionId: data?.hash ?? data?.id ?? data?.transaction_id ?? null,
      status: data?.status ?? null,
    });
  } catch (error) {
    console.error("Erro interno Webhook:", error);
    return res.status(200).json({ received: true, error: "Erro ao processar." });
  }
}
