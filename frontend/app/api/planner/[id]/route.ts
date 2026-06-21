import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@style-sync/backend";
import { UpdatePlanSchema, zodError } from "@/lib/schemas";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const plan = await prisma.outfitPlan.findUnique({ where: { id } });
    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan not found." }, { status: 404 });
    }
    if (plan.userId !== userId) {
      return NextResponse.json({ success: false, error: "Forbidden." }, { status: 403 });
    }

    await prisma.outfitPlan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/planner/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete plan." }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const plan = await prisma.outfitPlan.findUnique({ where: { id } });
    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan not found." }, { status: 404 });
    }
    if (plan.userId !== userId) {
      return NextResponse.json({ success: false, error: "Forbidden." }, { status: 403 });
    }

    const bodyResult = UpdatePlanSchema.safeParse(await req.json());
    if (!bodyResult.success) return zodError(bodyResult.error);
    const { outfitId, occasion, note } = bodyResult.data;

    if (outfitId !== undefined) {
      const outfit = await prisma.outfit.findFirst({ where: { id: outfitId, userId } });
      if (!outfit) {
        return NextResponse.json({ success: false, error: "Outfit not found." }, { status: 403 });
      }
    }

    const updated = await prisma.outfitPlan.update({
      where: { id },
      data: {
        ...(outfitId !== undefined && { outfitId }),
        ...(occasion !== undefined && { occasion }),
        ...(note !== undefined && { note }),
      },
      include: {
        outfit: {
          include: {
            garments: { include: { garment: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, plan: updated });
  } catch (error) {
    console.error("PATCH /api/planner/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to update plan." }, { status: 500 });
  }
}
