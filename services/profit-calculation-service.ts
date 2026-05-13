import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";

type ProfitInput = {
  revenue: number;
  productCost: number;
  commission: number;
  shippingCost: number;
  serviceFee: number;
  otherCosts: number;
};

export function calculateEstimatedProfit(input: ProfitInput) {
  return (
    input.revenue -
    input.productCost -
    input.commission -
    input.shippingCost -
    input.serviceFee -
    input.otherCosts
  );
}

export async function resolveCategoryCostProfile(storeId: string, categoryName?: string | null) {
  const commissionRate = categoryName
    ? await prisma.commissionRate.findFirst({
        where: {
          storeId,
          categoryName,
        },
      })
    : null;

  return {
    commissionRate: toNumber(commissionRate?.rate ?? 0),
    defaultShippingCost: toNumber(commissionRate?.shippingCost ?? 0),
    defaultServiceFee: toNumber(commissionRate?.serviceFee ?? 0),
    defaultOtherCosts: toNumber(commissionRate?.otherCosts ?? 0),
  };
}
