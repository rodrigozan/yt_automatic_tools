import { config } from "dotenv";

config();

const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export async function graphGet(
  path: string,
  params: Record<string, string> = {},
  accessToken?: string
): Promise<any> {
  const url = new URL(`${GRAPH_BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  if (accessToken) url.searchParams.set("access_token", accessToken);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || `Graph API GET ${path} falhou (status ${response.status}).`);
  }

  return data;
}

export async function graphPost(
  path: string,
  body: Record<string, any> = {},
  accessToken?: string
): Promise<any> {
  const url = new URL(`${GRAPH_BASE}${path}`);
  if (accessToken) url.searchParams.set("access_token", accessToken);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || `Graph API POST ${path} falhou (status ${response.status}).`);
  }

  return data;
}
