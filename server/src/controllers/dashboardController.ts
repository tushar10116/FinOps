import { Request, Response } from "express";
import Organization from "../mongoose/models/Organization.js";
import {
  ConnectionStatus,
  ECloudPlatforms,
} from "../validations/orgnizationValidator.js";
import { ClientSecretCredential } from "@azure/identity";
import { decryptSecret } from "../validations/bcrypt-helper.js";
import { CostManagementClient } from "@azure/arm-costmanagement";
import { GoogleGenAI, Type } from "@google/genai";
import {
  IAzureCredentialBlock,
  ICloudCredentialBlock,
  IOrganization,
} from "@shared/types.js";
import { ComputeManagementClient } from "@azure/arm-compute";
import { OpenAI } from "openai/client.js";
import {
  CostExplorerClient,
  GetCostAndUsageCommand,
} from "@aws-sdk/client-cost-explorer";
import { BigQuery } from "@google-cloud/bigquery";
import path from "path";
import { fileURLToPath } from "url";

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINIAI_API_KEY });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:5173",
    "X-Title": "FinOps Cloud Cost Management",
  },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const gcpKeyPath =
  process.env.GCP_KEY_PATH || "../private/finops-501204-4ad6dd107756.json";
const gcpKeyFile = path.resolve(__dirname, gcpKeyPath);
const bigquery = new BigQuery({ keyFilename: gcpKeyFile });

export const dashboardController = {
  getDashboard: async (req: Request, res: Response) => {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId)
        return res
          .status(401)
          .json({ message: "please re-authenticate yourself." });

      const organization = await Organization.findById(organizationId).lean();
      if (!organization)
        return res.status(404).json({ message: "Organization not found." });

      const cleanOrganization = deleteInvalidCloudFromResponse(organization);
      const cloudConnections = cleanOrganization.cloudConnections || {};

      let results: ICostResult = { azure: [], aws: [], gcp: [] };

      const entries = Object.entries(cloudConnections) as [
        ECloudPlatforms,
        any,
      ][];

      for (const [platform, details] of entries) {
        if (platform === ECloudPlatforms.AZURE) {
          const creds: IAzureCredentials = {
            clientId: details.clientId,
            tenantId: details.tenantId,
            clientSecret: details.clientSecretEncrypted,
            subscriptionId: details.subscriptionId,
          };
          results.azure = await connectAndGetAzureDashboard(creds);
        } else if (platform === ECloudPlatforms.AWS) {
          const ceClient = new CostExplorerClient({
            region: details.targetRegion || "us-east-1",
            credentials: {
              accessKeyId: details.awsAccessKey,
              secretAccessKey: decryptSecret(details.awsSecretKeyEncrypted),
            },
          });
          results.aws = await connectAndGetAwsDashboard(ceClient);
        } else if (platform === ECloudPlatforms.GCP) {
          results.gcp = await connectAndGetGcpDashboard(
            details.clientProjectId,
            details.clientDatasetId,
          );
        }
      }

      
      
      const recommendations = await analyseCostUsingOpenAi(results);
      return res.status(200).json(recommendations);
    } catch (error: any) {
      const isLimitExceeded =
        error?.response?.status === 429 ||
        error?.message?.includes("limit exceeded") ||
        error?.message?.includes("exceeded") ||
        error?.message?.includes("too many requests");

      return res.status(isLimitExceeded ? 429 : 500).json({
        message: error?.message || "Internal Server Error",
      });
    }
  },

  resizeResource: async (req: Request, res: Response) => {
    try {
      const {
        platform,
        actionType,
        resourceName,
        resourceGroupName,
        recommendation,
        targetSize,
      } = req.body;

      const organization = await Organization.findById(
        req.user?.organizationId,
      ).lean();
      if (!organization)
        return res
          .status(401)
          .json({ message: "please authenticate yourself" });

      const result = await optimizeCost(
        platform,
        actionType,
        resourceName,
        resourceGroupName,
        organization as any,
        recommendation,
        targetSize,
      );
      return res.status(202).json({ result });
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: error?.message || "Internal Server Error" });
    }
  },
};

//-----------------------------------------Dashboard helper functions-------------------------------------

interface IAzureCredentials {
  clientId: string;
  clientSecret: string;
  subscriptionId: string;
  tenantId: string;
}

