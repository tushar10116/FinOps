import z from "zod";

export type SpendTrend = "up" | "down" | "flat";

export interface CostCenter {
  name: string;
  owner: string;
  budget: number;
  spend: number;
  forecast: number;
  trend: SpendTrend;
}

export interface Recommendation {
  title: string;
  detail: string;
  savings: number;
}

export interface DashboardSummary {
  period: string;
  totalSpend: number;
  budget: number;
  forecast: number;
  savingsOpportunity: number;
  activeAccounts: number;
}

export interface DashboardPayload {
  summary: DashboardSummary;
  costCenters: CostCenter[];
  recommendations: Recommendation[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  organizationId?: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface Organization {
  organizationName: string;
  domain: string;
}

export interface RegisterOrganizationResponse {
  message: string;
}

export interface RegisterInput extends AuthCredentials {
  name: string;
}

export interface InviteUserInput {
  email: string;
  name: string;
}

export interface InviteUserResponse extends InviteUserInput {
  _id: string;
  role: string;
}

export interface ICloudCredentialBlock {
  connectionStatus: "CONNECTED" | "FAILED" | "UNLINKED";
  lastSyncedAt?: Date;
}

export interface IOrganization {
  organizationName: String;
  domain: String;
  cloudConnections?: {
    azure?: ICloudCredentialBlock & {
      tenantId: string;
      clientId: string;
      clientSecretEncrypted: string;
      subscriptionId: string;
    };
    aws?: ICloudCredentialBlock & {
      roleArn: string;
      externalId: string;
      targetRegion: string;
    };
    gcp?: ICloudCredentialBlock & {
      billingAccountId: string;
      serviceAccountKeyEncrypted: string;
    };
  };
}

export interface IAzureCredentialBlock {
  tenantId: string;
  clientId: string;
  clientSecretEncrypted: string;
  subscriptionId: string;
}

export interface IOrganizationCloudResponse {
  organizationName: String;
  domain: String;
  cloudConnections?: {
    azure?: ICloudCredentialBlock & {
      tenantId: string;
      clientId: string;
      subscriptionId: string;
    };
    aws?: ICloudCredentialBlock & {
      awsAccessKey: string;
      targetRegion: string;
      
    };
    gcp?: ICloudCredentialBlock & {
      clientProjectId: string;
      clientDatasetId: string;
    };
  };
}

export const cloudConnection = z.object({
  tenantId: z.string().trim().optional(),
  clientId: z.string().trim().optional(),
  clientSecret: z.string().trim().optional(),
  subscriptionId: z.string().trim().optional(),
  platform: z.string().trim(),
  awsAccessKey: z.string().trim().optional(),
  awsSecretKey: z.string().trim().optional(),
  targetRegion: z.string().trim().optional(),
  billingAccountId: z.string().trim().optional(),
  serviceAccountKeyEncrypted: z.string().trim().optional(),
  clientProjectId: z.string().trim().optional(),
  clientDatasetId: z.string().trim().optional(),
});



export type CloudConnectionRequestInput = z.infer<typeof cloudConnection>;

export interface IOptimizeCostPayload {
  platform: string;
  resourceName: string;
  resourceGroupName: string;
  recommendation: string;
  targetSize?: string;
}
