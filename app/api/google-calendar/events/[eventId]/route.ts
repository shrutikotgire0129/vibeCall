import { google } from "googleapis";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { auth } from "@clerk/nextjs/server";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL!
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "User is not authenticated" },
        { status: 401 },
      );
    }

    const { eventId } = await params;

    if (!eventId) {
      return NextResponse.json(
        { error: "Missing Google Calendar event ID" },
        { status: 400 },
      );
    }

    const token = await convex.query(
      api.googleTokens.getGoogleTokens,
      { userId },
    );

    if (!token) {
      return NextResponse.json(
        { error: "Google Calendar is not connected" },
        { status: 400 },
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );

    oauth2Client.setCredentials({
      access_token: token.accessToken,
      refresh_token: token.refreshToken,
      expiry_date: token.expiryDate,
    });

    const calendar = google.calendar({
      version: "v3",
      auth: oauth2Client,
    });

    const event = await calendar.events.get({
      calendarId: "primary",
      eventId,
    });

    return NextResponse.json({
      success: true,
      attendees: (event.data.attendees || [])
        .map((attendee) => attendee.email)
        .filter(Boolean),
    });
  } catch (error: any) {
    console.error(
      "Google Calendar event fetch error:",
      error,
    );

    const status = error?.code || error?.response?.status;

    if (status === 401 || status === 403) {
      try {
        const { userId } = await auth();

        if (userId) {
          await convex.mutation(
            api.googleTokens.deleteGoogleTokens,
            { userId },
          );
        }
      } catch (disconnectError) {
        console.error(
          "Failed to remove invalid Google Calendar tokens:",
          disconnectError,
        );
      }

      return NextResponse.json(
        {
          error:
            "Google Calendar authorization has expired or been revoked. Please reconnect Google Calendar.",
          connected: false,
        },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch Google Calendar event",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "User is not authenticated" },
        { status: 401 }
      );
    }

    const { eventId } = await params;

    const body = await request.json();

    const {
      title,
      description,
      startTime,
      endTime,
      meetingUrl,
      attendees,
    } = body;

    if (!eventId || !title || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required event details" },
        { status: 400 }
      );
    }

    const token = await convex.query(
      api.googleTokens.getGoogleTokens,
      { userId }
    );

    if (!token) {
      return NextResponse.json(
        { error: "Google Calendar is not connected" },
        { status: 400 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: token.accessToken,
      refresh_token: token.refreshToken,
      expiry_date: token.expiryDate,
    });

    const calendar = google.calendar({
      version: "v3",
      auth: oauth2Client,
    });

    const event = await calendar.events.update({
      calendarId: "primary",
      eventId,
      requestBody: {
        summary: title,
        description: description || "",
        start: {
          dateTime: startTime,
          timeZone: "Asia/Kolkata",
        },
        end: {
          dateTime: endTime,
          timeZone: "Asia/Kolkata",
        },
        location: meetingUrl || undefined,
        attendees: Array.isArray(attendees)
          ? attendees.map((email: string) => ({
              email,
            }))
          : [],
      },
    });

    return NextResponse.json({
      success: true,
      eventId: event.data.id,
      eventLink: event.data.htmlLink,
    });
  } catch (error: any) {
  console.error("Google Calendar event update error:", error);

  const status = error?.code || error?.response?.status;

  if (status === 401 || status === 403) {
    try {
      const { userId } = await auth();

      if (userId) {
        await convex.mutation(
          api.googleTokens.deleteGoogleTokens,
          { userId },
        );
      }
    } catch (disconnectError) {
        console.error(
          "Failed to remove invalid Google Calendar tokens:",
          disconnectError,
        );
      }

      return NextResponse.json(
        {
          error:
            "Google Calendar authorization has expired or been revoked. Please reconnect Google Calendar.",
          connected: false,
        },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to update Google Calendar event",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "User is not authenticated" },
        { status: 401 }
      );
    }

    const { eventId } = await params;

    if (!eventId) {
      return NextResponse.json(
        { error: "Missing Google Calendar event ID" },
        { status: 400 }
      );
    }

    const token = await convex.query(
      api.googleTokens.getGoogleTokens,
      { userId }
    );

    if (!token) {
      return NextResponse.json(
        { error: "Google Calendar is not connected" },
        { status: 400 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: token.accessToken,
      refresh_token: token.refreshToken,
      expiry_date: token.expiryDate,
    });

    const calendar = google.calendar({
      version: "v3",
      auth: oauth2Client,
    });

    await calendar.events.delete({
      calendarId: "primary",
      eventId,
    });

    const { searchParams } = new URL(request.url);
    const callId = searchParams.get("callId");

    if (callId) {
      await convex.mutation(
        api.googleTokens.deleteGoogleCalendarEvent,
        { callId }
      ); 
    }

    return NextResponse.json({
      success: true,
    });
    } catch (error: any) {
        console.error(
          "Google Calendar event deletion error:",
          error
        );

        const status = error?.code || error?.response?.status;

        if (status === 401 || status === 403) {
          try {
            const { userId } = await auth();

            if (userId) {
              await convex.mutation(
                api.googleTokens.deleteGoogleTokens,
                { userId },
              );
            }
          } catch (disconnectError) {
            console.error(
              "Failed to remove invalid Google Calendar tokens:",
              disconnectError,
            );
          }

          return NextResponse.json(
            {
              error:
                "Google Calendar authorization has expired or been revoked. Please reconnect Google Calendar.",
              connected: false,
            },
            { status: 401 },
          );
        }

        return NextResponse.json(
          {
            error: "Failed to delete Google Calendar event",
          },
          { status: 500 }
        );
      }
}