interface ICostResult {
  azure?: any[];
  aws?: any[];
  gcp?: any[];
}

function deleteInvalidCloudFromResponse(org: any) {
  if (!org) return org;
  const organization = JSON.parse(JSON.stringify(org));
  const connections = organization.cloudConnections;
  if (!connections) return organization;

  if (
    connections.azure &&
    (!connections.azure.clientId ||
      !connections.azure.tenantId ||
      connections.azure.connectionStatus !== ConnectionStatus.CONNECTED)
  ) {
    delete connections.azure;
  }
  if (
    connections.aws &&
    (!connections.aws?.awsAccessKey ||
      !connections.aws?.awsSecretKeyEncrypted ||
      connections.aws.connectionStatus !== ConnectionStatus.CONNECTED)
  ) {
    delete connections.aws;
  }
  if (
    connections.gcp &&
    (!connections.gcp.clientProjectId ||
      !connections.gcp.clientDatasetId ||
      connections.gcp.connectionStatus !== ConnectionStatus.CONNECTED)
  ) {
    delete connections.gcp;
  }
  return organization;
}

async function connectAndGetAzureDashboard(details: IAzureCredentials) {
  try {
    const decryptedSecret = decryptSecret(details.clientSecret);
    const clientCredentials = new ClientSecretCredential(
      details.tenantId,
      details.clientId,
      decryptedSecret,
    );
    const costClient = new CostManagementClient(clientCredentials);

    const queryDefinition: any = {
      type: "ActualCost",
      timeframe: "TheLastBillingMonth",
      dataset: {
        granularity: "None",
        aggregation: { totalCost: { name: "Cost", function: "Sum" } },
        grouping: [
          { type: "Dimension", name: "ServiceName" },
          { type: "Dimension", name: "ResourceGroup" },
          { type: "Dimension", name: "ResourceId" },
        ],
      },
    };

    const costData = await costClient.query.usage(
      `subscriptions/${details.subscriptionId}`,
      queryDefinition,
    );
    return (
      costData?.rows?.map((row: any) => ({
        service: row[1],
        cost: row[0],
        currency: row[4],
        resourceGroup: row[2],
        resourceName: row[3],
      })) || []
    );
  } catch (error: any) {
    throw new Error(
      error?.message || "Something went wrong fetching Azure metrics.",
    );
  }
}

async function connectAndGetGcpDashboard(projectId: string, datasetId: string) {
  try {
    const query = `SELECT * FROM \`${projectId}.${datasetId}.mock_billing_export\``;
    const [rows] = await bigquery.query({ query });
    return rows;
  } catch (error: any) {
    throw new Error(`GCP Fetch Failure: ${error.message}`);
  }
}

async function connectAndGetAwsDashboard(
  ceClient: CostExplorerClient,
): Promise<any> {
  try {
    const cost = await ceClient.send(
      new GetCostAndUsageCommand({
        Granularity: "DAILY",
        Metrics: ["UnblendedCost"],
        TimePeriod: { Start: "2026-01-01", End: "2026-06-06" },
      }),
    );
    return cost.ResultsByTime || [];
  } catch (error: any) {
    console.error("AWS Cost Explorer error:", error);
    return [];
  }
}

