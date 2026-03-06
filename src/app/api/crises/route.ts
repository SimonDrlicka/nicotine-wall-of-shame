import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProductType, RewardType } from "@prisma/client";

const productTypes = new Set(Object.values(ProductType));

const rewards: Array<{ type: RewardType; label: string }> = [
  { type: "BADGE", label: "Železná vôľa: +1 odolnosť" },
  { type: "TREAT", label: "Malá odmena: teplý čaj bez nikotínu" },
  { type: "STREAK", label: "Streak boost: jedna kríza bez pádu" },
  { type: "BADGE", label: "Čierna známka disciplíny" },
  { type: "TREAT", label: "Reward drop: 10 min chill" },
];

const pickReward = () => rewards[Math.floor(Math.random() * rewards.length)];

export async function GET() {
  const crises = await prisma.crisis.findMany({
    include: { person: true },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ crises });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json(
      { error: "Chyba v zadaní." },
      { status: 400 }
    );
  }

  const { personId, cravingType, amount, occurredAt } = body as {
    personId?: string;
    cravingType?: string;
    amount?: number;
    occurredAt?: string;
  };

  if (!personId || typeof personId !== "string") {
    return NextResponse.json(
      { error: "Vyber človeka." },
      { status: 400 }
    );
  }

  if (!cravingType || !productTypes.has(cravingType as ProductType)) {
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

  const reward = pickReward();

  const crisis = await prisma.crisis.create({
    data: {
      personId,
      cravingType: cravingType as ProductType,
      amount: Math.floor(parsedAmount),
      occurredAt: dateValue,
      rewardType: reward.type,
      rewardLabel: reward.label,
    },
    include: { person: true },
  });

  return NextResponse.json({ crisis }, { status: 201 });
}
