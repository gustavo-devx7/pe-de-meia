import { NextRequest, NextResponse } from "next/server"
import { queryOne } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await params

    const customer = await queryOne<{ status: string }>(
      `SELECT status FROM customers WHERE transaction_id = $1`,
      [transactionId]
    )

    if (customer) {
      const status = customer.status.toLowerCase()
      return NextResponse.json({
        transactionId,
        status,
        isPaid: status === "paid" || status === "approved" || status === "completed",
      })
    }

    return NextResponse.json({
      transactionId,
      status: "pending",
      isPaid: false,
    })
  } catch (error) {
    console.error("Erro ao consultar status:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
