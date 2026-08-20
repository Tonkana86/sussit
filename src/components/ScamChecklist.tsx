"use client";

import { useState } from "react";

interface Flag {
  id: string;
  label: string;
  weight: number; // how strongly this indicates a scam, out of 100 total
}

// Weights are a rough judgment call, not a scientific score — the point is
// to give people a concrete, honest signal rather than false precision.
// Payment requests and OTP/banking requests are weighted highest because
// they're the two things a legitimate recruiter or procurement office never
// does, regardless of everything else about the message.
const FLAGS: Flag[] = [
  { id: "upfront-payment", label: "Asks you to pay a fee (registration, training, medical, uniform, etc.) to apply or be considered", weight: 30 },
  { id: "otp-banking", label: "Asks for your ID number, banking password, card details, or a one-time PIN (OTP)", weight: 25 },
  { id: "not-official-channel", label: "Arrived via WhatsApp, SMS, or a social media message rather than an official email or website", weight: 15 },
  { id: "free-email", label: "Sender uses a free email address (Gmail, Yahoo, Outlook) instead of an official organisation domain", weight: 12 },
  { id: "urgency", label: "Pressures you to respond or pay within a very short deadline", weight: 8 },
  { id: "too-good", label: "Salary or terms seem unrealistically good for the role and requirements", weight: 6 },
  { id: "no-reference", label: "Has no reference number you can check, or the reference number can't be found anywhere official", weight: 4 },
];

export function ScamChecklist() {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const score = FLAGS.filter((f) => checked.has(f.id)).reduce((sum, f) => sum + f.weight, 0);
  const anyChecked = checked.size > 0;

  let verdict: { label: string; classes: string; body: string } | null = null;
  if (anyChecked) {
    if (score >= 30) {
      verdict = {
        label: "High risk — this shows strong signs of a scam",
        classes: "border-red-300 bg-red-50 text-red-900",
        body: "Do not pay anything, and do not share ID, banking, or OTP details. If you've already shared these or paid, contact your bank immediately and consider reporting to SAPS.",
      };
    } else if (score >= 12) {
      verdict = {
        label: "Some real warning signs — verify independently before doing anything else",
        classes: "border-amber-300 bg-amber-50 text-amber-900",
        body: "Contact the organisation directly using a phone number or email from their own official website — not any contact details given in the message itself — to confirm it's genuine.",
      };
    } else {
      verdict = {
        label: "Fewer warning signs, but still verify",
        classes: "border-teal-300 bg-teal-50 text-teal-900",
        body: "This doesn't show the strongest red flags, but that alone doesn't confirm it's genuine. Still check the reference number and the organisation's official contact details before proceeding.",
      };
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="font-semibold text-slate-900">Quick check: does this look like a scam?</p>
      <p className="mt-1 text-sm text-slate-600">
        Most job and tender scams in South Africa don&apos;t have any reference number to look
        up at all — so if you have a suspicious message in front of you right now, tick
        whatever applies to get an honest read on how risky it looks.
      </p>

      <div className="mt-4 space-y-2">
        {FLAGS.map((flag) => (
          <label
            key={flag.id}
            className="flex items-start gap-2 rounded-lg border border-slate-100 p-2.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={checked.has(flag.id)}
              onChange={() => toggle(flag.id)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-500"
            />
            <span>{flag.label}</span>
          </label>
        ))}
      </div>

      {verdict && (
        <div className={`mt-4 rounded-lg border p-4 ${verdict.classes}`}>
          <p className="text-sm font-semibold uppercase tracking-wide">{verdict.label}</p>
          <p className="mt-1 text-sm">{verdict.body}</p>
        </div>
      )}

      <p className="mt-4 text-xs text-slate-400">
        This is a general guide based on common patterns, not a guarantee — a message showing
        none of these signs can still be a scam, and always deserves independent verification.
      </p>
    </div>
  );
}
