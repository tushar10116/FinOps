import { Request, Response } from "express";
import {
  ConnectionStatus,
  ECloudPlatforms,
  IOrganizationInput,
} from "../validations/orgnizationValidator.js";
import Organization from "../mongoose/models/Organization.js";
import User from "../mongoose/models/User.js";
import bcrypt from "bcryptjs";
import InviteUser from "../mongoose/models/InviteUser.js";
import jwt from "jsonwebtoken";
import { ClientSecretCredential } from "@azure/identity";
import { decryptSecret, encryptSecret } from "../validations/bcrypt-helper.js"; // Linked helper paths
import "../validations/string-helper.js";
import { CloudConnectionRequestInput, IOrganization } from "@shared/types.js";
import {GetCallerIdentityCommand, STSClient} from "@aws-sdk/client-sts";
import { BigQuery } from "@google-cloud/bigquery";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Get the path from your Render Environment Variable, or use a default string
const gcpKeyPath = process.env.GCP_KEY_PATH || "/private/finops-501204-4ad6dd107756.json";

// 2. Check if the path is absolute (starts with /). If it is absolute (like on Render),
//    use it directly. If it's relative (like locally), resolve it with __dirname.
const gcpKeyFile = path.isAbsolute(gcpKeyPath) 
  ? gcpKeyPath 
  : path.resolve(__dirname, gcpKeyPath);
const bigquery = new BigQuery({keyFilename: gcpKeyFile});

export const organizationController = {
  registerOrganization: async (
    req: Request<{}, {}, IOrganizationInput>,
    res: Response,
  ) => {
    try {
      const { organizationName, domain, name, email, password } = req.body;
      
      const existingOrganization = await Organization.findOne({ domain });
      if (existingOrganization) {
        return res
          .status(400)
          .json({ message: "Organization with this domain already exists" });
      }
      
      const newOrganization = new Organization({
        organizationName,
        domain,
      });
      await newOrganization.save();

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        organizationId: newOrganization._id, 
        role: "admin",
      });
      await newUser.save();

      return res
        .status(201)
        .json({ message: "Organization registered successfully" });
    } catch (error: any) {
      return res.status(500).json({ message: error?.message || "Internal server error" });
    }
  },

  getInvitedMembers: async (req: Request, res: Response) => {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        return res.status(400).json({ message: "Organization context not found in request" });
      }
      const invitedMembers = await InviteUser.find({ organizationId }).select(
        "name email role",
      );
      return res.status(200).json(invitedMembers);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  inviteMember: async (req: Request, res: Response) => {
    try {
      const { email, role, name } = req.body;
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        return res.status(400).json({ 
          message: "User validation failed: organizationId is missing from your session middleware." 
        });
      }

      if (req.user?.email === email) {
        return res.status(400).json({ message: "You cannot invite yourself" });
      }

      const token = jwt.sign({ email, role, name }, process.env.JWT_SECRET!, {
        expiresIn: "1h",
      });

      const invitedUserToken = new InviteUser({
        name,
        email,
        role,
        token: token, 
        organizationId: organizationId,
      });

      await invitedUserToken.save();
      return res.status(200).send({ name, email, role, token });
    } catch (error: any) {
      return res.status(500).json({ message: error?.message || "Internal server error" });
    }
  },

  removeInvitedMember: async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      await InviteUser.findOneAndDelete({ email });
      return res.status(200).json({ message: "Member removed successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  getInvitedToken: async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const invitedUser = await InviteUser.findOne({ email });
      if (invitedUser) {
        return res.status(200).json({
          name: invitedUser?.name,
          email: invitedUser?.email,
          role: invitedUser?.role,
          token: invitedUser?.token,
        });
      }
      return res
        .status(400)
        .json({ message: "Member not found. please invite member first" });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  registerCloud: async (
    req: Request<{}, {}, CloudConnectionRequestInput>,
    res: Response,
  ) => {
    try {
      const connectionRequestBody = req.body as CloudConnectionRequestInput;

      if (connectionRequestBody.platform.isNullOrEmptyString()) {
        return res.status(400).json({ message: "please select platform" });
      }
  
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(400).json({ message: "Organization context not found in request" });
      }

      const updatedOrganization = await testAndSaveCloudCredentials(connectionRequestBody, organizationId);
      
      if (!updatedOrganization) {
        return res.status(500).json({ message: "unable to register cloud." });
      }
      return res.status(200).json({ message: "cloud registered successfully", organization: updatedOrganization });
    } catch (error: any) {
      return res.status(500).json({ message: error?.message || "Internal server error" });
    }
  },

  

  getOrganizationById: async (req: Request, res: Response) => {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(400).json({ message: "Organization context not found in request" });
      }

      const organization = await Organization.findById(organizationId).lean();
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
        
      const organizationResponse = deleteInvalidCloudFromResponse(organization);

      const response = refractureOrganizationResponse(organizationResponse);
                
      return res.status(200).json({ organization: organizationResponse });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  updateCloudPlatformStatus: async (req: Request, res: Response) => {
    try {
      const { platform, status } = req.body;
      const organizationId = req.user?.organizationId;
      
      if (!organizationId) {
        return res.status(401).json({ message: "please re-authenticate yourself." });
      }

      const organization = await Organization.findById(organizationId).lean();

      if (!organization) {
        return res.status(400).json({ message: "you are not part of any organization" });
      }

      const response = await connectCloudCredentials(platform, organization as unknown as IOrganization, status);

      if (!response) {
         return res.status(400).json({ message: "unable to connect. please check credentials." });
      }
      
      return res.status(202).json({ message: "Connected Successfully" });
    } catch (error: any) {
      return res.status(500).json({ message: error?.message || "Internal server error" });
    }
  }
};

