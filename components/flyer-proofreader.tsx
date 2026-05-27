"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Image as ImageIcon, RefreshCw, ShieldCheck, Sparkles, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ReactMarkdown from "react-markdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

import {
  FLYER_SYSTEM_PROMPT,
  calculateOpenAIImageTokens,
  estimateTextTokens,
  isValidApiKey,
  type ProofreadProvider,
} from "@/lib/flyer-proofread";

type UploadState = {
  name: string;
  mimeType: string;
  base64: string;
  width: number;
  height: number;
  bytes: number;
  previewUrl: string;
};

type UsageMeta = {
  promptTokensEstimate: number;
  imageTokensEstimate: number;
  estimatedInputTokens: number;
  outputTokens: number;
  finishReason?: string;
};

type StreamEvent = {
  event: string;
  data: string;
};

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const OPENAI_INPUT_LIMIT = 128_000;
const GEMINI_INPUT_LIMIT = 1_000_000;
const STORAGE_KEY = "flyer-proofreader-session-v2";

function formatCount(value: number) {
  return value.toLocaleString("en-US");
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function fileToDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read image file."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}

async function getImageDimensions(dataUrl: string) {
  return await new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => reject(new Error("Could not read image dimensions."));
    image.src = dataUrl;
  });
}

function readSseEvents(buffer: string) {
  const events: StreamEvent[] = [];
  let remaining = buffer;

  while (true) {
    const matchIndex = remaining.search(/\n\n|\r\r|\r\n\r\n/);
    if (matchIndex === -1) {
      break;
    }

    const rawBlock = remaining.slice(0, matchIndex);
    const separator = remaining.slice(matchIndex).startsWith("\r\n\r\n")
      ? 4
      : remaining.slice(matchIndex).startsWith("\n\n") || remaining.slice(matchIndex).startsWith("\r\r")
        ? 2
        : 2;

    remaining = remaining.slice(matchIndex + separator);

    const block = rawBlock.trim();
    if (!block) {
      continue;
    }

    const lines = block.split(/\r\n|\n|\r/);
    let eventName = "message";
    const dataLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith("event:")) {
        eventName = line.slice(6).trim();
      }
      if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trimStart());
      }
    }

    if (dataLines.length > 0) {
      events.push({ event: eventName, data: dataLines.join("\n") });
    }
  }

  return {
    events,
    remaining,
  };
}

