"use client";

import { useRef, useState } from "react";
import { getClientId } from "@/lib/client-id";
import { useI18n } from "@/lib/i18n/context";
import type { SupportInfo } from "@/lib/support-types";
import { SupportPanel } from "./SupportPanel";

type Reason = "wrong-place" | "wrong-move" | "slow" | "confusing" | "other";

interface Props {
  scanId: string | null;
  /** the photo that was read, offered with the feedback; null for typed text */
  photo: Blob | null;
  /** "result" after a placement; "uncertain" after a scan that couldn't be placed */
  variant: "result" | "uncertain";
  /** a navigation result, where the column count can be wrong */
  navigating?: boolean;
  support: SupportInfo;
}

type State = "idle" | "up" | "down" | "sending" | "sent" | "error";

/** Sends feedback; resolves to its id, or null if it didn't go through. */
async function send(lang: string, fields: Record<string, string | null>, photo: Blob | null): Promise<string | null> {
  const form = new FormData();
  form.append("client", getClientId());
  form.append("lang", lang);
  for (const [k, v] of Object.entries(fields)) if (v !== null) form.append(k, v);
  if (photo) form.append("photo", photo, "column.jpg");
  try {
    const res = await fetch("/api/feedback", { method: "POST", body: form });
    if (!res.ok) return null;
    return ((await res.json()) as { id?: string }).id ?? null;
  } catch {
    return null;
  }
}

/** "Did it help?" after a result, and an offer to send the photo after a scan that couldn't be placed. */
export function Feedback({ scanId, photo, variant, navigating = false, support }: Props) {
  const { t, lang } = useI18n();
  const [state, setState] = useState<State>("idle");
  const [reason, setReason] = useState<Reason | null>(null);
  const [comment, setComment] = useState("");
  const [withPhoto, setWithPhoto] = useState(false);
  // the "no" vote is sent right away, so it counts even if the form is left; details are added to it
  const voteRef = useRef<Promise<string | null> | null>(null);

  const vote = (v: "up" | "down") => {
    setState(v);
    voteRef.current = send(lang, { scanId, vote: v }, null);
  };

  const submitDetails = async () => {
    setState("sending");
    const voteId = await voteRef.current;
    const photoToSend = withPhoto ? photo : null;
    const ok = voteId
      ? await send(lang, { id: voteId, reason, comment: comment.trim() || null }, photoToSend)
      : await send(lang, { scanId, vote: "down", reason, comment: comment.trim() || null }, photoToSend);
    setState(ok ? "sent" : "error");
  };

  const submitPhoto = async () => {
    setState("sending");
    const ok = await send(lang, { scanId, reason: "uncertain", comment: comment.trim() || null }, photo);
    setState(ok ? "sent" : "error");
  };

  const button = "h-11 rounded-xl border border-line px-4 text-sm font-medium text-fg active:bg-panel-2 disabled:opacity-40";

  if (variant === "uncertain") {
    if (!photo) return null;
    if (state === "sent") return <p className="mt-4 rounded-2xl bg-panel p-4 text-center text-[15px] text-ok">{t.feedback.photoSent}</p>;
    return (
      <section className="mt-4 rounded-2xl bg-panel p-5">
        <h2 className="text-base font-medium">{t.feedback.improveTitle}</h2>
        <p className="mt-1 text-[15px] leading-relaxed text-muted">{t.feedback.improveText}</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          rows={2}
          placeholder={t.feedback.comment}
          className="mt-3 w-full rounded-xl border border-line bg-panel-2 px-3 py-2 text-[15px] text-fg outline-none placeholder:text-muted focus:border-accent"
        />
        {state === "error" && <p className="mt-2 text-sm text-bad">{t.feedback.error}</p>}
        <button type="button" onClick={submitPhoto} disabled={state === "sending"} className={`mt-3 w-full ${button} border-accent text-accent`}>
          {state === "sending" ? t.feedback.sending : t.feedback.improveSend}
        </button>
      </section>
    );
  }

  if (state === "idle") {
    return (
      <section className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-panel px-4 py-3">
        <span className="text-[15px]">{t.feedback.question}</span>
        <div className="flex gap-2">
          <button type="button" onClick={() => vote("up")} className={button}>
            <span aria-hidden>👍</span> {t.feedback.yes}
          </button>
          <button type="button" onClick={() => vote("down")} className={button}>
            <span aria-hidden>👎</span> {t.feedback.no}
          </button>
        </div>
      </section>
    );
  }

  if (state === "up") {
    return (
      <section className="mt-4">
        <p className="rounded-2xl bg-ok/10 px-4 py-3 text-center text-[15px] font-medium text-ok">{t.feedback.thanks}</p>
        <SupportPanel support={support} className="mt-3" />
      </section>
    );
  }

  if (state === "sent") return <p className="mt-4 rounded-2xl bg-panel p-4 text-center text-[15px] text-muted">{t.feedback.sent}</p>;

  const reasons: Reason[] = navigating ? ["wrong-place", "wrong-move", "slow", "confusing", "other"] : ["wrong-place", "slow", "confusing", "other"];
  return (
    <section className="mt-4 rounded-2xl bg-panel p-5">
      <h2 className="text-base font-medium">{t.feedback.whatFailed}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {reasons.map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={reason === r}
            onClick={() => setReason(reason === r ? null : r)}
            className={`rounded-full border px-3 py-2 text-sm ${reason === r ? "border-accent bg-accent text-ink" : "border-line text-fg"}`}
          >
            {t.feedback.reasons[r]}
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={1000}
        rows={2}
        placeholder={t.feedback.comment}
        className="mt-3 w-full rounded-xl border border-line bg-panel-2 px-3 py-2 text-[15px] text-fg outline-none placeholder:text-muted focus:border-accent"
      />
      {photo && (
        <label className="mt-3 flex items-start gap-3 text-[15px]">
          <input type="checkbox" checked={withPhoto} onChange={(e) => setWithPhoto(e.target.checked)} className="mt-1 size-5 shrink-0 accent-[var(--color-accent)]" />
          <span>
            {t.feedback.sendPhoto}
            <span className="block text-sm text-muted">{t.feedback.sendPhotoHint}</span>
          </span>
        </label>
      )}
      {state === "error" && <p className="mt-2 text-sm text-bad">{t.feedback.error}</p>}
      <button type="button" onClick={submitDetails} disabled={state === "sending"} className={`mt-4 w-full ${button}`}>
        {state === "sending" ? t.feedback.sending : t.feedback.send}
      </button>
    </section>
  );
}
