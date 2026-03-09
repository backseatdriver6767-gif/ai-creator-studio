"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

async function mutator<T>(url: string, options: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }
  return res.json();
}

// ---- Personas ----

export function usePersonas(status?: string) {
  const params = status ? `?status=${status}` : "";
  return useQuery({
    queryKey: ["personas", status],
    queryFn: () => fetcher(`/api/personas${params}`),
  });
}

export function usePersona(id: string) {
  return useQuery({
    queryKey: ["personas", id],
    queryFn: () => fetcher(`/api/personas/${id}`),
    enabled: !!id,
  });
}

export function useCreatePersona() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      mutator("/api/personas", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["personas"] }),
  });
}

export function useUpdatePersona(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      mutator(`/api/personas/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["personas"] }),
  });
}

export function useDeletePersona() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      mutator(`/api/personas/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["personas"] }),
  });
}

// ---- Content ----

export function useContentPieces(filters?: { personaId?: string; campaignId?: string; status?: string }) {
  const params = new URLSearchParams();
  if (filters?.personaId) params.set("personaId", filters.personaId);
  if (filters?.campaignId) params.set("campaignId", filters.campaignId);
  if (filters?.status) params.set("status", filters.status);
  const query = params.toString();
  return useQuery({
    queryKey: ["content", filters],
    queryFn: () => fetcher(`/api/content${query ? `?${query}` : ""}`),
  });
}

export function useContentPiece(id: string) {
  return useQuery({
    queryKey: ["content", id],
    queryFn: () => fetcher(`/api/content/${id}`),
    enabled: !!id,
  });
}

export function useCreateContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      mutator("/api/content", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content"] }),
  });
}

export function useUpdateContent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      mutator(`/api/content/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content"] }),
  });
}

export function useGenerateScript(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      mutator(`/api/content/${id}/generate-script`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content", id] }),
  });
}

export function useGenerateVoice(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      mutator(`/api/content/${id}/generate-voice`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content", id] }),
  });
}

export function useGenerateVideo(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider?: string) =>
      mutator(`/api/content/${id}/generate-video`, {
        method: "POST",
        body: JSON.stringify({ provider: provider || "kling" }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content", id] }),
  });
}

export function usePublishContent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      mutator(`/api/content/${id}/publish`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content", id] }),
  });
}

export function useScheduleContent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (scheduledAt: string) =>
      mutator(`/api/content/${id}/schedule`, {
        method: "POST",
        body: JSON.stringify({ scheduledAt }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content", id] }),
  });
}

// ---- Campaigns ----

export function useCampaigns(filters?: { personaId?: string; status?: string }) {
  const params = new URLSearchParams();
  if (filters?.personaId) params.set("personaId", filters.personaId);
  if (filters?.status) params.set("status", filters.status);
  const query = params.toString();
  return useQuery({
    queryKey: ["campaigns", filters],
    queryFn: () => fetcher(`/api/campaigns${query ? `?${query}` : ""}`),
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ["campaigns", id],
    queryFn: () => fetcher(`/api/campaigns/${id}`),
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      mutator("/api/campaigns", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function useUpdateCampaign(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      mutator(`/api/campaigns/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

// ---- Products ----

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: () => fetcher("/api/products"),
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      mutator("/api/products", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

// ---- Analytics ----

export function useAnalytics() {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: () => fetcher("/api/analytics"),
    refetchInterval: 60000,
  });
}

// ---- Generation ----

export function useGenerateIdeas() {
  return useMutation({
    mutationFn: (data: { personaName: string; niche: string; count?: number }) =>
      mutator("/api/generate/ideas", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useGenerateScriptStandalone() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      mutator("/api/generate/script", { method: "POST", body: JSON.stringify(data) }),
  });
}

// ---- Voices ----

export function useVoices() {
  return useQuery({
    queryKey: ["voices"],
    queryFn: () => fetcher("/api/voices"),
  });
}

export function useDesignVoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { prompt: string; name: string }) =>
      mutator("/api/voices/design", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["voices"] }),
  });
}

// ---- Actors ----

export function useActors() {
  return useQuery({
    queryKey: ["actors"],
    queryFn: () => fetcher("/api/actors"),
  });
}

// ---- Jobs ----

export function useJob(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["jobs", id],
    queryFn: () => fetcher(`/api/jobs/${id}`),
    enabled: !!id && enabled,
    refetchInterval: 5000,
  });
}

// ---- Orders ----

export function useOrders(filters?: { productId?: string; status?: string }) {
  const params = new URLSearchParams();
  if (filters?.productId) params.set("productId", filters.productId);
  if (filters?.status) params.set("status", filters.status);
  const query = params.toString();
  return useQuery({
    queryKey: ["orders", filters],
    queryFn: () => fetcher(`/api/orders${query ? `?${query}` : ""}`),
  });
}

// ---- Settings ----

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => fetcher("/api/settings"),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      mutator("/api/settings", { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}

// ---- Social Accounts ----

export function useSocialAccounts(sync?: boolean) {
  return useQuery({
    queryKey: ["social-accounts", sync],
    queryFn: () => fetcher(`/api/social-accounts${sync ? "?sync=true" : ""}`),
  });
}

export function useCreateSocialAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      mutator("/api/social-accounts", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-accounts"] }),
  });
}

// ---- Usage ----

export function useUsage() {
  return useQuery({
    queryKey: ["usage"],
    queryFn: () => fetcher("/api/usage"),
    refetchInterval: 30000,
  });
}
