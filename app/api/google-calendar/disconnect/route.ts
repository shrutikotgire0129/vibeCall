import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL!,
);

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "User is not authenticated" },
        { status: 401 },
      );
    }

    await convex.mutation(
      api.googleTokens.deleteGoogleTokens,
      { userId },
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Google Calendar disconnect error:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to disconnect Google Calendar",
      },
      { status: 500 },
    );
  }
}