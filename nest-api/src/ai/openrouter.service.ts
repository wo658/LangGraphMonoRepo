import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatCompletionResult {
  message: string;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  model: string;
}

@Injectable()
export class OpenRouterService {
  private client: OpenAI;
  private readonly baseURL = 'https://openrouter.ai/api/v1';
  private readonly appName = process.env.OPENROUTER_APP_NAME || 'LangGraphMonoRepo';
  private readonly siteUrl = process.env.OPENROUTER_SITE_URL || 'https://example.com';

  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      // Allow startup without key; throw only when used
      // eslint-disable-next-line no-console
      console.warn('[OpenRouterService] OPENROUTER_API_KEY is not set. Calls will fail until configured.');
    }
    this.client = new OpenAI({
      apiKey,
      baseURL: this.baseURL,
      defaultHeaders: {
        // OpenRouter recommends Referer and X-Title headers
        'Referer': this.siteUrl,
        'HTTP-Referer': this.siteUrl,
        'X-Title': this.appName,
      },
    });
  }

  async createChatCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {},
  ): Promise<ChatCompletionResult> {
    try {
      const model = options.model || process.env.AI_MODEL || 'qwen-2.5-coder-32b-instruct';
      const temperature = options.temperature ?? 0.2;
      const max_tokens = options.max_tokens ?? 2048;

      const resp = await this.client.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens,
      });

      const choice = resp.choices?.[0];
      const content = choice?.message?.content ?? '';
      const usage = resp.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

      return {
        message: content,
        usage: {
          prompt_tokens: usage.prompt_tokens || 0,
          completion_tokens: usage.completion_tokens || 0,
          total_tokens: usage.total_tokens || 0,
        },
        model: resp.model || model,
      };
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('[OpenRouterService] createChatCompletion error:', err?.response?.data || err?.message || err);
      throw new InternalServerErrorException('Failed to generate completion');
    }
  }
}
