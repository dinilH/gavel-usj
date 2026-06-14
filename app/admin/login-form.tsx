"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, User, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export function AdminLoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Success! Redirecting to dashboard...");
        router.push("/admin/dashboard");
        router.refresh();
      } else {
        toast.error(data.message || "Invalid username or password");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-[#781007]/20 bg-[#121214]/80 backdrop-blur-xl text-white shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#781007] via-[#b3190b] to-[#781007]" />
        
        <CardHeader className="text-center pt-8 pb-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#781007]/20 flex items-center justify-center border border-[#781007]/30 mb-3">
            <Lock className="w-5 h-5 text-[#b3190b]" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            Gavel Club USJ
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Enter credentials to access the admin portal
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 px-6 pb-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-zinc-300 font-medium">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  id="username"
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 bg-zinc-900/50 border-zinc-800 text-white placeholder-zinc-500 focus-visible:ring-[#781007] focus-visible:border-[#781007]"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300 font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-zinc-900/50 border-zinc-800 text-white placeholder-zinc-500 focus-visible:ring-[#781007] focus-visible:border-[#781007]"
                  disabled={isLoading}
                />
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="px-6 pb-8 flex flex-col gap-3">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#781007] hover:bg-[#9c150a] active:bg-[#610d06] text-white py-6 rounded-lg font-semibold flex items-center justify-center gap-2 group transition-all cursor-pointer"
            >
              {isLoading ? (
                "Verifying credentials..."
              ) : (
                <>
                  Access Portal <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
            <a
              href="/"
              className="text-sm text-zinc-400 hover:text-[#b3190b] text-center transition-colors mt-2"
            >
              ← Back to Main Website
            </a>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}
