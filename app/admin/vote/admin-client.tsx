"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Search } from "lucide-react";
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

type Speaker = {
  name: string;
  points?: number;
};

type TableTopicSummary = {
  _id: string;
  meeting_num: number;
  pin: string;
  date: string;
  speakers: Speaker[];
  isCollecting: boolean;
  createdAt?: string;
};

type VoteResults = {
  first: Record<string, number>;
  second: Record<string, number>;
  third: Record<string, number>;
  mostImproved: Record<string, number>;
};

type ManualVoteForm = {
  voterName: string;
  first: string;
  second: string;
  third: string;
  mostImproved: string;
};
const DEFAULT_SPEAKER_COUNT = 4;
const SESSIONS_PER_PAGE = 3;

const formatMeetingDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, { dateStyle: "long" });

const toDateInputValue = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const createEmptySpeakers = () =>
  Array.from({ length: DEFAULT_SPEAKER_COUNT }, () => ({ name: "" }));

const emptyManualVote: ManualVoteForm = {
  voterName: "",
  first: "",
  second: "",
  third: "",
  mostImproved: "",
};

export function TableTopicsAdmin({ username }: { username: string }) {
  const router = useRouter();

  const [meetings, setMeetings] = useState<TableTopicSummary[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(
    null
  );
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [results, setResults] = useState<VoteResults | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  const fetchResultsRef = useRef<
    ((meetingId: string, silent?: boolean) => Promise<void>) | null
  >(null);

  const [manualVoteSession, setManualVoteSession] =
    useState<TableTopicSummary | null>(null);
  const [manualVoteForm, setManualVoteForm] =
    useState<ManualVoteForm>(emptyManualVote);
  const [manualVoteSubmitting, setManualVoteSubmitting] = useState(false);
  const [manualVoteError, setManualVoteError] = useState<string | null>(null);

  const [createMeetingForm, setCreateMeetingForm] = useState({
    meeting_num: "",
    date: "",
    speakers: createEmptySpeakers(),
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdMeeting, setCreatedMeeting] =
    useState<TableTopicSummary | null>(null);

  const [sessionSearchTerm, setSessionSearchTerm] = useState("");
  const [sessionDateFilter, setSessionDateFilter] = useState("");
  const [currentSessionPage, setCurrentSessionPage] = useState(1);
  const sortedMeetings = useMemo(
    () =>
      [...meetings].sort((a, b) => {
        const aCreated =
          a.createdAt && !Number.isNaN(Date.parse(a.createdAt))
            ? new Date(a.createdAt).getTime()
            : new Date(a.date).getTime();
        const bCreated =
          b.createdAt && !Number.isNaN(Date.parse(b.createdAt))
            ? new Date(b.createdAt).getTime()
            : new Date(b.date).getTime();
        return bCreated - aCreated;
      }),
    [meetings]
  );

  const filteredMeetings = useMemo(() => {
    const term = sessionSearchTerm.trim().toLowerCase();

    return sortedMeetings.filter((meeting) => {
      const matchesTerm = term
        ? (() => {
            const meetingNumber = meeting.meeting_num.toString();
            const dateLabel = formatMeetingDate(meeting.date).toLowerCase();
            const pin = meeting.pin.toLowerCase();
            const speakerMatch = meeting.speakers.some((speaker) =>
              speaker.name.toLowerCase().includes(term)
            );

            return (
              meetingNumber.includes(term) ||
              dateLabel.includes(term) ||
              pin.includes(term) ||
              speakerMatch
            );
          })()
        : true;

      const matchesDate = sessionDateFilter
        ? toDateInputValue(meeting.date) === sessionDateFilter
        : true;

      return matchesTerm && matchesDate;
    });
  }, [sortedMeetings, sessionSearchTerm, sessionDateFilter]);

  const totalSessionPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredMeetings.length / SESSIONS_PER_PAGE));
  }, [filteredMeetings]);

  const paginatedMeetings = useMemo(() => {
    const startIndex = (currentSessionPage - 1) * SESSIONS_PER_PAGE;
    return filteredMeetings.slice(startIndex, startIndex + SESSIONS_PER_PAGE);
  }, [filteredMeetings, currentSessionPage]);

  const selectedMeeting = useMemo(() => {
    return (
      meetings.find((meeting) => meeting._id === selectedMeetingId) || null
    );
  }, [meetings, selectedMeetingId]);

  const shouldEnableLiveUpdates = Boolean(selectedMeeting?.isCollecting);

  const liveTrackingAvailable = Boolean(selectedMeeting?.isCollecting);

  const fetchResults = useCallback(async (meetingId: string, silent = false) => {
    if (!silent) {
      setResultsLoading(true);
    }
    try {
      const response = await fetch(`/api/vote?tableTopicId=${meetingId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) {
          setResults(null);
          setTotalVotes(0);
          return;
        }
        throw new Error("Failed to load results");
      }
      const data = await response.json();
      setResults(data.results || null);
      setTotalVotes(data.totalVotes || 0);
    } catch (error) {
      console.error("Error fetching results:", error);
      setResults(null);
      setTotalVotes(0);
    } finally {
      if (!silent) {
        setResultsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchResultsRef.current = fetchResults;
  }, [fetchResults]);

  useEffect(() => {
    if (selectedMeetingId) {
      fetchResults(selectedMeetingId);
    }
  }, [selectedMeetingId, fetchResults]);

  useEffect(() => {
    setCurrentSessionPage(1);
  }, [sessionSearchTerm, sessionDateFilter]);

  useEffect(() => {
    if (currentSessionPage > totalSessionPages) {
      setCurrentSessionPage(totalSessionPages);
    }
  }, [currentSessionPage, totalSessionPages]);

  useEffect(() => {
    if (filteredMeetings.length === 0) {
      if (selectedMeetingId !== null) {
        setSelectedMeetingId(null);
        setResults(null);
        setTotalVotes(0);
      }
      return;
    }

    const hasSelected = selectedMeetingId
      ? filteredMeetings.some((meeting) => meeting._id === selectedMeetingId)
      : false;

    if (!hasSelected) {
      setSelectedMeetingId(filteredMeetings[0]._id);
    }
  }, [filteredMeetings, selectedMeetingId]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-session-menu]") && openMenuId) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, [openMenuId]);

  useEffect(() => {
    if (!shouldEnableLiveUpdates || !selectedMeetingId) {
      setIsLiveConnected(false);
      return;
    }

    setIsLiveConnected(true);
    const interval = window.setInterval(() => {
      void fetchResultsRef.current?.(selectedMeetingId, true);
    }, 5000);

    return () => {
      window.clearInterval(interval);
      setIsLiveConnected(false);
    };
  }, [selectedMeetingId, shouldEnableLiveUpdates]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
    });
    router.push("/admin");
    router.refresh();
  };

  const fetchMeetings = useCallback(async () => {
    setMeetingsLoading(true);
    try {
      const response = await fetch("/api/vote/meetings", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to load meetings");
      }
      const data = await response.json();
      setMeetings(data.meetings || []);
    } catch (error) {
      console.error("Error fetching meetings:", error);
    } finally {
      setMeetingsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMeetings();
  }, [fetchMeetings]);

  const updateSpeakerName = (index: number, value: string) => {
    setCreateMeetingForm((prev) => {
      const updated = [...prev.speakers];
      updated[index] = { ...updated[index], name: value };
      return { ...prev, speakers: updated };
    });
  };

  const addSpeaker = () => {
    setCreateMeetingForm((prev) => ({
      ...prev,
      speakers: [...prev.speakers, { name: "" }],
    }));
  };

  const removeSpeaker = (index: number) => {
    setCreateMeetingForm((prev) => ({
      ...prev,
      speakers: prev.speakers.filter((_, idx) => idx !== index),
    }));
  };

  const handleCreateMeeting = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError(null);
    setCreatedMeeting(null);

    const meetingNumber = Number(createMeetingForm.meeting_num);
    if (!meetingNumber || Number.isNaN(meetingNumber)) {
      setCreateError("Please provide a valid meeting number.");
      return;
    }

    if (!createMeetingForm.date) {
      setCreateError("Please choose a meeting date.");
      return;
    }

    const filteredSpeakers = createMeetingForm.speakers.filter(
      (speaker) => speaker.name.trim().length > 0
    );

    if (filteredSpeakers.length < DEFAULT_SPEAKER_COUNT) {
      setCreateError("Please add at least four speakers.");
      return;
    }

    setCreateSubmitting(true);
    try {
      const response = await fetch("/api/vote/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          meeting_num: meetingNumber,
          date: createMeetingForm.date,
          speakers: filteredSpeakers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCreateError(data.error || "Failed to create meeting.");
        return;
      }

      setCreatedMeeting(data.meeting);
      setCreateMeetingForm({
        meeting_num: "",
        date: "",
        speakers: createEmptySpeakers(),
      });
      await fetchMeetings();
      setSelectedMeetingId(data.meeting?._id || null);
    } catch (error) {
      console.error("Error creating meeting:", error);
      setCreateError("Unexpected error. Please try again.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const toggleCollection = async (meeting: TableTopicSummary) => {
    try {
      const response = await fetch("/api/vote/meetings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          meetingId: meeting._id,
          isCollecting: !meeting.isCollecting,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update session");
      }

      setMeetings((prev) =>
        prev.map((item) =>
          item._id === meeting._id ? { ...item, ...data.meeting } : item
        )
      );
      if (selectedMeetingId === meeting._id) {
        setSelectedMeetingId(meeting._id);
      }
    } catch (error) {
      console.error("Error updating session:", error);
      alert("Unable to update the session status right now.");
    }
  };

  const deleteMeeting = async (meeting: TableTopicSummary) => {
    if (!window.confirm("Delete this session and its votes?")) {
      return;
    }

    try {
      const response = await fetch(`/api/vote/meetings?meetingId=${meeting._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete session");
      }

      setMeetings((prev) => prev.filter((item) => item._id !== meeting._id));
      if (selectedMeetingId === meeting._id) {
        setSelectedMeetingId(null);
        setResults(null);
        setTotalVotes(0);
      }
      if (createdMeeting?._id === meeting._id) {
        setCreatedMeeting(null);
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      alert("Unable to delete the session right now.");
    }
  };

  const openManualVoteModal = (meeting: TableTopicSummary) => {
    setManualVoteSession(meeting);
    setManualVoteForm(emptyManualVote);
    setManualVoteError(null);
    setOpenMenuId(null);
  };

  const handleManualVoteSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!manualVoteSession) {
      return;
    }

    setManualVoteError(null);
    setManualVoteSubmitting(true);
    try {
      const response = await fetch("/api/vote/manual-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          meetingId: manualVoteSession._id,
          first: manualVoteForm.first,
          second: manualVoteForm.second,
          third: manualVoteForm.third,
          mostImproved: manualVoteForm.mostImproved,
          voterName: manualVoteForm.voterName,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setManualVoteError(data.error || "Unable to record this vote.");
        return;
      }

      if (selectedMeetingId === manualVoteSession._id) {
        await fetchResults(manualVoteSession._id);
      }
      setManualVoteSession(null);
      setManualVoteForm(emptyManualVote);
    } catch (error) {
      console.error("Error adding manual vote:", error);
      setManualVoteError("Unexpected error. Please try again.");
    } finally {
      setManualVoteSubmitting(false);
    }
  };

  type PlacementWinner = {
    name: string;
    votes: number;
    tieBreaker: string | null;
  };

  const resolvePlacementWinner = (
    primary?: Record<string, number>,
    tieBreakers: { map?: Record<string, number>; label: string }[] = [],
    excludeNames: Set<string> = new Set()
  ): PlacementWinner | null => {
    if (!primary || Object.keys(primary).length === 0) {
      return null;
    }

    const candidateNames = Object.keys(primary).filter(
      (name) => !excludeNames.has(name)
    );

    if (candidateNames.length === 0) {
      return null;
    }

    const buildMetrics = (name: string) => [
      primary[name] ?? 0,
      ...tieBreakers.map((tieBreaker) => tieBreaker.map?.[name] ?? 0),
    ];

    const candidates = candidateNames.map((name) => ({
      name,
      metrics: buildMetrics(name),
    }));

    candidates.sort((candidateA, candidateB) => {
      for (let index = 0; index < candidateA.metrics.length; index += 1) {
        const diff = candidateB.metrics[index] - candidateA.metrics[index];
        if (diff !== 0) {
          return diff;
        }
      }
      return 0;
    });

    const winner = candidates[0];
    if (!winner) {
      return null;
    }

    const runner = candidates[1];
    if (runner) {
      const allEqual = winner.metrics.every(
        (value, index) => value === runner.metrics[index]
      );
      if (allEqual) {
        return null;
      }
    }

    let tieBreakerUsed: string | null = null;
    if (runner) {
      for (let index = 0; index < winner.metrics.length; index += 1) {
        const winnerScore = winner.metrics[index];
        const runnerScore = runner.metrics[index];
        if (winnerScore !== runnerScore) {
          if (index > 0) {
            tieBreakerUsed = tieBreakers[index - 1]?.label ?? null;
          }
          break;
        }
      }
    }

    return {
      name: winner.name,
      votes: winner.metrics[0],
      tieBreaker: tieBreakerUsed,
    };
  };

  const resolvedWinnerNames = new Set<string>();

  const firstPlaceWinner = resolvePlacementWinner(
    results?.first,
    [
      { map: results?.second, label: "second-place votes" },
      { map: results?.third, label: "third-place votes" },
    ],
    resolvedWinnerNames
  );
  if (firstPlaceWinner) {
    resolvedWinnerNames.add(firstPlaceWinner.name);
  }

  const secondPlaceWinner = resolvePlacementWinner(
    results?.second,
    [
      { map: results?.third, label: "third-place votes" },
      { map: results?.first, label: "first-place votes" },
    ],
    resolvedWinnerNames
  );
  if (secondPlaceWinner) {
    resolvedWinnerNames.add(secondPlaceWinner.name);
  }

  const thirdPlaceWinner = resolvePlacementWinner(
    results?.third,
    [
      { map: results?.first, label: "first-place votes" },
      { map: results?.second, label: "second-place votes" },
    ],
    resolvedWinnerNames
  );
  if (thirdPlaceWinner) {
    resolvedWinnerNames.add(thirdPlaceWinner.name);
  }

  const mostImprovedWinner = resolvePlacementWinner(
    results?.mostImproved,
    [
      { map: results?.first, label: "first-place votes" },
      { map: results?.second, label: "second-place votes" },
      { map: results?.third, label: "third-place votes" },
    ],
    resolvedWinnerNames
  );
  if (mostImprovedWinner) {
    resolvedWinnerNames.add(mostImprovedWinner.name);
  }

  const renderResults = (data?: Record<string, number>) => {
    if (!data || Object.keys(data).length === 0) {
      return (
        <p className="rounded-md border border-[#f0d2d1] bg-[#fef4f3] px-3 py-2 text-sm text-muted-foreground">
          No votes recorded yet.
        </p>
      );
    }

    const sortedEntries = Object.entries(data).sort(([, a], [, b]) => b - a);
    const totalVotesForSlot = sortedEntries.reduce(
      (sum, [, count]) => sum + count,
      0
    );

    return (
      <div className="space-y-3">
        {sortedEntries.map(([name, count], index) => {
          const percentage = totalVotesForSlot
            ? Math.round((count / totalVotesForSlot) * 100)
            : 0;
          return (
            <div key={name} className="space-y-1">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-medium text-[#3d1f1e]">
                  {index + 1}. {name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {count} {count === 1 ? "vote" : "votes"} ({percentage}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#f0d2d1]/60">
                <div
                  className="h-full rounded-full bg-[#821d1b]"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const placementCards = [
    {
      key: "first",
      title: "1st Place",
      winner: firstPlaceWinner,
      data: results?.first,
    },
    {
      key: "second",
      title: "2nd Place",
      winner: secondPlaceWinner,
      data: results?.second,
    },
    {
      key: "third",
      title: "3rd Place",
      winner: thirdPlaceWinner,
      data: results?.third,
    },
    {
      key: "mostImproved",
      title: "Most Improved",
      winner: mostImprovedWinner,
      data: results?.mostImproved,
    },
  ] as const;

  return (
    <div className="min-h-screen bg-[#fef9f9] px-4 py-10 text-[#3d1f1e]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 rounded-2xl bg-white/60 p-6 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#821d1b]">
              Table Topics HQ
            </p>
            <h1 className="text-3xl font-semibold sm:text-4xl">
              Welcome back, {username}
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage sessions, monitor live results, and share voting pins
              instantly.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className="hidden sm:inline-flex">
              <Button
                variant="outline"
                className="border-[#f0d2d1] bg-white text-[#3d1f1e] hover:bg-[#fef0ef]"
              >
                Home
              </Button>
            </Link>
            <Link href="/admin/dashboard" className="hidden sm:inline-flex">
              <Button
                variant="outline"
                className="border-[#f0d2d1] bg-white text-[#3d1f1e] hover:bg-[#fef0ef]"
              >
                Admin dashboard
              </Button>
            </Link>
            <Link href="/vote/ballot" className="hidden sm:inline-flex">
              <Button
                variant="outline"
                className="border-[#f0d2d1] bg-white text-[#3d1f1e] hover:bg-[#fef0ef]"
              >
                Voting page
              </Button>
            </Link>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-[#f0d2d1] bg-white text-[#821d1b] hover:bg-[#fef0ef]"
            >
              Sign out
            </Button>
          </div>
        </header>

        {createdMeeting && (
          <Card className="border border-[#f0d2d1] bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#3d1f1e]">
                Table Topic Ready to Share
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Share the pin below with members to open voting for meeting #{" "}
                {createdMeeting.meeting_num}.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#821d1b]">
                  Meeting PIN
                </p>
                <p className="text-4xl font-bold text-[#821d1b] sm:text-5xl">
                  {createdMeeting.pin}
                </p>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Scheduled for {formatMeetingDate(createdMeeting.date)}</p>
                <p>{createdMeeting.speakers.length} speakers registered</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border border-[#f0d2d1] bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#3d1f1e]">
                Create a Table Topic Session
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Set the meeting details and speakers. A fresh voting pin is
                created automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleCreateMeeting}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label
                      htmlFor="meeting-num"
                      className="text-sm font-medium text-[#3d1f1e]"
                    >
                      Meeting Number
                    </Label>
                    <Input
                      id="meeting-num"
                      inputMode="numeric"
                      value={createMeetingForm.meeting_num}
                      onChange={(event) =>
                        setCreateMeetingForm((prev) => ({
                          ...prev,
                          meeting_num: event.target.value,
                        }))
                      }
                      placeholder="e.g. 128"
                      className="border-[#f0d2d1] bg-white focus-visible:ring-[#821d1b] focus-visible:ring-offset-2"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="meeting-date"
                      className="text-sm font-medium text-[#3d1f1e]"
                    >
                      Meeting Date
                    </Label>
                    <Input
                      id="meeting-date"
                      type="date"
                      value={createMeetingForm.date}
                      onChange={(event) =>
                        setCreateMeetingForm((prev) => ({
                          ...prev,
                          date: event.target.value,
                        }))
                      }
                      className="border-[#f0d2d1] bg-white focus-visible:ring-[#821d1b] focus-visible:ring-offset-2"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-[#3d1f1e]">
                      Speakers
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-auto px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#821d1b] hover:bg-[#fef0ef]"
                      onClick={addSpeaker}
                    >
                      Add Speaker
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {createMeetingForm.speakers.map((speaker, index) => (
                      <div
                        key={`speaker-${index}`}
                        className="flex flex-col gap-2 rounded-lg border border-[#f0d2d1] bg-[#fef9f9] p-3 sm:flex-row sm:items-center"
                      >
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Speaker {index + 1}
                          </Label>
                          <Input
                            value={speaker.name}
                            onChange={(event) =>
                              updateSpeakerName(index, event.target.value)
                            }
                            placeholder="Full name"
                            className="border-[#f0d2d1] bg-white focus-visible:ring-[#821d1b] focus-visible:ring-offset-2"
                            required={index < DEFAULT_SPEAKER_COUNT}
                          />
                        </div>
                        {createMeetingForm.speakers.length >
                          DEFAULT_SPEAKER_COUNT && (
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-9 px-3 text-sm text-[#821d1b] hover:bg-[#fef0ef]"
                            onClick={() => removeSpeaker(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {createError && (
                  <p className="rounded-md border border-[#f0d2d1] bg-[#fef0ef] px-3 py-2 text-sm text-[#821d1b]">
                    {createError}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full bg-[#821d1b] text-base font-semibold text-white shadow-lg hover:bg-[#9b2623]"
                  disabled={createSubmitting}
                >
                  {createSubmitting ? "Creating session..." : "Create session"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border border-[#f0d2d1] bg-white shadow-lg">
            <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle className="text-[#3d1f1e]">
                  Session Overview
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Tap a session for details, pause collection, or manage votes.
                </CardDescription>
              </div>
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={sessionSearchTerm}
                    onChange={(event) =>
                      setSessionSearchTerm(event.target.value)
                    }
                    placeholder="Search sessions"
                    aria-label="Search sessions"
                    className="pl-10 border-[#f0d2d1] bg-white focus-visible:ring-[#821d1b] focus-visible:ring-offset-2"
                  />
                </div>
                <div className="w-full sm:w-48">
                  <Label htmlFor="session-date-filter" className="sr-only">
                    Filter by date
                  </Label>
                  <Input
                    id="session-date-filter"
                    type="date"
                    value={sessionDateFilter}
                    onChange={(event) =>
                      setSessionDateFilter(event.target.value)
                    }
                    aria-label="Filter sessions by date"
                    className="border-[#f0d2d1] bg-white focus-visible:ring-[#821d1b] focus-visible:ring-offset-2"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4">
                {meetingsLoading && (
                  <div className="flex items-center gap-2 rounded-lg border border-[#f0d2d1] bg-[#fef4f3] px-3 py-2 text-sm text-muted-foreground">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#821d1b] border-t-transparent" />
                    Loading sessions...
                  </div>
                )}

                {!meetingsLoading && meetings.length === 0 && (
                  <p className="rounded-lg border border-dashed border-[#f0d2d1] bg-[#fef9f9] px-4 py-8 text-center text-sm text-muted-foreground">
                    No sessions yet. Create your first table topic to begin
                    collecting votes.
                  </p>
                )}

                {!meetingsLoading &&
                  meetings.length > 0 &&
                  filteredMeetings.length === 0 && (
                    <p className="rounded-lg border border-dashed border-[#f0d2d1] bg-[#fef9f9] px-4 py-6 text-center text-sm text-muted-foreground">
                      No sessions match your search right now.
                    </p>
                  )}

                {!meetingsLoading &&
                  filteredMeetings.length > 0 &&
                  paginatedMeetings.map((meeting) => {
                    const isActive = meeting._id === selectedMeetingId;
                    return (
                      <div
                        key={meeting._id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedMeetingId(meeting._id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedMeetingId(meeting._id);
                          }
                        }}
                        className={`group flex w-full flex-col gap-3 rounded-xl border p-4 transition ${
                          isActive
                            ? "border-[#821d1b] bg-[#fef0ef] shadow-lg"
                            : "border-[#f0d2d1] bg-white hover:border-[#821d1b]/60"
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#821d1b]">
                              Meeting #{meeting.meeting_num}
                            </p>
                            <p className="text-lg font-semibold text-[#3d1f1e]">
                              {formatMeetingDate(meeting.date)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {meeting.speakers.length} speakers registered
                            </p>
                          </div>
                          <div
                            className="flex items-center gap-2"
                            data-session-menu
                          >
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleCollection(meeting);
                              }}
                              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                                meeting.isCollecting
                                  ? "bg-[#821d1b] text-white"
                                  : "border border-[#f0d2d1] bg-white text-muted-foreground hover:border-[#821d1b]/60"
                              }`}
                            >
                              {meeting.isCollecting ? "Collecting" : "Closed"}
                            </button>
                            <div className="relative" data-session-menu>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setOpenMenuId((prev) =>
                                    prev === meeting._id ? null : meeting._id
                                  );
                                }}
                                className="rounded-full border border-[#f0d2d1] bg-white p-2 text-[#821d1b] hover:bg-[#fef0ef]"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                              {openMenuId === meeting._id && (
                                <div
                                  className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-[#f0d2d1] bg-white p-2 text-sm shadow-xl"
                                  data-session-menu
                                >
                                  <button
                                    type="button"
                                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[#3d1f1e] hover:bg-[#fef0ef]"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openManualVoteModal(meeting);
                                    }}
                                  >
                                    Add manual vote
                                  </button>
                                  <button
                                    type="button"
                                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[#821d1b] hover:bg-[#fef0ef]"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      deleteMeeting(meeting);
                                    }}
                                  >
                                    Delete session
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="rounded-full border border-[#f0d2d1] bg-[#fef9f9] px-3 py-1 font-medium text-[#821d1b]">
                            PIN {meeting.pin}
                          </span>
                          {meeting.speakers
                            .slice(0, 4)
                            .map((speaker, index) => (
                              <span
                                key={`${meeting._id}-${index}-${speaker.name}`}
                                className="rounded-full border border-[#f0d2d1] bg-white px-3 py-1 text-[#3d1f1e]"
                              >
                                {speaker.name}
                              </span>
                            ))}
                          {meeting.speakers.length > 4 && (
                            <span className="rounded-full border border-[#f0d2d1] bg-white px-3 py-1 text-[#3d1f1e]">
                              +{meeting.speakers.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
              {filteredMeetings.length > 0 && (
                <div className="flex flex-col gap-3 border-t border-[#f0d2d1] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Showing{" "}
                    {Math.min(
                      filteredMeetings.length,
                      (currentSessionPage - 1) * SESSIONS_PER_PAGE + 1
                    )}
                    -
                    {Math.min(
                      filteredMeetings.length,
                      currentSessionPage * SESSIONS_PER_PAGE
                    )}
                    of {filteredMeetings.length} sessions
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentSessionPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentSessionPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm font-medium text-[#3d1f1e]">
                      Page {currentSessionPage} of {totalSessionPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentSessionPage((prev) =>
                          Math.min(totalSessionPages, prev + 1)
                        )
                      }
                      disabled={
                        currentSessionPage === totalSessionPages ||
                        filteredMeetings.length === 0
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card className="border border-[#f0d2d1] bg-white shadow-lg">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-[#3d1f1e]">Live Results</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Track voting progress for the selected session in real time.
                </CardDescription>
              </div>
              <div className="flex flex-col items-end gap-2 text-right text-sm text-muted-foreground">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#3d1f1e]">
                  <span>Live tracking</span>
                  {shouldEnableLiveUpdates ? (
                    <span
                      className="flex items-center gap-1 text-[#821d1b]"
                      aria-live="polite"
                    >
                      <span className="sr-only">
                        {isLiveConnected ? "Auto-refresh active" : "Connecting"}
                      </span>
                      {[0, 1, 2].map((dot) => (
                        <span
                          key={dot}
                          className="h-1.5 w-1.5 rounded-full bg-current opacity-80 animate-pulse"
                          style={{ animationDelay: `${dot * 0.15}s` }}
                        />
                      ))}
                    </span>
                  ) : (
                    <span className="rounded-full border border-[#f0d2d1] bg-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
                      {liveTrackingAvailable ? "Paused" : "Idle"}
                    </span>
                  )}
                </div>
                <div>
                  Total votes:{" "}
                  <span className="font-semibold text-[#821d1b]">
                    {totalVotes}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {resultsLoading && (
                <div className="flex items-center gap-2 rounded-lg border border-[#f0d2d1] bg-[#fef4f3] px-3 py-2 text-sm text-muted-foreground">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#821d1b] border-t-transparent" />
                  Fetching latest votes...
                </div>
              )}

              {!resultsLoading && !results && (
                <p className="rounded-lg border border-dashed border-[#f0d2d1] bg-[#fef9f9] px-4 py-6 text-center text-sm text-muted-foreground">
                  Select a session to see the voting breakdown.
                </p>
              )}

              {!resultsLoading && results && (
                <div className="grid gap-5 md:grid-cols-2">
                  {placementCards.map((card) => {
                    const hasVotes =
                      !!card.data && Object.keys(card.data).length > 0;

                    return (
                      <div
                        key={card.key}
                        className="flex h-full flex-col rounded-2xl border border-[#f0d2d1] bg-[#fef9f9] p-5 shadow-sm"
                      >
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#821d1b]">
                            {card.title}
                          </p>
                          {hasVotes ? (
                            card.winner ? (
                              <div className="mt-3 space-y-1">
                                <p className="text-lg font-semibold text-[#3d1f1e]">
                                  {card.winner.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {card.winner.votes}{" "}
                                  {card.winner.votes === 1 ? "vote" : "votes"}
                                </p>
                                {card.winner.tieBreaker && (
                                  <p className="text-xs text-muted-foreground">
                                    Tie resolved via {card.winner.tieBreaker}.
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="mt-3 text-sm text-muted-foreground">
                                Tie remains unresolved — additional votes
                                required.
                              </p>
                            )
                          ) : (
                            <p className="mt-3 text-sm text-muted-foreground">
                              No votes recorded yet.
                            </p>
                          )}
                        </div>
                        <div className="mt-4 flex-1">
                          {hasVotes ? renderResults(card.data) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {manualVoteSession && (
        <ManualVoteModal
          meeting={manualVoteSession}
          form={manualVoteForm}
          onChange={setManualVoteForm}
          onClose={() => {
            setManualVoteSession(null);
            setManualVoteError(null);
          }}
          onSubmit={handleManualVoteSubmit}
          submitting={manualVoteSubmitting}
          error={manualVoteError}
        />
      )}
    </div>
  );
}

type ManualVoteModalProps = {
  meeting: TableTopicSummary;
  form: ManualVoteForm;
  onChange: (updater: ManualVoteForm) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitting: boolean;
  error: string | null;
};

function ManualVoteModal({
  meeting,
  form,
  onChange,
  onClose,
  onSubmit,
  submitting,
  error,
}: ManualVoteModalProps) {
  const speakerNames = meeting.speakers.map((speaker) => speaker.name);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      data-modal="manual-vote"
    >
      <div className="w-full max-w-lg rounded-2xl border border-[#f0d2d1] bg-white p-6 text-[#3d1f1e] shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold">Manual vote</h2>
            <p className="text-sm text-muted-foreground">
              Meeting #{meeting.meeting_num} · PIN {meeting.pin}
            </p>
            <p className="text-xs text-muted-foreground">
              Use this for members unable to access the app.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#f0d2d1] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#821d1b] hover:bg-[#fef0ef]"
          >
            Close
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label
              htmlFor="manual-voter"
              className="text-sm font-medium text-[#3d1f1e]"
            >
              Voter name (optional)
            </Label>
            <Input
              id="manual-voter"
              value={form.voterName}
              onChange={(event) =>
                onChange({ ...form, voterName: event.target.value })
              }
              className="border-[#f0d2d1] bg-white focus-visible:ring-[#821d1b] focus-visible:ring-offset-2"
              placeholder="Who is this vote for?"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              id="manual-first"
              label="1st Place"
              value={form.first}
              onChange={(value) => onChange({ ...form, first: value })}
              options={speakerNames}
              required
            />
            <SelectField
              id="manual-second"
              label="2nd Place"
              value={form.second}
              onChange={(value) => onChange({ ...form, second: value })}
              options={speakerNames}
              required
            />
            <SelectField
              id="manual-third"
              label="3rd Place"
              value={form.third}
              onChange={(value) => onChange({ ...form, third: value })}
              options={speakerNames}
              required
            />
            <SelectField
              id="manual-mostImproved"
              label="Most Improved"
              value={form.mostImproved}
              onChange={(value) => onChange({ ...form, mostImproved: value })}
              options={speakerNames}
              required
            />
          </div>

          {error && (
            <p className="rounded-md border border-[#f0d2d1] bg-[#fef0ef] px-3 py-2 text-sm text-[#821d1b]">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-[#f0d2d1] bg-white text-[#3d1f1e] hover:bg-[#fef0ef]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#821d1b] text-white hover:bg-[#9b2623]"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Record vote"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

type SelectFieldProps = {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
};

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  required,
}: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-[#3d1f1e]">
        {label}
      </Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="w-full rounded-lg border border-[#f0d2d1] bg-white px-3 py-2 text-sm text-[#3d1f1e] focus:outline-none focus:ring-2 focus:ring-[#821d1b]"
      >
        <option value="" className="bg-white text-muted-foreground">
          Select speaker
        </option>
        {options.map((option) => (
          <option
            key={option}
            value={option}
            className="bg-white text-[#3d1f1e]"
          >
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
