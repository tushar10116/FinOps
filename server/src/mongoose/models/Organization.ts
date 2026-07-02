import mongoose, { Schema, Document, Model } from "mongoose";
import { IOrganization } from "@shared/types.js";

// Create a Document type wrapper for Mongoose instantiation contexts
export type OrganizationDocument = Document & IOrganization;

const organizationSchema = new Schema<OrganizationDocument>(
  {
    organizationName: {
      type: String,
      required: [true, "Organization name is required"],
      unique: true, // Mongoose unique option doesn't take an array validation message natively
    },

    domain: {
      type: String,
      trim: true,
      required: [true, "domain is required"],
      unique: true,
      index: true,
    },
    
    cloudConnections: {
      azure: {
        tenantId: { type: String},
        clientSecretEncrypted: { type: String},
        subscriptionId: { type: String},
        clientId: { type: String },
        connectionStatus: {
          type: String,
          enum: ["CONNECTED", "FAILED", "UNLINKED"],
          default: "UNLINKED",
        },
        lastSyncedAt: { type: Date },
      },
      aws: {
        awsAccessKey: { type: String },
        awsSecretKeyEncrypted: { type: String },
        targetRegion: { type: String },
        connectionStatus: {
          type: String,
          enum: ["CONNECTED", "FAILED", "UNLINKED"],
          default: "UNLINKED",
        },
        lastSyncedAt: { type: Date },
      },
      gcp: {
        clientProjectId: { type: String },
        clientDatasetId: { type: String },
        connectionStatus: {
          type: String,
          enum: ["CONNECTED", "FAILED", "UNLINKED"],
          default: "UNLINKED",
        },
        lastSyncedAt: { type: Date },
      },
    },
  },
  {
    timestamps: true, // Automatically tracks createdAt and updatedAt properties for audits
  }
);

// Mitigate hot-reload compilation duplications in development environments
const Organization: Model<OrganizationDocument> =
  mongoose.models.Organization ||
  mongoose.model<OrganizationDocument>("Organization", organizationSchema);

export default Organization;