async function analyseCostUsingOpenAi(rawCostData: ICostResult) {
  if (
    !rawCostData.azure?.length &&
    !rawCostData.aws?.length &&
    !rawCostData.gcp?.length
  )
    return [];

  const prompt =
    "You are a FinOps AI Agent. Analyze the following raw cloud resource spending data and identify cost optimizations. Look for anomalies or high-spend areas. The resourceName property must be mapped to the actual infrastructure resource name.";

  const systemInstruction = `You are an expert multi-cloud FinOps AI Agent auditing Azure, AWS, and GCP infrastructure spend.
Analyze the provided JSON cost data and produce cost optimization recommendations strictly matching the requested structural schema.

CRITICAL PARSING & DATA VALIDATION RULES:

1. SOURCE INPUT DATA MAPPING:
   You will receive data adhering to the following structures. Map them explicitly to the output schema:
   - For Azure Input Row: Contains 'service', 'cost', 'currency', 'resourceGroup', and 'resourceName'.
     * Map 'resourceName' -> Output 'resourceName' (clean resource name identifier).
     * Map 'resourceGroup' -> Output 'resourceGroupName'.
   - For AWS Input Row: Contains 'service', 'cost', and 'currency'.
     * Since explicit Resource IDs are missing in this raw AWS payload, extract the structural asset metadata from 'service' or identify the component type -> Output 'resourceName'. 
     * Map the generic target deployment scope or 'Global/Region' -> Output 'resourceGroupName'.
   - For GCP Input Row: Contains 'billing_account_id', 'service' (id/description), 'sku' (id/description), 'usage_start_time', 'cost', 'currency', and 'project' (id).
     * Map 'sku.id' -> Output 'resourceName'. If 'sku.id' is missing or unpopulated, use the instance/bucket name if visible in metadata; otherwise fallback to an empty string "".
     * Map 'project.id' -> Output 'resourceGroupName'.

2. AVOID WORKSPACE CLUSTER DUPLICATION (MANAGED ANALYTICS LAYER):
   - DO NOT issue individual 'SHUTDOWN_VM' recommendations for individual worker nodes, worker skus, or runner instances that live inside managed cloud clusters (e.g., Azure Databricks workspaces, AWS EMR environments, or GCP Dataproc/GKE nodes).
   - Instead, group the lines by their operational context (e.g., matching GCP Project IDs, AWS Services, or Azure Resource Groups) and create a single consolidated 'NONE' or 'RESIZE_VM' recommendation targeting the parent multi-node workspace orchestration asset.

3. ACCURATE FINANCIALS & FIELD CONSISTENCY:
   - Always output 'estimatedSavings' and 'cost' as real numeric values in the actual localized currency provided in the data row. 
   - Since GCP 'cost' comes in as a string representation (e.g., "142.50"), you MUST clean, parse, and cast it into a standard JSON float NUMBER during evaluation.
   - Strict Clean Validation rules for 'targetSize':
     * If 'actionType' is 'SHUTDOWN_VM' or 'NONE' -> 'targetSize' MUST be an empty string "".
     * If 'actionType' is 'RESIZE_VM' -> 'targetSize' MUST be a concrete, recommended cheaper tier SKU or instance dimension string.

4. STRICT STRUCTURAL SCHEMA:
   - The output MUST be a valid JSON object containing exactly one root key: 'recommendations'.
   - The value of 'recommendations' MUST be an array of recommendation objects.
   - Each recommendation object MUST strictly contain the following keys and type constraints:
     * 'platform': STRING (Value must be exactly one of: "azure", "aws", "gcp" in lowercase)
     * 'actionType': STRING (Value must be exactly one of: "SHUTDOWN_VM", "RESIZE_VM", "NONE")
     * 'resourceName': STRING (Azure: clean resource name, AWS: explicit Resource ID or type identifier, GCP: sku.id string or fallback empty string "")
     * 'resourceGroupName': STRING (Azure: resourceGroup, AWS: Region/Scope, GCP: project.id string)
     * 'targetSize': STRING (Empty string "" for SHUTDOWN_VM or NONE; SKU definition string for RESIZE_VM)
     * 'finding': STRING (Clear structural prose detailing the anomaly, over-provisioning footprint, or idle run)
     * 'recommendation': STRING (Actionable, step-by-step configuration and cloud console path adjustments required to execute the optimization)
     * 'estimatedSavings': NUMBER (Calculated real numeric value using the original row's currency scale)
     * 'cost': NUMBER (Parsed numeric float value representing the current baseline spend context)
     * 'currency': STRING (The 3-letter currency asset tracking code from the input segment, e.g., "USD")
`;
  const dataChunk = chunkArray(rawCostData, 200);
  try {
    const azureAnalysisPromises = (dataChunk.azure || []).map(
      async (chunk: any) => {
        const chunkPrompt = `${prompt} Chunked Cost Data: ${JSON.stringify({ azure: chunk })}`;
        return await analyseUsingGemini(systemInstruction, chunkPrompt);
      },
    );

    const awsAnalysisPromises = (dataChunk.aws || []).map(
      async (chunk: any) => {
        const chunkPrompt = `${prompt} Chunked Cost Data: ${JSON.stringify({ aws: chunk })}`;
        return await analyseUsingGemini(systemInstruction, chunkPrompt);
      },
    );

    const gcpAnalysisPromises = (dataChunk.gcp || []).map(
      async (chunk: any) => {
        const chunkPrompt = `${prompt} Chunked Cost Data: ${JSON.stringify({ gcp: chunk })}`;
        return await analyseUsingGemini(systemInstruction, chunkPrompt);
      },
    );

    const [azureResults, awsResults, gcpResults] = await Promise.all([
      Promise.allSettled(azureAnalysisPromises),
      Promise.allSettled(awsAnalysisPromises),
      Promise.allSettled(gcpAnalysisPromises),
    ]);

    const combinedRecommendations: any[] = [];
    let hadGeminiFailure = false;

    [...azureResults, ...awsResults, ...gcpResults].forEach((result) => {
      if (result.status === "fulfilled") {
        combinedRecommendations.push(...result.value);
      } else {
        console.warn(
          "⚠️ Gemini chunk parsing failed:",
          result.reason?.message || result.reason,
        );
        hadGeminiFailure = true;
      }
    });

    if (hadGeminiFailure && combinedRecommendations.length === 0) {
      throw new Error("Gemini quota exhaustion triggered mid-flight.");
    }

    return combinedRecommendations;
  } catch (error: any) {
    console.warn(
      "🔴 Gemini Free pipeline hit rate limits or failed. Running OpenRouter fallback...",
    );

    try {
      // Use your alternative OpenRouter / Qwen route instead
      const azureFallbackPromises = (dataChunk.azure || []).map(
        async (chunk: any) => {
          const chunkPrompt = `${prompt} Chunked Cost Data: ${JSON.stringify({ azure: chunk })}`;
          return await analyseUsingOpenRouter(systemInstruction, chunkPrompt);
        },
      );

      const awsFallbackPromises = (dataChunk.aws || []).map(
        async (chunk: any) => {
          const chunkPrompt = `${prompt} Chunked Cost Data: ${JSON.stringify({ aws: chunk })}`;
          return await analyseUsingOpenRouter(systemInstruction, chunkPrompt);
        },
      );

      const gcpFallbackPromises = (dataChunk.gcp || []).map(
        async (chunk: any) => {
          const chunkPrompt = `${prompt} Chunked Cost Data: ${JSON.stringify({ gcp: chunk })}`;
          return await analyseUsingOpenRouter(systemInstruction, chunkPrompt);
        },
      );

      const [fallbackAzure, fallbackAws, fallbackGcp] = await Promise.all([
        Promise.allSettled(azureFallbackPromises),
        Promise.allSettled(awsFallbackPromises),
        Promise.allSettled(gcpFallbackPromises),
      ]);

      const fallbackRecommendations: any[] = [];

      [...fallbackAzure, ...fallbackAws, ...fallbackGcp].forEach((result) => {
        if (result.status === "fulfilled") {
          fallbackRecommendations.push(...result.value);
        } else {
          console.error(
            "❌ OpenRouter fallback route failed chunk processing:",
            result.reason?.message || result.reason,
          );
        }
      });

      return fallbackRecommendations;
    } catch (fallbackError: any) {
      console.error(
        "💥 Critical Failure: Both LLM systems failed.",
        fallbackError.message,
      );
      return [];
    }
  }
}

