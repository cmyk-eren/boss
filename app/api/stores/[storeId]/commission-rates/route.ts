import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireApiUser } from "@/services/auth-service";
import { getStoreScopedToUser } from "@/services/store-service";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const user = await requireApiUser();
    const { storeId } = await params;
    const store = await getStoreScopedToUser(storeId, user.id);
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const rates = await prisma.commissionRate.findMany({
      where: { storeId },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(
      rates.map((rate) => ({
        ...rate,
        rate: toNumber(rate.rate),
        shippingCost: toNumber(rate.shippingCost),
        serviceFee: toNumber(rate.serviceFee),
        otherCosts: toNumber(rate.otherCosts),
      })),
    );
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const user = await requireApiUser();
    const { storeId } = await params;
    const store = await getStoreScopedToUser(storeId, user.id);
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const body = await request.json();
    const rate = await prisma.commissionRate.upsert({
      where: {
        storeId_categoryName: {
          storeId,
          categoryName: body.categoryName,
        },
      },
      create: {
        storeId,
        categoryName: body.categoryName,
        rate: new Prisma.Decimal(Number(body.rate ?? 0)),
        shippingCost: new Prisma.Decimal(Number(body.shippingCost ?? 0)),
        serviceFee: new Prisma.Decimal(Number(body.serviceFee ?? 0)),
        otherCosts: new Prisma.Decimal(Number(body.otherCosts ?? 0)),
      },
      update: {
        rate: new Prisma.Decimal(Number(body.rate ?? 0)),
        shippingCost: new Prisma.Decimal(Number(body.shippingCost ?? 0)),
        serviceFee: new Prisma.Decimal(Number(body.serviceFee ?? 0)),
        otherCosts: new Prisma.Decimal(Number(body.otherCosts ?? 0)),
      },
    });

    return NextResponse.json({
      id: rate.id,
      categoryName: rate.categoryName,
      rate: toNumber(rate.rate),
      shippingCost: toNumber(rate.shippingCost),
      serviceFee: toNumber(rate.serviceFee),
      otherCosts: toNumber(rate.otherCosts),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kayıt başarısız.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
