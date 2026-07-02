import { z } from "zod";
import { SignupValidationSchema } from "./authValidator.js";

export const OrganizationValidationSchema = z.object({
  organizationName: z
    .string()
    .trim()
    .min(1, "Organization name is required")
    .min(3, "Name must be at least 3 characters long"),
  domain: z
    .string()
    .trim()
    .min(1, "Domain is required")
    .min(3, "Domain must be at least 3 characters long"),
});

const UserValidationWithoutOrganizationSchema = SignupValidationSchema.pick({
  name: true,
  email: true,
  password: true,
});

const OrganizationRequestSchema = OrganizationValidationSchema.merge(
  UserValidationWithoutOrganizationSchema,
);

export type IOrganizationInput = z.infer<typeof OrganizationRequestSchema>;



export enum ECloudPlatforms{AZURE='azure',AWS='aws',GCP='gcp'}

export enum ConnectionStatus{CONNECTED='CONNECTED' ,FAILED= "FAILED" , UNLINKED='UNLINKED'}