import type { ITableTopic } from "@/models/table-topic";

export const VOTE_COOKIE_PREFIX = "tt_vote_";

export function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function sanitizeMeeting(meeting: any) {
  return {
    _id: meeting._id?.toString?.(),
    meeting_num: meeting.meeting_num,
    pin: meeting.pin,
    speakers: meeting.speakers,
    date: meeting.date,
    isCollecting: meeting.isCollecting,
    createdAt: meeting.createdAt,
    updatedAt: meeting.updatedAt,
  };
}

export function sanitizeVote(vote: any) {
  return {
    _id: vote._id?.toString?.(),
    tableTopic: vote.tableTopic?.toString?.(),
    pin: vote.pin,
    first: vote.first,
    second: vote.second,
    third: vote.third,
    mostImproved: vote.mostImproved,
    votedAt: vote.votedAt,
    voterName: vote.voterName,
    source: vote.source,
  };
}

export function getSpeakerNames(
  meeting: Pick<ITableTopic, "speakers">
): string[] {
  return Array.from(
    new Set(
      (meeting.speakers ?? [])
        .map((speaker) => speaker.name?.trim())
        .filter((name): name is string => Boolean(name))
    )
  );
}

type Ballot = {
  first?: string;
  second?: string;
  third?: string;
  mostImproved?: string;
};

export function validateBallot(
  meeting: Pick<ITableTopic, "speakers">,
  ballot: Ballot
): string | null {
  const { first, second, third, mostImproved } = ballot;

  if (!first || !second || !third || !mostImproved) {
    return "All vote fields are required.";
  }

  if (new Set([first, second, third]).size !== 3) {
    return "1st, 2nd, and 3rd place must be different speakers.";
  }

  const speakerNames = new Set(getSpeakerNames(meeting));
  const selections = [first, second, third, mostImproved];

  if (selections.some((name) => !speakerNames.has(name))) {
    return "Please choose speakers from the list provided.";
  }

  return null;
}
