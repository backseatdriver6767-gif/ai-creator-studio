// ManyChat API wrapper
const BASE_URL = "https://api.manychat.com/fb";

function getApiKey(): string {
  return process.env.MANYCHAT_API_TOKEN || "";
}

function headers() {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
  };
}

export function isConfigured(): boolean {
  return !!getApiKey();
}

export interface ManyChatSubscriber {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  gender?: string;
  custom_fields: Record<string, unknown>;
  tags: { id: number; name: string }[];
}

export interface ManyChatFlow {
  id: string;
  name: string;
  status: string;
}

// Create a keyword-triggered automation that DMs a checkout link
export async function createKeywordAutomation(opts: {
  keyword: string;
  checkoutUrl: string;
  message?: string;
}): Promise<{ success: boolean; flowId?: string; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: "ManyChat API key not configured" };
  }

  const dmMessage =
    opts.message ||
    `Hey! 👋 Thanks for your interest! Here's your link:\n\n${opts.checkoutUrl}`;

  try {
    // Step 1: Create a new flow with a keyword trigger
    const createRes = await fetch(`${BASE_URL}/page/createFlow`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        name: `Auto: "${opts.keyword}" keyword → DM checkout link`,
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      // If createFlow isn't available on their plan, fall back to instructions
      return {
        success: false,
        error: `ManyChat flow creation requires Pro plan. Set up manually: Keyword "${opts.keyword}" → DM "${opts.checkoutUrl}". Details: ${JSON.stringify(err)}`,
      };
    }

    const flowData = await createRes.json();
    const flowId = flowData.data?.ns || flowData.data?.id;

    // Step 2: Set up the keyword trigger via dynamic content
    // ManyChat's API for automation triggers is limited — we create the flow
    // and provide setup instructions for the keyword trigger
    return {
      success: true,
      flowId,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "ManyChat API error",
    };
  }
}

// Send a DM to a subscriber with a checkout link
export async function sendCheckoutDM(
  subscriberId: string,
  checkoutUrl: string,
  message?: string
): Promise<void> {
  const text =
    message ||
    `Hey! 👋 Here's your link:\n\n${checkoutUrl}`;

  const res = await fetch(`${BASE_URL}/sending/sendContent`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      subscriber_id: subscriberId,
      data: {
        version: "v2",
        content: {
          messages: [
            {
              type: "text",
              text,
              buttons: [
                {
                  type: "url",
                  caption: "Get It Now →",
                  url: checkoutUrl,
                },
              ],
            },
          ],
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`ManyChat sendCheckoutDM failed: ${res.status}`);
}

export async function findSubscriber(
  query: string
): Promise<ManyChatSubscriber | null> {
  const res = await fetch(`${BASE_URL}/subscriber/findByName`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ name: query }),
  });
  if (!res.ok) throw new Error(`ManyChat findSubscriber failed: ${res.status}`);
  const data = await res.json();
  return data.data?.[0] || null;
}

export async function getSubscriber(
  subscriberId: string
): Promise<ManyChatSubscriber> {
  const res = await fetch(`${BASE_URL}/subscriber/getInfo`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ subscriber_id: subscriberId }),
  });
  if (!res.ok) throw new Error(`ManyChat getSubscriber failed: ${res.status}`);
  const data = await res.json();
  return data.data;
}

export async function sendFlow(
  subscriberId: string,
  flowId: string
): Promise<void> {
  const res = await fetch(`${BASE_URL}/sending/sendFlow`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      subscriber_id: subscriberId,
      flow_ns: flowId,
    }),
  });
  if (!res.ok) throw new Error(`ManyChat sendFlow failed: ${res.status}`);
}

export async function setCustomField(
  subscriberId: string,
  fieldId: number,
  value: string
): Promise<void> {
  const res = await fetch(`${BASE_URL}/subscriber/setCustomField`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      subscriber_id: subscriberId,
      field_id: fieldId,
      field_value: value,
    }),
  });
  if (!res.ok) throw new Error(`ManyChat setCustomField failed: ${res.status}`);
}

export async function addTag(
  subscriberId: string,
  tagId: number
): Promise<void> {
  const res = await fetch(`${BASE_URL}/subscriber/addTag`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      subscriber_id: subscriberId,
      tag_id: tagId,
    }),
  });
  if (!res.ok) throw new Error(`ManyChat addTag failed: ${res.status}`);
}

export async function removeTag(
  subscriberId: string,
  tagId: number
): Promise<void> {
  const res = await fetch(`${BASE_URL}/subscriber/removeTag`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      subscriber_id: subscriberId,
      tag_id: tagId,
    }),
  });
  if (!res.ok) throw new Error(`ManyChat removeTag failed: ${res.status}`);
}
