import { NextRequest } from "next/server";

import {
  FLYER_SYSTEM_PROMPT,
  calculateOpenAIImageTokens,
  estimateTextTokens,
  isValidApiKey,
  type ProofreadProvider,
} from "@/lib/flyer-proofread";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_OUTPUT_TOKENS = 4000;

type ProofreadRequest = {
  provider: ProofreadProvider;
  model: string;
  apiKey: string;
  imageBase64: string;
  mimeType: string;
  imageWidth: number;
  imageHeight: number;
};

type OpenAIStreamChunk = {
  choices?: Array<{
    delta?: {
      content?: string;
      refusal?: string;
    };
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

class FriendlyError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function normalizeBase64(value: string) {
  return value.replace(/^data:[^;]+;base64,/, "");
}

function getBase64ByteLength(value: string) {
  const normalized = normalizeBase64(value);
  const padding = normalized.endsWith("==") ? 2 : normalized.endsWith("=") ? 1 : 0;
  return Math.floor((normalized.length * 3) / 4) - padding;
}

function isAllowedMimeType(mimeType: string) {
  return /^image\/(jpeg|jpg|png|webp)$/i.test(mimeType);
}

function sendSse(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  event: string,
  payload: unknown,
) {
  controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`));
}

function parseSseDataBlock(block: string) {
  const lines = block.split("\n");
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  return dataLines.join("\n");
}

function normalizeSseChunk(chunk: string) {
  return chunk.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function extractOpenAIErrorMessage(responseText: string) {
  try {
    const parsed = JSON.parse(responseText) as { error?: { message?: string } };
    return parsed.error?.message ?? responseText;
  } catch {
    return responseText;
  }
}

function isSafetyViolationMessage(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("safety") ||
    normalized.includes("policy") ||
    normalized.includes("content filter") ||
    normalized.includes("blocked")
  );
}

async function fetchGeminiCountTokens(params: {
  model: string;
  apiKey: string;
  mimeType: string;
  imageBase64: string;
}) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:countTokens?key=${params.apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: FLYER_SYSTEM_PROMPT,
              },
              {
                inline_data: {
                  mime_type: params.mimeType,
                  data: params.imageBase64,
                },
              },
            ],
          },
        ],
      }),
    },
  );

  if (response.status === 401 || response.status === 403) {
    throw new FriendlyError("The API key provided is invalid or expired. Please check your settings.", 401);
  }

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { totalTokens?: number };
  return typeof data.totalTokens === "number" ? data.totalTokens : null;
}

async function fetchOpenAIModels(apiKey: string) {
  const response = await fetch("https://api.openai.com/v1/models", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (response.status === 401 || response.status === 403) {
    throw new FriendlyError("The API key provided is invalid or expired. Please check your settings.", 401);
  }

  if (!response.ok) {
    throw new FriendlyError("Failed to fetch models from OpenAI.", response.status);
  }

  const data = (await response.json()) as {
    data?: Array<{ id?: string }>;
  };

  return (
    data.data
      ?.map((item) => item.id)
      .filter((id): id is string => Boolean(id) && !id.startsWith("ft:"))
      .sort() ?? []
  );
}

async function fetchGeminiModels(apiKey: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (response.status === 401 || response.status === 403) {
    throw new FriendlyError("The API key provided is invalid or expired. Please check your settings.", 401);
  }

  if (!response.ok) {
    throw new FriendlyError("Failed to fetch models from Gemini.", response.status);
  }

  const data = (await response.json()) as {
    models?: Array<{
      name?: string;
      supportedGenerationMethods?: string[];
    }>;
  };

  return (
    data.models
      ?.filter((item) => item.supportedGenerationMethods?.includes("generateContent"))
      .map((item) => item.name?.replace(/^models\//, ""))
      .filter((name): name is string => Boolean(name))
      .sort() ?? []
  );
}

async function streamOpenAI(params: {
  apiKey: string;
  model: string;
  mimeType: string;
  imageBase64: string;
  controller: ReadableStreamDefaultController<Uint8Array>;
  encoder: TextEncoder;
}) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model,
      stream: true,
      stream_options: { include_usage: true },
      temperature: 0.2,
      top_p: 0.9,
      max_completion_tokens: MAX_OUTPUT_TOKENS,
      messages: [
        {
          role: "system",
          content: FLYER_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze the flyer image based on the system instructions.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${params.mimeType};base64,${params.imageBase64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
    }),
  });

  if (response.status === 401) {
    throw new FriendlyError("The API key provided is invalid or expired. Please check your settings.", 401);
  }

  if (!response.ok) {
    const responseText = await response.text();
    const message = extractOpenAIErrorMessage(responseText);

    if (isSafetyViolationMessage(message)) {
      throw new FriendlyError(
        "The uploaded flyer triggered the model's safety filters. Please review the content and try again.",
        400,
      );
    }

    throw new FriendlyError(message || "OpenAI request failed.", response.status);
  }

  if (!response.body) {
    throw new FriendlyError("OpenAI did not return a stream.", 502);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let outputTokens = 0;
  let emittedText = false;
  let finishReason: string | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += normalizeSseChunk(decoder.decode(value, { stream: true }));

    let separatorIndex = buffer.indexOf("\n\n");
    while (separatorIndex !== -1) {
      const block = buffer.slice(0, separatorIndex).trim();
      buffer = buffer.slice(separatorIndex + 2);

      if (block) {
        const payload = parseSseDataBlock(block);

        if (payload && payload !== "[DONE]") {
          let parsed: OpenAIStreamChunk;
          try {
            parsed = JSON.parse(payload) as OpenAIStreamChunk;
          } catch {
            separatorIndex = buffer.indexOf("\n\n");
            continue;
          }

          const delta = parsed.choices?.[0]?.delta?.content;
          const refusal = parsed.choices?.[0]?.delta?.refusal;
          const chunkFinishReason = parsed.choices?.[0]?.finish_reason;

          if (typeof delta === "string" && delta.length > 0) {
            sendSse(params.controller, params.encoder, "chunk", { text: delta });
            emittedText = true;
          }

          if (typeof refusal === "string" && refusal.length > 0) {
            sendSse(params.controller, params.encoder, "chunk", { text: refusal });
            emittedText = true;
          }

          if (typeof chunkFinishReason === "string") {
            finishReason = chunkFinishReason;
          }

          if (chunkFinishReason === "content_filter") {
            throw new FriendlyError(
              "The uploaded flyer triggered the model's safety filters. Please review the content and try again.",
              400,
            );
          }

          if (typeof parsed.usage?.completion_tokens === "number") {
            outputTokens = parsed.usage.completion_tokens;
          }
        }
      }

      separatorIndex = buffer.indexOf("\n\n");
    }
  }

  sendSse(params.controller, params.encoder, "usage", {
    outputTokens,
    finishReason,
  });

  if (!emittedText) {
    throw new FriendlyError(
      "The selected model returned no text output. Please try another model.",
      400,
    );
  }
}

async function streamGemini(params: {
  apiKey: string;
  model: string;
  mimeType: string;
  imageBase64: string;
  controller: ReadableStreamDefaultController<Uint8Array>;
  encoder: TextEncoder;
}) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:streamGenerateContent?alt=sse&key=${params.apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        generationConfig: {
          temperature: 0.2,
          topP: 0.9,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
        },
        contents: [
          {
            parts: [
              {
                text: FLYER_SYSTEM_PROMPT,
              },
              {
                inline_data: {
                  mime_type: params.mimeType,
                  data: params.imageBase64,
                },
              },
              {
                text: "Please analyze the flyer image according to the instructions above.",
              },
            ],
          },
        ],
      }),
    },
  );

  if (response.status === 401 || response.status === 403) {
    throw new FriendlyError("The API key provided is invalid or expired. Please check your settings.", 401);
  }

  if (!response.ok) {
    const responseText = await response.text();

    if (isSafetyViolationMessage(responseText)) {
      throw new FriendlyError(
        "The uploaded flyer triggered the model's safety filters. Please review the content and try again.",
        400,
      );
    }

    throw new FriendlyError("Gemini request failed.", response.status);
  }

  if (!response.body) {
    throw new FriendlyError("Gemini did not return a stream.", 502);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let previousText = "";
  let outputTokens = 0;
  let emittedText = false;
  let finishReason: string | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += normalizeSseChunk(decoder.decode(value, { stream: true }));

    let separatorIndex = buffer.indexOf("\n\n");
    while (separatorIndex !== -1) {
      const block = buffer.slice(0, separatorIndex).trim();
      buffer = buffer.slice(separatorIndex + 2);

      if (block) {
        const payload = parseSseDataBlock(block);
        if (payload) {
          let parsed: {
            candidates?: Array<{
              content?: {
                parts?: Array<{ text?: string }>;
              };
              finishReason?: string;
            }>;
            usageMetadata?: {
              candidatesTokenCount?: number;
            };
          };

          try {
            parsed = JSON.parse(payload) as {
              candidates?: Array<{
                content?: {
                  parts?: Array<{ text?: string }>;
                };
                finishReason?: string;
              }>;
              usageMetadata?: {
                candidatesTokenCount?: number;
              };
            };
          } catch {
            separatorIndex = buffer.indexOf("\n\n");
            continue;
          }

          const fullText =
            parsed.candidates?.[0]?.content?.parts
              ?.map((part) => part.text ?? "")
              .join("")
              .trim() ?? "";

          if (fullText) {
            let delta = fullText;
            if (fullText.startsWith(previousText)) {
              delta = fullText.slice(previousText.length);
            }
            previousText = fullText;

            if (delta) {
              sendSse(params.controller, params.encoder, "chunk", { text: delta });
              emittedText = true;
            }
          }

          if (typeof parsed.candidates?.[0]?.finishReason === "string") {
            finishReason = parsed.candidates[0].finishReason;
          }

          if (parsed.candidates?.[0]?.finishReason === "SAFETY") {
            throw new FriendlyError(
              "The uploaded flyer triggered the model's safety filters. Please review the content and try again.",
              400,
            );
          }

          if (typeof parsed.usageMetadata?.candidatesTokenCount === "number") {
            outputTokens = parsed.usageMetadata.candidatesTokenCount;
          }
        }
      }

      separatorIndex = buffer.indexOf("\n\n");
    }
  }

  sendSse(params.controller, params.encoder, "usage", {
    outputTokens,
    finishReason,
  });

  if (!emittedText) {
    throw new FriendlyError(
      "The selected model returned no text output. Please try another model.",
      400,
    );
  }
}

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  let apiKey = "";

  try {
    const body = (await request.json()) as Partial<ProofreadRequest>;

    if (!body.provider || (body.provider !== "openai" && body.provider !== "gemini")) {
      return jsonError("Please select a valid provider.");
    }

    if (!body.model || typeof body.model !== "string") {
      return jsonError("Please select a valid model.");
    }

    if (!body.apiKey || typeof body.apiKey !== "string") {
      return jsonError("API key is required.");
    }

    apiKey = body.apiKey.trim();
    if (!isValidApiKey(body.provider, apiKey)) {
      return jsonError("The API key provided is invalid or expired. Please check your settings.", 401);
    }

    if (!body.imageBase64 || typeof body.imageBase64 !== "string") {
      return jsonError("Please upload a flyer image.");
    }

    if (!body.mimeType || typeof body.mimeType !== "string" || !isAllowedMimeType(body.mimeType)) {
      return jsonError("Only JPEG, PNG, and WEBP images are supported.");
    }

    if (typeof body.imageWidth !== "number" || typeof body.imageHeight !== "number") {
      return jsonError("Image dimensions are required for token estimation.");
    }

    const imageBase64 = normalizeBase64(body.imageBase64);
    const bytes = getBase64ByteLength(imageBase64);
    if (bytes > MAX_IMAGE_BYTES) {
      return jsonError(
        "The image is too large. Please compress it and try again (max 20MB).",
        413,
      );
    }

    const promptTokensEstimate = estimateTextTokens(FLYER_SYSTEM_PROMPT);
    const openAIImageEstimate = calculateOpenAIImageTokens(body.imageWidth, body.imageHeight);

    let estimatedInputTokens =
      body.provider === "openai" ? promptTokensEstimate + openAIImageEstimate : promptTokensEstimate + 258;

    if (body.provider === "gemini") {
      const countTokens = await fetchGeminiCountTokens({
        model: body.model,
        apiKey,
        mimeType: body.mimeType,
        imageBase64,
      });

      if (typeof countTokens === "number") {
        estimatedInputTokens = countTokens;
      }
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        try {
          sendSse(controller, encoder, "meta", {
            promptTokensEstimate,
            imageTokensEstimate: body.provider === "openai" ? openAIImageEstimate : 258,
            estimatedInputTokens,
          });

          if (body.provider === "openai") {
            await streamOpenAI({
              apiKey,
              model: body.model,
              mimeType: body.mimeType,
              imageBase64,
              controller,
              encoder,
            });
          } else {
            await streamGemini({
              apiKey,
              model: body.model,
              mimeType: body.mimeType,
              imageBase64,
              controller,
              encoder,
            });
          }

          sendSse(controller, encoder, "done", { ok: true });
        } catch (error) {
          const fallbackMessage = "Something went wrong while proofreading. Please try again.";
          if (error instanceof FriendlyError) {
            sendSse(controller, encoder, "error", { message: error.message, status: error.status });
          } else {
            sendSse(controller, encoder, "error", { message: fallbackMessage, status: 500 });
          }

          sendSse(controller, encoder, "done", { ok: false });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-store",
        Connection: "keep-alive",
      },
    });
  } catch {
    return jsonError("Invalid request payload.", 400);
  } finally {
    apiKey = "";
  }
}

export async function GET(request: NextRequest) {
  let apiKey = "";

  try {
    const provider = request.nextUrl.searchParams.get("provider");
    const apiKeyHeader = request.headers.get("x-byok-api-key");

    if (!provider || (provider !== "openai" && provider !== "gemini")) {
      return jsonError("Please select a valid provider.");
    }

    if (!apiKeyHeader) {
      return jsonError("API key is required.");
    }

    apiKey = apiKeyHeader.trim();

    if (!isValidApiKey(provider, apiKey)) {
      return jsonError("The API key provided is invalid or expired. Please check your settings.", 401);
    }

    let models: string[] = [];

    if (provider === "openai") {
      models = await fetchOpenAIModels(apiKey);
    } else {
      models = await fetchGeminiModels(apiKey);
    }

    return Response.json({ models });
  } catch (error) {
    if (error instanceof FriendlyError) {
      return jsonError(error.message, error.status);
    }

    return jsonError("Could not fetch available models.", 500);
  } finally {
    apiKey = "";
  }
}
