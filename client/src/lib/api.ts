import { z } from "zod";
import { getStoredToken } from "./auth";

const spendTrendSchema = z.enum(["up", "down", "flat"]);

const costCenterSchema = z.object({
  name: z.string(),
  owner: z.string(),
  budget: z.number(),
  spend: z.number(),
  forecast: z.number(),
  trend: spendTrendSchema
});

const recommendationSchema = z.object({
  title: z.string(),
  detail: z.string(),
  savings: z.number()
});

const dashboardSummarySchema = z.object({
  period: z.string(),
  totalSpend: z.number(),
  budget: z.number(),
  forecast: z.number(),
  savingsOpportunity: z.number(),
  activeAccounts: z.number()
});

export const dashboardPayloadSchema = z.object({
  summary: dashboardSummarySchema,
  costCenters: z.array(costCenterSchema),
  recommendations: z.array(recommendationSchema)
});

export type DashboardPayload = z.infer<typeof dashboardPayloadSchema>;

const baseURL="https://finops-nxob.onrender.com/"

export async function getDashboard() {
  const response = await fetch(`${baseURL}/api/dashboard/get-dashboard`, {
    headers: {
      Authorization: `Bearer ${getStoredToken()}`
    }
  });

  if (!response.ok) {
    throw new Error(`Dashboard request failed with status ${response.status}`);
  }

  const raw = await response.json();
  return raw;
}
