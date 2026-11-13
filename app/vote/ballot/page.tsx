"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

type TableTopicMeeting = {
  _id: string;
  meeting_num: number;
  pin: string;
  date: string;
  speakers: { name: string }[];
  isCollecting: boolean;
};

type VoteSelections = {
  first: string;
  second: string;
  third: string;
  mostImproved: string;
};

const createEmptySelections = (): VoteSelections => ({
  first: "",
  second: "",
  third: "",
  mostImproved: "",
});

const TOP_THREE_FIELDS: Array<keyof VoteSelections> = [
  "first",
  "second",
  "third",
];

export default function VotePage() {
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [meeting, setMeeting] = useState<TableTopicMeeting | null>(null);
  const [selections, setSelections] = useState<VoteSelections>(
    createEmptySelections
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const speakerNames = useMemo(() => {
    if (!meeting?.speakers?.length) {
      return [];
    }

    const names = meeting.speakers
      .map((speaker) => speaker.name?.trim())
      .filter((name): name is string => Boolean(name?.length));

    return Array.from(new Set(names));
  }, [meeting]);

  const resetSelections = () => {
    setSelections(createEmptySelections());
    setSubmitError(null);
    setSubmitted(false);
    setSubmitting(false);
  };

  const handlePinSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (pin.trim().length !== 4) {
      setPinError("Please enter the four-digit PIN.");
      return;
    }

    setPinLoading(true);
    setPinError(null);

    try {
      const response = await fetch(`/api/vote/meetings?pin=${pin.trim()}`);
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setPinError(data?.error || "We couldn't find a session for that PIN.");
        return;
      }

      const data = await response.json();
      const session = data?.meeting as TableTopicMeeting | undefined;

      if (!session) {
        setPinError("We couldn't find a session for that PIN.");
        return;
      }

      if (!session.isCollecting) {
        setPinError("Voting for this session is closed right now.");
        return;
      }

      setMeeting(session);
      resetSelections();
    } catch (error) {
      console.error("Error fetching session:", error);
      setPinError("Something went wrong while looking up that PIN.");
    } finally {
      setPinLoading(false);
    }
  };

  const handleSelectionChange = (
    field: keyof VoteSelections,
    value: string
  ) => {
    setSelections((previous) => {
      const updated: VoteSelections = { ...previous, [field]: value };

      if (TOP_THREE_FIELDS.includes(field)) {
        TOP_THREE_FIELDS.forEach((otherField) => {
          if (otherField !== field && updated[otherField] === value) {
            updated[otherField] = "";
          }
        });
      }

      return updated;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!meeting) {
      setSubmitError("Enter the session PIN before submitting a ballot.");
      return;
    }

    setSubmitError(null);

    const missingTopThree = TOP_THREE_FIELDS.filter(
      (field) => !selections[field]
    );
    if (missingTopThree.length) {
      setSubmitError(
        "Please choose a different speaker for first, second, and third place."
      );
      return;
    }

    if (!selections.mostImproved) {
      setSubmitError("Pick a speaker for Most Improved.");
      return;
    }

    const uniqueTopThree = new Set(
      TOP_THREE_FIELDS.map((field) => selections[field])
    );
    if (uniqueTopThree.size < TOP_THREE_FIELDS.length) {
      setSubmitError(
        "Choose different speakers for first, second, and third place."
      );
      return;
    }

    const validSpeakers = new Set(speakerNames);
    const invalidChoice = [...TOP_THREE_FIELDS, "mostImproved"].some(
      (field) => !validSpeakers.has(selections[field as keyof VoteSelections])
    );
    if (invalidChoice) {
      setSubmitError("Please choose speakers from the list provided.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: meeting.pin,
          first: selections.first,
          second: selections.second,
          third: selections.third,
          mostImproved: selections.mostImproved,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setSubmitError(
          data?.error || "We couldn't submit your vote. Please try again."
        );
        return;
      }

      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting vote:", error);
      setSubmitError("We couldn't submit your vote. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setMeeting(null);
    setPin("");
    setPinError(null);
    setPinLoading(false);
    resetSelections();
  };

  if (submitted && meeting) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#fef4f3] px-4 py-12 text-[#3d1f1e]">
        <div className="mx-auto w-full max-w-md">
          <Card className="border border-[#f0d2d1] bg-white shadow-lg">
            <CardHeader className="space-y-3 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f8dedd]">
                <svg
                  className="h-8 w-8 text-[#821d1b]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <CardTitle className="text-3xl text-[#821d1b]">
                Vote received
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Thanks for voting for Table Topic session. Your
                ballot is recorded for today.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-lg border border-[#f0d2d1] bg-[#fdf1f0] p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Session details
                </p>
                <p className="text-lg font-semibold text-[#821d1b]">
                  #{meeting.meeting_num} Meeting 
                </p>
                <p className="text-sm text-muted-foreground">
                  Pin {meeting.pin}
                </p>
              </div>
              <div className="grid gap-2 text-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Your ballot
                </p>
                <p>
                  1st place ·{" "}
                  <span className="font-semibold text-[#821d1b]">
                    {selections.first}
                  </span>
                </p>
                <p>
                  2nd place ·{" "}
                  <span className="font-semibold text-[#821d1b]">
                    {selections.second}
                  </span>
                </p>
                <p>
                  3rd place ·{" "}
                  <span className="font-semibold text-[#821d1b]">
                    {selections.third}
                  </span>
                </p>
                <p>
                  Most improved ·{" "}
                  <span className="font-semibold text-[#821d1b]">
                    {selections.mostImproved}
                  </span>
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Link href="/vote">
                  <Button className="w-full bg-[#821d1b] text-white hover:bg-[#9b2623]">
                    Back to home
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="border-[#f0d2d1] text-[#821d1b] hover:bg-[#fdf1f0]"
                >
                  Vote in another session
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#fef4f3] px-4 py-12 text-[#3d1f1e]">
        <div className="mx-auto flex w-full max-w-md flex-col gap-6">
          <div className="space-y-2 text-center">
            <p className="inline-flex items-center justify-center rounded-full bg-[#f8dedd] px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#821d1b]">
              Enter pin
            </p>
            <h1 className="text-3xl font-semibold text-[#821d1b] sm:text-4xl">
              Start your vote
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter today’s four-digit pin to unlock the
              ballot.
            </p>
          </div>
          <Card className="border border-[#f0d2d1] bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-[#821d1b]">
                Table Topic PIN
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Only one vote can be submitted.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handlePinSubmit}>
                <div className="space-y-2">
                  <Label
                    htmlFor="pin"
                    className="text-sm font-medium text-[#5b2b2a]"
                  >
                    Enter 4 digits
                  </Label>
                  <Input
                    id="pin"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(event) => {
                      setPin(event.currentTarget.value.replace(/\D/g, ""));
                      setPinError(null);
                    }}
                    className="border-[#f0d2d1] bg-[#fdf1f0] text-center text-3xl tracking-[0.6em] text-[#821d1b] placeholder:text-[#c39a99]"
                    placeholder="0000"
                    required
                  />
                </div>
                {pinError && (
                  <p className="rounded-md bg-[#f8dedd] px-3 py-2 text-sm text-[#821d1b]">
                    {pinError}
                  </p>
                )}
                <Button
                  type="submit"
                  className="w-full bg-[#821d1b] text-base font-semibold text-white shadow-md hover:bg-[#9b2623]"
                  disabled={pinLoading}
                >
                  {pinLoading ? "Checking..." : "Continue"}
                </Button>
                <Link
                  href="/vote"
                  className="block text-center text-sm font-medium text-[#821d1b] hover:underline"
                >
                  ← Back to home
                </Link>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#fef4f3] px-4 py-10 text-[#3d1f1e]">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Table Topic #{meeting.meeting_num}
            </p>
            <h1 className="text-2xl font-semibold text-[#821d1b] sm:text-3xl">
              Cast your ballot
            </h1>
            <p className="text-sm text-muted-foreground">
              Session pin
              <span className="ml-1 font-semibold text-[#3d1f1e]">
                {meeting.pin}
              </span>
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={handleReset}
            className="h-auto border border-[#f0d2d1] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#821d1b] hover:bg-[#fdf1f0]"
          >
            Change pin
          </Button>
        </div>

        <Card className="border border-[#f0d2d1] bg-white shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle className="text-[#821d1b]">
              Vote for today’s speakers
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Choose different names for the top four spots.
            </CardDescription>
            {speakerNames.length ? (
              <div className="flex flex-wrap gap-2 pt-2 text-xs text-muted-foreground">
                {speakerNames.map((speaker) => (
                  <span
                    key={speaker}
                    className="rounded-full border border-[#f0d2d1] bg-[#fdf1f0] px-3 py-1"
                  >
                    {speaker}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                We don’t see any speaker names yet. Check back once the host
                publishes the roster.
              </p>
            )}
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <VoteSection
                title="1st Place"
                value={selections.first}
                onChange={(value) => handleSelectionChange("first", value)}
                speakers={speakerNames}
              />
              <VoteSection
                title="2nd Place"
                value={selections.second}
                onChange={(value) => handleSelectionChange("second", value)}
                speakers={speakerNames}
              />
              <VoteSection
                title="3rd Place"
                value={selections.third}
                onChange={(value) => handleSelectionChange("third", value)}
                speakers={speakerNames}
              />
              <VoteSection
                title="Most Improved"
                value={selections.mostImproved}
                onChange={(value) =>
                  handleSelectionChange("mostImproved", value)
                }
                speakers={speakerNames}
              />

              {submitError && (
                <p className="rounded-md bg-[#f8dedd] px-3 py-2 text-sm text-[#821d1b]">
                  {submitError}
                </p>
              )}

              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full bg-[#821d1b] text-base font-semibold text-white shadow-md hover:bg-[#9b2623]"
                  disabled={submitting || speakerNames.length < 3}
                >
                  {submitting
                    ? "Submitting..."
                    : speakerNames.length < 3
                    ? "Waiting on speakers"
                    : "Submit vote"}
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleReset}
                  className="w-full border-[#f0d2d1] text-[#821d1b] hover:bg-[#fdf1f0]"
                >
                  Change session
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type VoteSectionProps = {
  title: string;
  value: string;
  speakers: string[];
  onChange: (value: string) => void;
  helperText?: string;
};

function VoteSection({
  title,
  value,
  speakers,
  onChange,
  helperText,
}: VoteSectionProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-lg font-semibold text-[#3d1f1e]">{title}</Label>
        {helperText && (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        )}
      </div>
      <RadioGroup value={value} onValueChange={onChange} className="space-y-2">
        {speakers.map((speaker) => {
          const isActive = speaker === value;
          return (
            <label
              key={`${title}-${speaker}`}
              htmlFor={`${title}-${speaker}`}
              className={cn(
                "flex w-full cursor-pointer items-center justify-between rounded-xl border px-3 py-3 text-sm transition",
                isActive
                  ? "border-[#821d1b] bg-[#fbe4e3] text-[#821d1b] shadow"
                  : "border-[#f0d2d1] bg-[#fef4f3] text-[#3d1f1e] hover:border-[#d8908f] hover:bg-[#fde0df]"
              )}
            >
              <span>{speaker}</span>
              <RadioGroupItem
                value={speaker}
                id={`${title}-${speaker}`}
                className="h-5 w-5 border-[#f0d2d1] data-[state=checked]:border-[#821d1b] data-[state=checked]:bg-[#821d1b]"
              />
            </label>
          );
        })}
      </RadioGroup>
    </div>
  );
}
