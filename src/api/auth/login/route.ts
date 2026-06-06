import { NextRequest, NextResponse } from "next/server"
import { queryOne } from "@/lib/db"
import { setCustomerSession } from "@/lib/auth-session"
import { getCustomerAccessExpiresAt, getCustomerAccessWindowDays, isCustomerAccessExpired } from "@/lib/customer-access"

function getLoginErrorResponse(error: unknown) {
  if (!(error instanceof Error)) {
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }

  if (error.message.includes("NEON_URL")) {
    return NextResponse.json(
      { error: "Configuracao ausente no servidor.", code: "NEON_URL_MISSING" },
      { status: 500 }
    )
  }

  if (error.message.includes("NEON_URL_MISSING")) {
    return NextResponse.json(
      { error: "Configuracao ausente no servidor.", code: "NEON_URL_MISSING" },
      { status: 500 }
    )
  }

  if (error.message.includes("SESSION_SECRET")) {
    return NextResponse.json(
      { error: "Configuracao ausente no servidor.", code: "SESSION_SECRET_MISSING" },
      { status: 500 }
    )
  }

  if (error.message.toLowerCase().includes("fetch failed")) {
    return NextResponse.json(
      {
        error: "Nao foi possivel conectar ao banco de dados. Verifique a NEON_URL e se esta acessivel.",
        code: "DB_FETCH_FAILED",
      },
      { status: 500 }
    )
  }

  return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Digite um e-mail valido." }, { status: 400 })
    }

    const customer = await queryOne<{ email: string; status: string; created_at: string }>(
      `SELECT email, status, created_at FROM customers 
       WHERE email = $1 AND status = $2 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [email, "paid"]
    )

    if (!customer) {
      return NextResponse.json(
        { error: "Nao encontramos um pagamento aprovado para este e-mail." },
        { status: 403 }
      )
    }

    if (isCustomerAccessExpired(customer.created_at)) {
      return NextResponse.json(
        {
          error: `Seu acesso expirou apos ${getCustomerAccessWindowDays()} dias. Faca um novo pagamento para continuar.`,
          code: "ACCESS_EXPIRED",
        },
        { status: 403 }
      )
    }

    await setCustomerSession(customer.email, getCustomerAccessExpiresAt(customer.created_at))

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Erro no login:", error)
    return getLoginErrorResponse(error)
  }
}
