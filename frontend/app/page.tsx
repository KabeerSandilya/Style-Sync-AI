import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@style-sync/backend";

export default async function IndexPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const preference = await prisma.userPreference.findUnique({ where: { userId } });

  if (!preference) {
    redirect("/onboarding");
  }

  redirect("/editor");
}
