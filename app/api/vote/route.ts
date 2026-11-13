import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongoose";
import { getSession } from "@/lib/auth";
import { TableTopic } from "@/models/table-topic";
import { Vote } from "@/models/vote";
import {
  sanitizeMeeting,
  validateBallot,
  VOTE_COOKIE_PREFIX,
} from "@/lib/tt-vote";

const ONE_DAY_SECONDS = 60 * 60 * 24;

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pin, first, second, third, mostImproved } = body || {};

    if (!pin) {
      return NextResponse.json(
        { error: "A session PIN is required." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const tableTopic = await TableTopic.findOne({ pin });
    if (!tableTopic) {
      return NextResponse.json({ error: "Invalid PIN." }, { status: 400 });
    }

    if (!tableTopic.isCollecting) {
      return NextResponse.json(
        { error: "Voting for this session is closed." },
        { status: 403 }
      );
    }

    const cookieStore = await cookies();
    const meetingIdForCookie = String(tableTopic._id);
    const cookieName = `${VOTE_COOKIE_PREFIX}${meetingIdForCookie}`;
    const existingVoteCookie = cookieStore.get(cookieName)?.value;

    if (existingVoteCookie) {
      return NextResponse.json(
        { error: "You have already voted for this session today." },
        { status: 429 }
      );
    }

    const validationError = validateBallot(tableTopic, {
      first,
      second,
      third,
      mostImproved,
    });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    await Vote.create({
      tableTopic: tableTopic._id,
      pin,
      first,
      second,
      third,
      mostImproved,
      votedAt: new Date(),
      source: "self",
    });

    const response = NextResponse.json({ success: true });
    const isProd = process.env.NODE_ENV === "production";
    response.cookies.set({
      name: cookieName,
      value: meetingIdForCookie,
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: ONE_DAY_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("Error submitting vote:", error);
    return NextResponse.json(
      { error: "Failed to submit vote" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tableTopicId = searchParams.get("tableTopicId");
    const pin = searchParams.get("pin");

    if (!tableTopicId && !pin) {
      return NextResponse.json(
        { error: "tableTopicId or pin is required." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const meetingQuery = pin ? { pin } : { _id: tableTopicId };
    const tableTopic = await TableTopic.findOne(meetingQuery);

    if (!tableTopic) {
      return NextResponse.json(
        { error: "Meeting not found." },
        { status: 404 }
      );
    }

    const votes = await Vote.find({ tableTopic: tableTopic._id })
      .sort({ votedAt: -1 })
      .lean();

    const results: Record<
      "first" | "second" | "third" | "mostImproved",
      Record<string, number>
    > = {
      first: {},
      second: {},
      third: {},
      mostImproved: {},
    };

    votes.forEach((vote) => {
      results.first[vote.first] = (results.first[vote.first] || 0) + 1;
      results.second[vote.second] = (results.second[vote.second] || 0) + 1;
      results.third[vote.third] = (results.third[vote.third] || 0) + 1;
      results.mostImproved[vote.mostImproved] =
        (results.mostImproved[vote.mostImproved] || 0) + 1;
    });

    return NextResponse.json({
      tableTopic: sanitizeMeeting(tableTopic),
      votes,
      results,
      totalVotes: votes.length,
    });
  } catch (error) {
    console.error("Error fetching votes:", error);
    return NextResponse.json(
      { error: "Failed to fetch votes" },
      { status: 500 }
    );
  }
}
