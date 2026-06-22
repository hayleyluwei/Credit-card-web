import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const siteSetting = await prisma.siteSetting.findFirst();

    const offers = await prisma.offer.findMany({
      where: {
        isPublished: true
      },
      include: {
        category: true,
        cards: {
          include: {
            card: {
              include: {
                bank: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      offers,
      showExpiredOffers: siteSetting?.showExpiredOffers ?? false
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ error: "Failed to fetch search data" }, { status: 500 });
  }
}