async function analyseUsingGemini(systemInstruction: string, prompt: string) {
  const response = await gemini.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["recommendations"],
        properties: {
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: [
                "platform",
                "actionType",
                "targetSize",
                "resourceName",
                "resourceGroupName",
                "finding",
                "recommendation",
                "estimatedSavings",
                "cost",
                "currency",
              ],
              properties: {
                platform: { type: Type.STRING, enum: ["aws", "azure", "gcp"] },
                actionType: {
                  type: Type.STRING,
                  enum: ["SHUTDOWN_VM", "RESIZE_VM", "NONE"],
                },
                targetSize: { type: Type.STRING },
                resourceName: { type: Type.STRING },
                resourceGroupName: { type: Type.STRING },
                finding: { type: Type.STRING },
                recommendation: { type: Type.STRING },
                estimatedSavings: { type: Type.NUMBER },
                cost: { type: Type.NUMBER },
                currency: { type: Type.STRING },
              },
            },
          },
        },
      },
    },
  });

  const textResult = response.text;
  if (!textResult) return [];
  const parsedContent = JSON.parse(textResult);
  return parsedContent.recommendations || [];
}

async function optimizeCost(
  platform: string,
  actionType: string,
  resourceName: string,
  resourceGroupName: string,
  details: IOrganization,
  recommendation: string,
  targetSize?: string,
) {
  const normalizedPlatform = platform.toLowerCase();
  switch (normalizedPlatform) {
    case "azure":
      if (!details?.cloudConnections?.azure) return [];
      return await azureOptimizeCost(
        actionType,
        resourceName,
        resourceGroupName,
        recommendation,
        details.cloudConnections.azure as any,
      );
    case "aws":
      return await awsOptimizeCost(
        actionType,
        resourceName,
        resourceGroupName,
        recommendation,
      );
    case "gcp":
      return await gcpOptimizeCost(
        actionType,
        resourceName,
        resourceGroupName,
        recommendation,
      );
    // ✅ FIX: Added a default fallback to clear the "Not all code paths return a value" error
    default:
      return [];
  }
}

