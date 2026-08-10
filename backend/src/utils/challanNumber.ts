import { PrismaClient } from '@prisma/client';

export async function generateNextChallanNumber(
  prismaTx: Omit<
    PrismaClient,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
  >
): Promise<string> {
  const lastChallan = await prismaTx.challan.findFirst({
    orderBy: {
      challanNumber: 'desc',
    },
  });

  if (!lastChallan) {
    return 'CH-000001';
  }

  const match = lastChallan.challanNumber.match(/^CH-(\d+)$/);
  if (!match) {
    // If the format is unexpected, default or count
    const count = await prismaTx.challan.count();
    return `CH-${String(count + 1).padStart(6, '0')}`;
  }

  const nextNum = parseInt(match[1], 10) + 1;
  return `CH-${String(nextNum).padStart(6, '0')}`;
}
