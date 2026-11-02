"use client";

import { authClient } from "@/lib/auth-client";

export async function authenticatedApiRequest(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is missing from the environment.");
  }

  const { data, error } = await authClient.token();

  if (error || !data?.token) {
    throw new Error(error?.message || "Please sign in to continue.");
  }

  const headers = new Headers(options.headers);

  headers.set("Authorization", `Bearer ${data.token}`);

  if (typeof options.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const normalizedBaseUrl = apiBaseUrl.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");

  return fetch(`${normalizedBaseUrl}/${normalizedPath}`, {
    ...options,
    headers,
  });
}