//-------------------------------------- Organization helper functions --------------------------------------

function validateAzureRequest(
  connectionRequestBody: CloudConnectionRequestInput,
) {
  return (
    !!connectionRequestBody.clientId &&
    !connectionRequestBody.clientId?.isNullOrEmptyString() &&
    !!connectionRequestBody.clientSecret &&
    !connectionRequestBody.clientSecret?.isNullOrEmptyString() &&
    !!connectionRequestBody.subscriptionId &&
    !connectionRequestBody.subscriptionId?.isNullOrEmptyString() &&
    !!connectionRequestBody.tenantId &&
    !connectionRequestBody.tenantId?.isNullOrEmptyString()
  );
}

function deleteInvalidCloudFromResponse(org: any) {
  if (!org) return org;
  
  const organization = JSON.parse(JSON.stringify(org));
  const connections = organization.cloudConnections;

  if (!connections) return organization;

  if (connections.azure && (!connections.azure.clientId || !connections.azure.tenantId)) {
    delete connections.azure;
  }
  
  if (connections.aws 
    &&  !connections.aws.awsAccessKey 
    && !connections.aws.awsSecretKeyEncrypted 
    && !connections.aws.targetRegion) {
    delete connections.aws;
  }

  if (connections.gcp && (
    !connections.gcp.clientProjectId ||
    !connections.gcp.clientDatasetId
  )) {
    delete connections.gcp;
  }

  return organization;
}

async function testAndSaveCloudCredentials(connectionRequestBody: CloudConnectionRequestInput, organizationId: string) {
  try { 
    switch (connectionRequestBody.platform) {
      case ECloudPlatforms.AZURE: {
        if (!validateAzureRequest(connectionRequestBody)) {
          throw new Error("Missing mandatory Azure credential parameters.");
        }

        const client_credentials = new ClientSecretCredential(
          connectionRequestBody.tenantId!,
          connectionRequestBody.clientId!,
          connectionRequestBody.clientSecret!, 
        );

        const token = await client_credentials.getToken("https://management.azure.com/.default");
        if (!token || !token.token || token.token.isNullOrEmptyString()) {
          throw new Error("Azure authentication returned an empty token.");
        }
         
        const encryptedSecretStr = encryptSecret(connectionRequestBody.clientSecret!);

        const azureConnectionRequest = {
          tenantId: connectionRequestBody.tenantId,
          clientId: connectionRequestBody.clientId,
          clientSecretEncrypted: encryptedSecretStr, 
          subscriptionId: connectionRequestBody.subscriptionId,
          connectionStatus: ConnectionStatus.UNLINKED,
          lastSyncedAt: Date.now(),
        };

      

        const updatedOrganization = await Organization.findByIdAndUpdate(
          organizationId,
          {
            $set: { "cloudConnections.azure": azureConnectionRequest },
          },
          { runValidators: true, returnDocument: "after" }
        );
        
        return updatedOrganization;
      }
      case ECloudPlatforms.AWS: {
        if (!connectionRequestBody.awsAccessKey || !connectionRequestBody.awsSecretKey || !connectionRequestBody.targetRegion) {
          throw new Error("Missing mandatory AWS credential parameters.");
        }

        const stsClient= new STSClient({
          region: connectionRequestBody.targetRegion||"us-east-1",
          credentials: {
            accessKeyId: connectionRequestBody.awsAccessKey,
            secretAccessKey: connectionRequestBody.awsSecretKey,
          },
        });

        const data = await stsClient.send(new GetCallerIdentityCommand({}));


        const awsConnectionRequest = {
          awsAccessKey: connectionRequestBody.awsAccessKey,
          awsSecretKeyEncrypted: encryptSecret(connectionRequestBody.awsSecretKey),
          targetRegion: connectionRequestBody.targetRegion,
          connectionStatus: ConnectionStatus.UNLINKED,
          lastSyncedAt: Date.now(),
        };

        const updatedOrganization = await Organization.findByIdAndUpdate(
          organizationId,
          {
            $set: { "cloudConnections.aws": awsConnectionRequest },
          },
          { runValidators: true, returnDocument: "after" }
        );
        
        return updatedOrganization;
      }
      case ECloudPlatforms.GCP: {

        if(!connectionRequestBody.clientProjectId || !connectionRequestBody.clientDatasetId) {
          throw new Error("Missing mandatory GCP credential parameters.");
        }
        const gcpConnectionRequest = {
          clientProjectId: connectionRequestBody.clientProjectId,
          clientDatasetId: connectionRequestBody.clientDatasetId,
          connectionStatus: ConnectionStatus.UNLINKED,
          lastSyncedAt: Date.now(),
        };

        const dataset = bigquery.dataset(connectionRequestBody.clientDatasetId, { projectId: connectionRequestBody.clientProjectId });
        const [metadata] = await dataset.getMetadata();
        if (!metadata) {
          throw new Error("GCP dataset not found or inaccessible.");
        }
        const [tables] = await dataset.getTables({ maxResults: 5 });
        if (tables.length === 0) {
          throw new Error("GCP dataset is empty.");
        }
        const updatedOrganization = await Organization.findByIdAndUpdate(
          organizationId,
          {
            $set: { "cloudConnections.gcp": gcpConnectionRequest },
          },
          { runValidators: true, returnDocument: "after" }
        );
        
        return updatedOrganization;

      }
      
      
      default: 
        return null;
    }
  } catch (error: any) {
    
    throw new Error(error?.message || "Failed to save cloud credentials");
  }
}

