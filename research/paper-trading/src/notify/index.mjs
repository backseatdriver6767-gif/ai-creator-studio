// Unified notification dispatcher. Zero-dependency; uses fetch for Slack
// webhooks and an SMTP stub interface for email.
//
// Env config:
//   SLACK_WEBHOOK_URL   — Slack incoming webhook
//   DISCORD_WEBHOOK_URL — Discord webhook (same payload format)

export async function notify({ title, body, channels = ["stdout"] }) {
  const messages = [];
  for (const ch of channels) {
    try {
      if (ch === "stdout") {
        console.log(`\n[notify] ${title}\n${body}\n`);
        messages.push({ channel: ch, ok: true });
      } else if (ch === "slack") {
        const url = process.env.SLACK_WEBHOOK_URL;
        if (!url) { messages.push({ channel: ch, ok: false, error: "SLACK_WEBHOOK_URL not set" }); continue; }
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: `*${title}*\n\`\`\`${body}\`\`\`` }),
        });
        messages.push({ channel: ch, ok: res.ok, status: res.status });
      } else if (ch === "discord") {
        const url = process.env.DISCORD_WEBHOOK_URL;
        if (!url) { messages.push({ channel: ch, ok: false, error: "DISCORD_WEBHOOK_URL not set" }); continue; }
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: `**${title}**\n\`\`\`\n${body}\n\`\`\`` }),
        });
        messages.push({ channel: ch, ok: res.ok, status: res.status });
      }
    } catch (e) {
      messages.push({ channel: ch, ok: false, error: e.message });
    }
  }
  return messages;
}
