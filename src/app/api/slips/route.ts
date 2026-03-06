import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProductType } from "@prisma/client";

const productTypes = new Set(Object.values(ProductType));

export async function GET() {
  const slips = await prisma.slip.findMany({
    include: { person: true },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ slips });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json(
      { error: "Chyba v zadaní." },
      { status: 400 }
    );
  }

  const { personId, productType, amount, occurredAt } = body as {
    personId?: string;
    productType?: string;
    amount?: number;
    occurredAt?: string;
  };

  if (!personId || typeof personId !== "string") {
    return NextResponse.json(
      { error: "Vyber človeka." },
      { status: 400 }
    );
  }

  if (!productType || !productTypes.has(productType as ProductType)) {
    return NextResponse.json(
      { error: "Neplatný typ produktu." },
      { status: 400 }
    );
  }

  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return NextResponse.json(
      { error: "Zadaj platný počet." },
      { status: 400 }
    );
  }

  const dateValue = occurredAt ? new Date(occurredAt) : new Date();
  if (Number.isNaN(dateValue.getTime())) {
    return NextResponse.json(
      { error: "Neplatný dátum." },
      { status: 400 }
    );
  }

  const slip = await prisma.slip.create({
    data: {
      personId,
      productType: productType as ProductType,
      amount: Math.floor(parsedAmount),
      occurredAt: dateValue,
    },
    include: { person: true },
  });

  return NextResponse.json({ slip }, { status: 201 });
}
