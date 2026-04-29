import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";

let _client: Anthropic | null = null;

export function isAnthropicConfigured(): boolean {
  return Boolean(env.ANTHROPIC_API_KEY);
}

export function getAnthropic(): Anthropic {
  if (!isAnthropicConfigured()) {
    throw new Error("ANTHROPIC_API_KEY not set");
  }
  if (!_client) {
    _client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY! });
  }
  return _client;
}
