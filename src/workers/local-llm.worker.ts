/**
 * local-llm.worker.ts
 *
 * Web Worker that runs ONNX/WASM inference via @huggingface/transformers.
 * Models are downloaded from the HuggingFace Hub on first use and cached
 * in the browser's Cache Storage / IndexedDB — no Ollama, no server,
 * no external tooling required.
 *
 * Message protocol
 * ────────────────
 * Main → Worker
 *   { type: 'load',     model: string }              pre-warm the model
 *   { type: 'generate', model: string,
 *                       messages: ChatMessage[],
 *                       id: string }                 run inference
 *   { type: 'cancel' }                               abort current generation
 *
 * Worker → Main
 *   { type: 'progress', file: string,
 *                       loaded: number, total: number } download progress
 *   { type: 'ready',    model: string }              model loaded & ready
 *   { type: 'token',    text: string }               streaming token
 *   { type: 'done',     fullText: string }           generation finished
 *   { type: 'error',    message: string }            something went wrong
 */

import { pipeline, TextStreamer, env } from '@huggingface/transformers'

// Use browser Cache Storage for downloaded model weights.
// allowLocalModels = false ensures we always fetch from the Hub.
env.allowLocalModels = false
env.useBrowserCache = true

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type TextGenerationPipeline = Awaited<ReturnType<typeof pipeline>>

let loadedModelId: string | null = null
let pipe: TextGenerationPipeline | null = null
let cancelRequested = false

/** Build the progress_callback passed to pipeline() */
function makeProgressCallback(context: string) {
  return (progress: { status: string; file?: string; loaded?: number; total?: number }) => {
    if (progress.status === 'progress') {
      self.postMessage({
        type: 'progress',
        file: progress.file ?? context,
        loaded: progress.loaded ?? 0,
        total: progress.total ?? 0,
      })
    }
  }
}

async function loadModel(modelId: string): Promise<void> {
  if (loadedModelId === modelId && pipe !== null) return

  pipe = null
  loadedModelId = null

  pipe = await pipeline('text-generation', modelId, {
    dtype: 'q4f16',
    progress_callback: makeProgressCallback(modelId),
  })

  loadedModelId = modelId
  self.postMessage({ type: 'ready', model: modelId })
}

self.onmessage = async (event: MessageEvent) => {
  const msg = event.data as
    | { type: 'load'; model: string }
    | { type: 'generate'; model: string; messages: ChatMessage[]; id: string }
    | { type: 'cancel' }

  if (msg.type === 'cancel') {
    cancelRequested = true
    return
  }

  if (msg.type === 'load') {
    try {
      await loadModel(msg.model)
    } catch (err: unknown) {
      self.postMessage({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to load model',
      })
    }
    return
  }

  if (msg.type === 'generate') {
    const { model, messages } = msg
    cancelRequested = false

    try {
      await loadModel(model)

      if (!pipe) throw new Error('Pipeline failed to initialize')

      let fullText = ''

      const streamer = new TextStreamer((pipe as { tokenizer: Parameters<typeof TextStreamer>[0] }).tokenizer, {
        skip_prompt: true,
        callback_function: (text: string) => {
          if (cancelRequested) {
            // Throw to abort the generation loop inside transformers.js
            throw new Error('cancelled')
          }
          fullText += text
          self.postMessage({ type: 'token', text })
        },
      })

      await (pipe as (
        messages: ChatMessage[],
        options: Record<string, unknown>
      ) => Promise<unknown>)(messages, {
        max_new_tokens: 2048,
        do_sample: true,
        temperature: 0.7,
        streamer,
      })

      self.postMessage({ type: 'done', fullText })
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'cancelled') {
        self.postMessage({ type: 'error', message: 'Generation cancelled' })
      } else {
        self.postMessage({
          type: 'error',
          message: err instanceof Error ? err.message : 'Generation failed',
        })
      }
    }
  }
}