async function connectCloudCredentials(platform: string, organization: IOrganization, status: string) {
  try { 
    switch (platform) {
      case ECloudPlatforms.AZURE: {
        const rawAzureConfig = JSON.parse(JSON.stringify(organization.cloudConnections?.azure));
        const decryptedClientSecret = decryptSecret(rawAzureConfig.clientSecretEncrypted);
        if (!decryptedClientSecret || !rawAzureConfig || !rawAzureConfig.clientSecretEncrypted) {
          throw new Error("Cannot connect: Cloud configurations or clientSecretEncrypted are missing in database.");
        }

        const client_credentials = new ClientSecretCredential(
          rawAzureConfig.tenantId!,
          rawAzureConfig.clientId!,
          decryptedClientSecret, 
        );

        const token = await client_credentials.getToken("https://management.azure.com/.default");
        if (!token || !token.token || token.token.isNullOrEmptyString()) {
          throw new Error("Azure verification failed using decrypted secret token.");
        }

        const updatedOrganization = await Organization.findOneAndUpdate(
          { domain: organization.domain },
          { $set: { "cloudConnections.azure.connectionStatus": status } },
          { runValidators: true, returnDocument: "after" }
        );

        return updatedOrganization;
      }
      case ECloudPlatforms.AWS: {
        const rawAwsConfig = JSON.parse(JSON.stringify(organization.cloudConnections?.aws));

        if (!rawAwsConfig || !rawAwsConfig.awsSecretKeyEncrypted || !rawAwsConfig.awsAccessKey || !rawAwsConfig.targetRegion) {
          throw new Error("Cannot connect: Cloud configurations or required fields are missing in database.");
        }

        const decryptedAwsSecret = decryptSecret(rawAwsConfig.awsSecretKeyEncrypted);

        const stsClient= new STSClient({
          region: rawAwsConfig.targetRegion||"us-east-1",
          credentials: {
            accessKeyId: rawAwsConfig.awsAccessKey,
            secretAccessKey: decryptedAwsSecret,
          },
        });

        const data = await stsClient.send(new GetCallerIdentityCommand({}));

        const updatedOrganization = await Organization.findOneAndUpdate(
          { domain: organization.domain },
          { $set: { "cloudConnections.aws.connectionStatus": status } },
          { runValidators: true, returnDocument: "after" }
        );
        
        return updatedOrganization;
      }
      case ECloudPlatforms.GCP: {
        const rawGcpConfig = JSON.parse(JSON.stringify(organization.cloudConnections?.gcp));

        if (!rawGcpConfig || !rawGcpConfig.clientProjectId || !rawGcpConfig.clientDatasetId) {
          throw new Error("Cannot connect: Cloud configurations or required fields are missing in database.");
        }

        const updatedOrganization = await Organization.findOneAndUpdate(
          { domain: organization.domain },
          { $set: { "cloudConnections.gcp.connectionStatus": status } },
          { runValidators: true, returnDocument: "after" }
        );

        return updatedOrganization;
      }
      default:
        return null;
    }
  } catch (error: any) {
    
    throw new Error(error?.message || "Failed to connect cloud credentials");
  }
}
        
function refractureOrganizationResponse(org: any) {
  const organization= {...org};
  const connections = organization.cloudConnections;
  if(connections?.azure){
    delete connections.azure.clientSecretEncrypted;
  }
  if(connections?.aws){
    delete connections.aws.awsSecretKeyEncrypted;
  }
  if(connections?.gcp){
    delete connections.gcp.serviceAccountKeyEncrypted;
  }
  return organization;
}