export function FlyerProofreader() {
  const [provider, setProvider] = useState<ProofreadProvider>("openai");
  const [model, setModel] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [upload, setUpload] = useState<UploadState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const modelFetchRequestId = useRef(0);
  const [usage, setUsage] = useState<UsageMeta>({
    promptTokensEstimate: estimateTextTokens(FLYER_SYSTEM_PROMPT),
    imageTokensEstimate: 0,
    estimatedInputTokens: estimateTextTokens(FLYER_SYSTEM_PROMPT),
    outputTokens: 0,
    finishReason: undefined,
  });

  const localEstimates = useMemo(() => {
    const promptTokens = estimateTextTokens(FLYER_SYSTEM_PROMPT);
    const openaiImageTokens = upload ? calculateOpenAIImageTokens(upload.width, upload.height) : 0;
    const geminiImageTokens = upload ? 258 : 0;

    return {
      promptTokens,
      openaiImageTokens,
      geminiImageTokens,
      openaiTotal: promptTokens + openaiImageTokens,
      geminiTotal: promptTokens + geminiImageTokens,
    };
  }, [upload]);

  const activeTotal = provider === "openai" ? localEstimates.openaiTotal : localEstimates.geminiTotal;
  const activeLimit = provider === "openai" ? OPENAI_INPUT_LIMIT : GEMINI_INPUT_LIMIT;
  const overLimit = activeTotal > activeLimit;

  const onProviderChange = (nextProvider: string) => {
    if (nextProvider !== "openai" && nextProvider !== "gemini") return;
    setProvider(nextProvider);
    setModel("");
  };

  const refreshModels = async (targetProvider = provider, key = apiKey) => {
    const trimmedKey = key.trim();
    if (!trimmedKey) {
      setModels([]);
      setModel("");
      setModelsError("");
      return;
    }

    if (!isValidApiKey(targetProvider, trimmedKey)) {
      setModels([]);
      setModel("");
      setModelsError("");
      return;
    }

    setIsLoadingModels(true);
    setModelsError("");
    const requestId = ++modelFetchRequestId.current;

    try {
      const response = await fetch(`/api/proofread?provider=${targetProvider}`, {
        method: "GET",
        headers: {
          "x-byok-api-key": trimmedKey,
        },
      });

      const payload = (await response.json().catch(() => ({}))) as {
        models?: unknown;
        error?: string;
      };

      if (requestId !== modelFetchRequestId.current) {
        return;
      }

      if (!response.ok) {
        setModelsError(
          typeof payload.error === "string" ? payload.error : "Could not fetch models for this provider.",
        );
        setModels([]);
        setModel("");
        return;
      }

      const nextModels = Array.isArray(payload.models)
        ? payload.models.filter((item): item is string => typeof item === "string" && item.length > 0)
        : [];

      const uniqueModels = [...new Set(nextModels)];

      setModels(uniqueModels);
      setModel((previous) => (uniqueModels.includes(previous) ? previous : uniqueModels[0] ?? ""));
    } catch {
      if (requestId !== modelFetchRequestId.current) {
        return;
      }

      setModelsError("Could not fetch models for this provider.");
      setModels([]);
      setModel("");
    } finally {
      if (requestId === modelFetchRequestId.current) {
        setIsLoadingModels(false);
      }
    }
  };

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { provider?: string; apiKey?: string };

        if (parsed.provider === "openai" || parsed.provider === "gemini") {
          setProvider(parsed.provider);
        }

        if (typeof parsed.apiKey === "string") {
          setApiKey(parsed.apiKey);
        }
      }
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        provider,
        apiKey,
      }),
    );
  }, [provider, apiKey, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;

    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      setModels([]);
      setModel("");
      setModelsError("");
      return;
    }

    const timeout = window.setTimeout(() => {
      void refreshModels(provider, trimmedKey);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [provider, apiKey, isHydrated]);

  useEffect(() => {
    const promptTokensEstimate = localEstimates.promptTokens;
    const imageTokensEstimate =
      provider === "openai" ? localEstimates.openaiImageTokens : localEstimates.geminiImageTokens;

    setUsage({
      promptTokensEstimate,
      imageTokensEstimate,
      estimatedInputTokens: promptTokensEstimate + imageTokensEstimate,
      outputTokens: 0,
      finishReason: undefined,
    });
  }, [provider, localEstimates]);

  const onUpload = async (file: File | null) => {
    setError("");

    if (!file) {
      setUpload(null);
      return;
    }

    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type)) {
      setError("Please upload a JPEG, PNG, or WEBP image.");
      setUpload(null);
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image is larger than 20MB. Please compress it and try again.");
      setUpload(null);
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      const { width, height } = await getImageDimensions(dataUrl);
      const base64 = dataUrl.replace(/^data:[^;]+;base64,/, "");

      setUpload({
        name: file.name,
        mimeType: file.type,
        base64,
        width,
        height,
        bytes: file.size,
        previewUrl: dataUrl,
      });
    } catch {
      setError("Could not process the image. Please try a different file.");
      setUpload(null);
    }
  };

  const runProofread = async () => {
    setError("");
    setResult("");
    setUsage({
      promptTokensEstimate: localEstimates.promptTokens,
      imageTokensEstimate:
        provider === "openai" ? localEstimates.openaiImageTokens : localEstimates.geminiImageTokens,
      estimatedInputTokens: activeTotal,
      outputTokens: 0,
      finishReason: undefined,
    });

    if (!apiKey.trim()) {
      setError("Enter your API key to continue.");
      return;
    }

    if (!upload) {
      setError("Upload a flyer image first.");
      return;
    }

    if (!model) {
      setError("Load and select a model before running the proofreader.");
      return;
    }

    if (overLimit) {
      setError("This image likely exceeds the selected model's input token limit. Compress or resize the image.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/proofread", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          model,
          apiKey: apiKey.trim(),
          imageBase64: upload.base64,
          mimeType: upload.mimeType,
          imageWidth: upload.width,
          imageHeight: upload.height,
        }),
      });

      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => ({}));
        const message =
          typeof payload?.error === "string"
            ? payload.error
            : "The request failed. Check your key, model, and image and try again.";
        setError(message);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let sawDone = false;
      let sawChunk = false;

      const applyEvent = (eventName: string, rawData: string) => {
        let parsed: Record<string, unknown> = {};
        try {
          parsed = JSON.parse(rawData) as Record<string, unknown>;
        } catch {
          parsed = { message: rawData };
        }

        if (eventName === "meta") {
          setUsage((previous) => ({
            ...previous,
            promptTokensEstimate:
              typeof parsed.promptTokensEstimate === "number"
                ? parsed.promptTokensEstimate
                : previous.promptTokensEstimate,
            imageTokensEstimate:
              typeof parsed.imageTokensEstimate === "number"
                ? parsed.imageTokensEstimate
                : previous.imageTokensEstimate,
            estimatedInputTokens:
              typeof parsed.estimatedInputTokens === "number"
                ? parsed.estimatedInputTokens
                : previous.estimatedInputTokens,
          }));
          return;
        }

        if (eventName === "chunk") {
          if (typeof parsed.text === "string") {
            setResult((previous) => previous + parsed.text);
            if (parsed.text.length > 0) {
              sawChunk = true;
            }
          }
          return;
        }

        if (eventName === "usage") {
          setUsage((previous) => ({
            ...previous,
            outputTokens:
              typeof parsed.outputTokens === "number" ? parsed.outputTokens : previous.outputTokens,
            finishReason:
              typeof parsed.finishReason === "string" ? parsed.finishReason : previous.finishReason,
          }));
          return;
        }

        if (eventName === "error") {
          const message =
            typeof parsed.message === "string"
              ? parsed.message
              : "Something went wrong while proofreading. Please try again.";
          setError(message);
        }
      };

      readLoop: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const parsed = readSseEvents(buffer);
        buffer = parsed.remaining;

        for (const eventItem of parsed.events) {
          applyEvent(eventItem.event, eventItem.data);

          if (eventItem.event === "done") {
            sawDone = true;
            break readLoop;
          }
        }
      }

      if (!sawDone && !sawChunk) {
        setError("No response text was returned by the selected model. Try another model.");
      }
    } catch {
      setError("Network error while contacting the proofreading API.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#f4ece6] via-[#fffaf6] to-[#f8f2ea] py-24">
      <div className="absolute -top-20 -right-24 h-72 w-72 rounded-full bg-[#781007]/10 blur-3xl" />
      <div className="absolute -bottom-16 -left-20 h-72 w-72 rounded-full bg-[#3A4F7A]/10 blur-3xl" />

      <div className="container relative z-10 mx-auto grid max-w-6xl gap-8 px-6 lg:grid-cols-[1.1fr_1fr]">
        <Card className="border-[#781007]/20 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full border border-[#781007]/20 bg-[#781007]/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#781007]">
              <Sparkles className="h-3.5 w-3.5" />
              Flyer Proofreading Lab
            </div>
            <CardTitle className="text-3xl font-bold text-[#1f130f]">
              AI Copyediting for Event Flyers
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-relaxed text-[#6c4e46]">
              Bring your own API key, upload a flyer image, and get structured proofreading in live stream mode with token estimates.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select value={provider} onValueChange={onProviderChange}>
                <SelectTrigger id="provider" className="w-full bg-white">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder={provider === "openai" ? "sk-..." : "AIza..."}
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                className="bg-white"
                autoComplete="off"
                spellCheck={false}
              />
              <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                Key is only kept in your browser session to reload models after refresh.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="model">Model</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => void refreshModels(provider, apiKey)}
                  disabled={isLoadingModels || !apiKey.trim()}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingModels ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
              <Select value={model} onValueChange={setModel} disabled={isLoadingModels || models.length === 0}>
                <SelectTrigger id="model" className="w-full bg-white">
                  <SelectValue
                    placeholder={
                      isLoadingModels
                        ? "Loading models..."
                        : apiKey.trim()
                          ? "Select model"
                          : "Enter API key to load models"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {models.map((modelOption) => (
                    <SelectItem key={modelOption} value={modelOption}>
                      {modelOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {models.length > 0
                  ? `${models.length} model${models.length > 1 ? "s" : ""} available for selection.`
                  : "Models appear here after validating your key."}
              </p>
              {modelsError ? <p className="text-xs text-red-700">{modelsError}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="flyer-image">Flyer Image</Label>
              <label
                htmlFor="flyer-image"
                className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-[#781007]/30 bg-[#fff7f2] px-4 py-3 transition hover:border-[#781007]/60"
              >
                <div className="flex items-center gap-3">
                  <UploadCloud className="h-5 w-5 text-[#781007]" />
                  <span className="text-sm text-[#5c3f37]">
                    {upload ? upload.name : "Choose JPG, PNG, or WEBP (max 20MB)"}
                  </span>
                </div>
                <span className="rounded-md bg-[#781007] px-2.5 py-1 text-xs font-semibold text-white">
                  Browse
                </span>
              </label>
              <Input
                id="flyer-image"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={(event) => onUpload(event.target.files?.[0] ?? null)}
              />
            </div>

            <Button
              type="button"
              onClick={runProofread}
              disabled={isSubmitting || !upload || !model || isLoadingModels}
              className="h-10 w-full bg-[#781007] text-white hover:bg-[#5d0c05]"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Analyzing flyer...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Run Proofread
                </>
              )}
            </Button>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-[#3A4F7A]/20 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-[#1e2f4b]">Token Snapshot</CardTitle>
              <CardDescription>Pre-flight estimation and live output usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-md bg-[#f7f9fc] px-3 py-2">
                <span>System prompt</span>
                <strong>{formatCount(usage.promptTokensEstimate || localEstimates.promptTokens)}</strong>
              </div>
              <div className="flex items-center justify-between rounded-md bg-[#f7f9fc] px-3 py-2">
                <span>Image estimate</span>
                <strong>
                  {formatCount(
                    usage.imageTokensEstimate ||
                      (provider === "openai" ? localEstimates.openaiImageTokens : localEstimates.geminiImageTokens),
                  )}
                </strong>
              </div>
              <div className="flex items-center justify-between rounded-md bg-[#f7f9fc] px-3 py-2">
                <span>Estimated input</span>
                <strong>{formatCount(usage.estimatedInputTokens || activeTotal)}</strong>
              </div>
              <div className="flex items-center justify-between rounded-md bg-[#f7f9fc] px-3 py-2">
                <span>Output tokens</span>
                <strong>{formatCount(usage.outputTokens)}</strong>
              </div>
              {usage.finishReason ? (
                <div className="rounded-md border border-[#d7dee8] bg-[#f8fafc] px-3 py-2 text-xs text-[#4b5a75]">
                  Finish reason: {usage.finishReason}
                </div>
              ) : null}
              {usage.finishReason === "length" ? (
                <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Output stopped because the model hit the output token limit. Try a shorter flyer text or a model with larger output budget.
                </div>
              ) : null}

              {upload ? (
                <div className="rounded-md border border-[#d7dee8] bg-[#f8fafc] px-3 py-2 text-xs text-[#4b5a75]">
                  {upload.width}x{upload.height} px | {formatBytes(upload.bytes)} | {upload.mimeType}
                </div>
              ) : null}

              {overLimit ? (
                <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Estimated input exceeds model limit ({formatCount(activeTotal)} &gt; {formatCount(activeLimit)}).
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="min-h-[26rem] border-[#1f130f]/15 bg-white/95">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-[#1f130f]">
                <ImageIcon className="h-4 w-4" />
                Proofreading Output
              </CardTitle>
              <CardDescription>
                Streamed markdown response with extraction, corrections, and copy suggestions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upload ? (
                <div className="overflow-hidden rounded-lg border border-[#ede5de] bg-[#fffdfb]">
                  <Image
                    src={upload.previewUrl}
                    alt="Flyer preview"
                    width={upload.width}
                    height={upload.height}
                    unoptimized
                    className="max-h-44 w-full object-contain"
                  />
                </div>
              ) : null}

              <div className="max-h-[28rem] overflow-auto rounded-lg border border-[#ede5de] bg-[#fffdfb] p-4">
                {result ? (
                  <div className="prose prose-sm max-w-none text-[#2d1f1a] prose-headings:text-[#1f130f] prose-strong:text-[#1f130f] prose-li:my-1">
                    <ReactMarkdown>{result}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-[#85665d]">Run the proofreader to see live output here.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
