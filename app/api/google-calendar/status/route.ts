import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL!
);

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { connected: false },
        { status: 401 }
      );
    }

    const token = await convex.query(
      api.googleTokens.getGoogleTokens,
      { userId }
    );

    return NextResponse.json({
      connected: !!token,
    });
  } catch (error) {
    console.error("Google Calendar status error:", error);

    return NextResponse.json(
      { connected: false },
      { status: 500 }
    );
  }
}