import { NextRequest, NextResponse } from "next/server"

// Configuração da API BuckPay
const BUCKPAY_API_URL = process.env.BUCKPAY_API_URL
const BUCKPAY_API_KEY = process.env.BUCKPAY_API_KEY
const BUCKPAY_USER_AGENT = process.env.BUCKPAY_USER_AGENT

interface CreatePixRequest {
  name: string
  email: string
  amount: number
}

interface BuckPayCreateResponse {
  id?: string
  message?: string
  error?: string | { message?: string }
  pix?: {
    qrcode_base64?: string
    code?: string
  }
  data?: {
    id?: string
    pix?: {
      qrcode_base64?: string
      code?: string
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!BUCKPAY_API_URL || !BUCKPAY_API_KEY || !BUCKPAY_USER_AGENT) {
      return NextResponse.json(
        { error: "Credenciais da API não configuradas. Configure BUCKPAY_API_URL, BUCKPAY_API_KEY e BUCKPAY_USER_AGENT." },
        { status: 500 }
      )
    }

    const body: CreatePixRequest = await request.json()

    if (!body.name || !body.email || !body.amount) {
      return NextResponse.json(
        { error: "Dados incompletos. Informe nome, email e valor." },
        { status: 400 }
      )
    }

    if (body.amount <= 0) {
      return NextResponse.json(
        { error: "O valor deve ser maior que zero." },
        { status: 400 }
      )
    }

    const response = await fetch(`${BUCKPAY_API_URL}/v1/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${BUCKPAY_API_KEY}`,
        "User-Agent": BUCKPAY_USER_AGENT,
      },
      body: JSON.stringify({
        external_id: `pix_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        payment_method: "pix",
        amount: Math.round(body.amount * 100), 
        buyer: {
          name: body.name,
          email: body.email,
        },
        postbackUrl: process.env.NEXT_PUBLIC_APP_URL 
          ? `${process.env.NEXT_PUBLIC_APP_URL}/api/pix/webhook`
          : undefined,
      }),
    })

    const contentType = response.headers.get("content-type") || ""
    const text = await response.text()

    let data: BuckPayCreateResponse | null = null
    if (contentType.includes("application/json")) {
      data = JSON.parse(text)
    } else {
      console.error("Resposta BuckPay não-JSON:", {
        status: response.status,
        contentType,
        body: text.slice(0, 1000),
      })
    }

    if (!response.ok) {
      const errorMessage =
        (data?.message || (typeof data?.error === "object" && data.error ? data.error.message : null) || (typeof data?.error === "string" ? data.error : null)) ||
        `Erro ao criar transação PIX (status ${response.status})`

      return NextResponse.json(
        { error: errorMessage, debug: contentType.includes("application/json") ? data : text },
        { status: response.status === 200 ? 502 : response.status }
      )
    }

    // Mapeia a resposta da BuckPay para o formato esperado pelo frontend
    const payload = data ?? {}
    const pixData = payload.data?.pix || payload.pix
    return NextResponse.json({
      transactionId: payload.data?.id || payload.id,
      qrCodeBase64: pixData?.qrcode_base64 || "",
      copyPaste: pixData?.code || "",
      amount: body.amount,
    })

  } catch (error) {
    console.error("Erro interno:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
