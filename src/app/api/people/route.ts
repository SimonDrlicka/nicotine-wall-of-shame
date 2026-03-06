import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const people = await prisma.person.findMany({
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ people });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body.name !== "string") {
    return NextResponse.json(
      { error: "Neplatné meno." },
      { status: 400 }
    );
  }

  const name = body.name.trim();

  if (name.length < 2) {
    return NextResponse.json(
      { error: "Meno musí mať aspoň 2 znaky." },
      { status: 400 }
    );
  }

  try {
    const person = await prisma.person.create({
      data: { name },
    });
    return NextResponse.json({ person }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Toto meno už existuje." },
      { status: 409 }
    );
  }
}
