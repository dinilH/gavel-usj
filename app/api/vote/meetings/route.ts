import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { getSession } from "@/lib/auth";
import { TableTopic } from "@/models/table-topic";
import { Vote } from "@/models/vote";
import { generatePin, sanitizeMeeting } from "@/lib/tt-vote";

export const dynamic = "force-dynamic";

type TableTopicPayload = {
  meeting_num: number;
  speakers: Array<{ name: string; points?: number }>;
  date: string;
  isCollecting?: boolean;
};

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await req.json()) as TableTopicPayload;
    const { meeting_num, speakers, date, isCollecting = true } = body || {};

    if (typeof meeting_num !== "number" || Number.isNaN(meeting_num)) {
      return NextResponse.json(
        { error: "meeting_num must be a valid number." },
        { status: 400 }
      );
    }

    if (!Array.isArray(speakers) || speakers.length < 4) {
      return NextResponse.json(
        { error: "Please provide at least four speakers." },
        { status: 400 }
      );
    }

    const hasValidSpeakers = speakers.every(
      (speaker) =>
        typeof speaker?.name === "string" && speaker.name.trim().length > 0
    );
    if (!hasValidSpeakers) {
      return NextResponse.json(
        { error: "Each speaker must include a name." },
        { status: 400 }
      );
    }

    const meetingDate = new Date(date);
    if (Number.isNaN(meetingDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existingMeeting = await TableTopic.findOne({ meeting_num });
    if (existingMeeting) {
      return NextResponse.json(
        { error: "A meeting with that meeting number already exists." },
        { status: 409 }
      );
    }

    let pin = generatePin();
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const pinInUse = await TableTopic.exists({ pin });
      if (!pinInUse) {
        break;
      }
      pin = generatePin();
    }

    const normalizedSpeakers = speakers.map((speaker) => ({
      name: speaker.name.trim(),
      points: typeof speaker.points === "number" ? speaker.points : 0,
    }));

    const tableTopic = await TableTopic.create({
      meeting_num,
      speakers: normalizedSpeakers,
      date: meetingDate,
      createdBy: session.username || "admin",
      isCollecting,
      pin,
    });

    return NextResponse.json(
      {
        message: "Meeting created successfully",
        meeting: sanitizeMeeting(tableTopic),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating meeting:", error);

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        { error: "A meeting with that meeting number or PIN already exists." },
        { status: 409 }
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create meeting" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const pin = searchParams.get("pin");

    if (pin) {
      const meeting = await TableTopic.findOne({ pin }).lean();
      if (!meeting) {
        return NextResponse.json(
          { error: "Meeting not found." },
          { status: 404 }
        );
      }

      return NextResponse.json({ meeting: sanitizeMeeting(meeting) });
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const activeOnly = searchParams.get("activeOnly") === "true";
    const query: Record<string, unknown> = {};
    if (activeOnly) {
      query.isCollecting = true;
    }

    const meetings = await TableTopic.find(query).sort({ date: -1 }).lean();

    return NextResponse.json({ meetings: meetings.map(sanitizeMeeting) });
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return NextResponse.json(
      { error: "Failed to fetch meetings" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const { meetingId, isCollecting } = body || {};

    if (!meetingId || typeof isCollecting !== "boolean") {
      return NextResponse.json(
        { error: "meetingId and isCollecting are required." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const meeting = await TableTopic.findByIdAndUpdate(
      meetingId,
      { isCollecting },
      { new: true }
    ).lean();

    if (!meeting) {
      return NextResponse.json(
        { error: "Meeting not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ meeting: sanitizeMeeting(meeting) });
  } catch (error) {
    console.error("Error updating meeting:", error);
    return NextResponse.json(
      { error: "Failed to update meeting." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const meetingId = searchParams.get("meetingId");

    if (!meetingId) {
      return NextResponse.json(
        { error: "meetingId is required." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const meeting = await TableTopic.findByIdAndDelete(meetingId).lean();

    if (!meeting) {
      return NextResponse.json(
        { error: "Meeting not found." },
        { status: 404 }
      );
    }

    await Vote.deleteMany({ tableTopic: meetingId });

    return NextResponse.json({ meeting: sanitizeMeeting(meeting) });
  } catch (error) {
    console.error("Error deleting meeting:", error);
    return NextResponse.json(
      { error: "Failed to delete meeting." },
      { status: 500 }
    );
  }
}
