// Curriculum tutor: given a user-provided note file (from the librarian
// agent or hand-written), generates spaced-repetition style questions and
// grades user answers.

import { getClient } from "./client.mjs";

const QUESTION_SYSTEM = `You are a spaced-repetition quiz generator for quant
trading study notes. Given a set of notes, produce 10 questions that test
understanding, not memorization. Output strict JSON:
{"questions":[{"q":"...","expected":"..."}]}`;

const GRADE_SYSTEM = `You grade a student's answer against expected content.
Return strict JSON: {"score": 0..1, "feedback": "..."}. Be fair but firm.
Partial credit for partial understanding. Wrong facts get 0.`;

export async function generateQuestions(notesText) {
  const client = await getClient();
  const txt = await client.ask(QUESTION_SYSTEM, notesText.slice(0, 20_000));
  return safeParse(txt);
}

export async function gradeAnswer({ question, expected, answer }) {
  const client = await getClient();
  const txt = await client.ask(GRADE_SYSTEM, `Q: ${question}\nExpected: ${expected}\nStudent: ${answer}`);
  return safeParse(txt);
}

function safeParse(txt) {
  const cleaned = txt.replace(/^```(?:json)?/gm, "").replace(/```$/gm, "").trim();
  try { return JSON.parse(cleaned); } catch { return { rawText: txt }; }
}