async function azureOptimizeCost(
  actionType: string,
  resourceName: string,
  resourceGroupName: string,
  recommendation: string,
  azure: any,
) {
  return [];
}
async function awsOptimizeCost(
  actionType: string,
  resourceName: string,
  resourceGroupName: string,
  recommendation: string,
) {
  return [];
}
async function gcpOptimizeCost(
  actionType: string,
  resourceName: string,
  resourceGroupName: string,
  recommendation: string,
) {
  return [];
}

function chunkArray(array: any, chunkSize: number): any {
  const chunks: { azure: any[]; aws: any[]; gcp: any[] } = {
    azure: [],
    aws: [],
    gcp: [],
  };
  if (array?.azure?.length) {
    for (let i = 0; i < array.azure.length; i += chunkSize)
      chunks.azure.push(array.azure.slice(i, i + chunkSize));
  }
  if (array?.aws?.length) {
    for (let i = 0; i < array.aws.length; i += chunkSize)
      chunks.aws.push(array.aws.slice(i, i + chunkSize));
  }
  if (array?.gcp?.length) {
    for (let i = 0; i < array.gcp.length; i += chunkSize)
      chunks.gcp.push(array.gcp.slice(i, i + chunkSize));
  }
  return chunks;
}

async function analyseUsingOpenRouter(
  systemInstruction: string,
  chunkPrompt: string,
) {
  try {
    const costSchema = {
      type: "object",
      additionalProperties: false, // <-- REQUIRED AT ROOT
      properties: {
        recommendations: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false, // <-- REQUIRED IN ARRAY ITEMS
            properties: {
              platform: { type: "string", enum: ["aws", "azure", "gcp"] },
              actionType: {
                type: "string",
                enum: ["SHUTDOWN_VM", "RESIZE_VM", "NONE"],
              },
              targetSize: { type: "string" },
              resourceName: {
                type: "string",
                description:
                  "Actual resource name for azure, region for aws, or project ID for gcp.",
              },
              resourceGroupName: {
                type: "string",
                description:
                  "Resource group for azure, region for aws, or project ID for gcp.",
              },
              finding: { type: "string" },
              recommendation: { type: "string" },
              estimatedSavings: { type: "number" },
              cost: { type: "number" },
              currency: { type: "string" },
            },
            required: [
              "platform",
              "actionType",
              "targetSize",
              "resourceName",
              "resourceGroupName",
              "finding",
              "recommendation",
              "estimatedSavings",
              "cost",
              "currency",
            ],
          },
        },
      },
      required: ["recommendations"],
    };

    const response = await openai.chat.completions.create({
       model:"openrouter/auto",
      //model: "qwen/qwen3-coder:free",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: systemInstruction,
        },
        { role: "user", content: chunkPrompt },
      ],

      // Correct payload syntax for OpenRouter wrapper

      response_format: {
        type: "json_schema",

        json_schema: {
          name: "cost_recommendations",
          strict: true,
          schema: costSchema,
        },
      },
    });

    const textResult = response.choices?.[0]?.message?.content;

    if (!textResult) return [];
    const parsedContent = JSON.parse(textResult);
    return Array.isArray(parsedContent.recommendations)
      ? parsedContent.recommendations
      : [];
  } catch (error: any) {
    throw new Error(error);
  }
}
