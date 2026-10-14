/** Code shown in the "how it works" post, shared by both languages. */

/** The MVP's call to Claude, shortened from tools/eval/src/claude-ocr.ts. */
export const CLAUDE_CALL = `const response = await client.messages.parse({
  model: "claude-opus-5",
  max_tokens: 8000,
  system: systemPrompt(14),
  output_config: { effort: "low", format: zodOutputFormat(OcrResultSchema) },
  messages: [
    {
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: "image/jpeg", data } },
        { type: "text", text: "Transcribe the first 14 lines of this Sefer Torah column and count the visible lines." },
      ],
    },
  ],
});
if (response.stop_reason === "refusal") throw new OcrError("refusal", "The model refused to transcribe the image.");
if (response.stop_reason === "max_tokens") throw new OcrError("truncated", "The transcription was cut off by the token limit.");
const parsed = response.parsed_output; // { lines, uncertainLines, gapBeforeLines, lineCountVisible }
if (!parsed) throw new OcrError("bad-format", "The model did not return a transcription in the expected format.");`;
