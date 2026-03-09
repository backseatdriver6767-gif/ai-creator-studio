// ManyChat API wrapper
const BASE_URL = "https://api.manychat.com/fb";

function headers() {
  return {
    Authorization: `Bearer ${process.env.MANYCHAT_API_TOKEN!}`,
    "Content-Type": "application/json",
  };
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
