import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { getSession } from "@/lib/auth";
import { TableTopic } from "@/models/table-topic";
import { Vote } from "@/models/vote";
import { sanitizeVote, validateBallot } from "@/lib/tt-vote";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const { meetingId, pin, first, second, third, mostImproved, voterName } =
      body || {};

    if (!meetingId && !pin) {
      return NextResponse.json(
        { error: "meetingId or pin is required." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const meeting = meetingId
      ? await TableTopic.findById(meetingId)
      : await TableTopic.findOne({ pin });

    if (!meeting) {
      return NextResponse.json(
        { error: "Meeting not found." },
        { status: 404 }
      );
    }

    const validationError = validateBallot(meeting, {
      first,
      second,
      third,
      mostImproved,
    });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const vote = await Vote.create({
      tableTopic: meeting._id,
      pin: meeting.pin,
      first,
      second,
      third,
      mostImproved,
      voterName: voterName?.trim() || undefined,
      votedAt: new Date(),
      source: "admin",
    });

    return NextResponse.json({ vote: sanitizeVote(vote) }, { status: 201 });
  } catch (error) {
    console.error("Error creating manual vote:", error);
    return NextResponse.json(
      { error: "Failed to create manual vote." },
      { status: 500 }
    );
  }
}
