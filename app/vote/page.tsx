import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function TTVotePage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md border-[#e4c4c3] bg-white/95 shadow-md">
        <CardHeader className="space-y-3 text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-3xl font-semibold text-[#821d1b]">
            Table Topics Voter
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Cast your ballot for today&apos;s speakers in just a few taps.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Link href="/vote/ballot" className="block">
            <Button
              className="w-full bg-[#821d1b] text-white hover:bg-[#9b2623]"
              size="lg"
            >
              Start Voting
            </Button>
          </Link>
          <p className="text-center text-sm text-muted-foreground">
            Club organizer?
            <Link
              href="/admin/vote"
              className="ml-1 font-semibold text-[#821d1b] underline-offset-4 hover:underline"
            >
              Sign in to the admin console
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
