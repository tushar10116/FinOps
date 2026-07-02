import { Fragment, useState } from "react";
import type { ChangeEventHandler, ReactNode } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CloudCog,
  Edit,
  Edit2Icon,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getOrganization,
  registerCloud,
  updateConnectionStatus,
} from "../lib/organization";
import { IOrganizationCloudResponse } from "@shared/types";
import InputField from "../components/InputField";
import Field from "../components/Field";
import Label from "../components/Label";
import SelectField from "../components/SelectField";

export interface CloudCredentials {
  id?: string;
  platform: string;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  subscriptionId?: string;
  awsAccessKey?: string;
  awsSecretKey?: string;
  targetRegion?: string;
  clientProjectId?: string;
  clientDatasetId?: string;
}

const defaultCredentials: CloudCredentials = {
  platform: "gcp",
  tenantId: "",
  clientId: "",
  clientSecret: "",
  subscriptionId: "",
  awsAccessKey: "",
  awsSecretKey: "",
  targetRegion: "",
  clientProjectId: "",
  clientDatasetId: "",
};

export default function CloudConnectPage() {
  const [credentials, setCredentials] =
    useState<CloudCredentials>(defaultCredentials);

  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const [editFlag, setEditFlag] = useState(false);
  const [messageTone, setMessageTone] = useState<
    "success" | "error" | "info" | ""
  >("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: organization } = useQuery<IOrganizationCloudResponse>({
    queryKey: ["organization"],
    queryFn:async () =>await getOrganization(),
  });

  const totalPlatforms = organization?.cloudConnections
    ? Object.keys(organization.cloudConnections).length
    : 0;

  const clouds = organization?.cloudConnections
    ? Object.entries(organization.cloudConnections).map(
        ([platform, details]) => ({
          platform,
          ...details,
        }),
      )
    : [];

  const connectedClouds = clouds.filter(
    (c) => c.connectionStatus === "CONNECTED",
  );

  //mutations

  const registerMutation = useMutation({
    mutationFn: registerCloud,
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey:['organization'],exact:false})
      setCredentials(defaultCredentials);
      setMessage("Cloud platform registered successfully");
      setMessageTone("success");
      setEditFlag(false);
      window.setTimeout(() => {
        setMessage("");
        setMessageTone("");
      }, 3000);
    },
    onError: (error) => {
      setCredentials(defaultCredentials);
      setEditFlag(false);
      setMessage(error.message);
      setMessageTone("error");
      setTimeout(() => {
        setMessage("");
        setMessageTone("");
      }, 3000);
    },
  });

  const connectMutation = useMutation({
    mutationFn:updateConnectionStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      setLoading("");
      setMessage("");
      setMessageTone("");
    },
    onError: (error) => {
      setLoading("");

      setMessage(error.message);
      setMessageTone("error");

      setTimeout(() => {
        setMessage("");
        setMessageTone("");
      }, 3000);
    },
  });

  //CRUD functions

  const handleInputChange: ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement
  > = (event) => {
    if(event.target.name==="platform"){
      setEditFlag(false)
      setCredentials(defaultCredentials);
    }
    const { name, value } = event.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = () => {
    if (credentials.platform === "azure" && (
      !credentials.tenantId ||
      !credentials.clientId ||
      !credentials.clientSecret ||
      !credentials.subscriptionId
    )) {
      setMessage("Please fill in all fields");
      setMessageTone("error");
      return;
    }

    if(credentials.platform === "aws" && (
      !credentials.awsAccessKey ||
      !credentials.awsSecretKey || 
      !credentials.targetRegion
    )){
      setMessage("Please fill in all fields");
      setMessageTone("error");
      return;
    }

    if(credentials.platform === "gcp" && (
      !credentials.clientProjectId ||
      !credentials.clientDatasetId
    )){
      setMessage("Please fill in all fields");
      setMessageTone("error");
      return;
    }

    registerMutation.mutate(credentials);
 
 
  };

  const handleConnect = async (platform: CloudCredentials,status:string) => {
    setLoading(platform.platform);
    setMessage("");
    setMessageTone("info");

    connectMutation.mutate({platform:platform.platform,status:status});
  };

  const handleRemove = (id: string | undefined) => {};

  function handleEdit(platform: any): void {
    setEditFlag(true);
    
    switch (platform.platform) {
      case "azure": {

        console.log("Azure platform details:", platform);
        setCredentials(prev=>({...prev,
          tenantId: platform.tenantId,
          clientId: platform.clientId,
          clientSecret: "",
          platform: platform.platform,
          subscriptionId: platform.subscriptionId,
        }));
        break;
      }
      case "aws": {
        setCredentials(prev=>({...prev,
          awsAccessKey: platform.awsAccessKey,
          awsSecretKey: "",
          targetRegion: platform.targetRegion,
          platform: platform.platform,
        }));
        break;
      }
    }
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(8,15,28,0.94),rgba(14,23,41,0.92))] p-6 shadow-glow">
        <div className="absolute inset-0 bg-radial-grid bg-[size:20px_20px] opacity-30" />
        <div className="relative flex flex-row items-center justify-between ">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.3em] text-emerald-200">
              <CloudCog className="h-3.5 w-3.5" />
              Cloud platforms
            </span>
           
          </div>
           <div className="flex flex-col space-between gap-1 rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-300 sm:min-w-[70px]">
            <div className="flex items-center justify-between gap-4">
              <span>Platforms</span>
              <strong className="text-white">{totalPlatforms}</strong>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Ready</span>
              <strong className="text-white">{connectedClouds.length}</strong>
            </div>
          </div>
         
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">
                Registration
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-white">
                Register cloud platform
              </h3>
            </div>
            <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300">
              <Plus className="h-5 w-5" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <Label htmlFor="platform">Platform</Label>
              <SelectField
                id="platform"
                name="platform"
                value={credentials.platform}
                onChange={handleInputChange}
              >
                <option value="azure">Azure</option>
                <option value="aws">AWS</option>
                <option value="gcp">GCP</option>
              </SelectField>
            </Field>
          {credentials.platform === "azure" && (<>
            <Field>
              <Label htmlFor="tenantId">Tenant ID</Label>
              <InputField
                id="tenantId"
                name="tenantId"
                value={credentials.tenantId||""}
                onChange={handleInputChange}
                placeholder="Enter tenant ID"
              />
            </Field>

            <Field>
              <Label htmlFor="clientId">Client ID</Label>
              <InputField
                id="clientId"
                name="clientId"
                value={credentials.clientId||""}
                onChange={handleInputChange}
                placeholder="Enter client ID"
              />
            </Field>

            <Field>
              <Label htmlFor="clientSecret">Client Secret</Label>
              <InputField
                id="clientSecret"
                name="clientSecret"
                value={credentials.clientSecret||""}
                onChange={handleInputChange}
                placeholder="Enter client secret"
                type="password"
              />
            </Field>

            <Field className="sm:col-span-2">
              <Label htmlFor="subscriptionId">Subscription ID</Label>
              <InputField
                id="subscriptionId"
                name="subscriptionId"
                value={credentials.subscriptionId||""}
                onChange={handleInputChange}
                placeholder="Enter subscription ID"
              />
            </Field>
            </>) 
            }
            {credentials.platform === "aws" && (<>
            <Field>
              <Label htmlFor="accessKey">Access Key</Label>
              <InputField
                id="accessKey"
                name="awsAccessKey"
                value={credentials.awsAccessKey||""}
                onChange={handleInputChange}
                placeholder="Enter access key"
              />
            </Field>

            <Field>
              <Label htmlFor="secretKey">Secret Key</Label>
              <InputField
               type="password"
                id="secretKey"
                name="awsSecretKey"
                value={credentials.awsSecretKey||""}
                onChange={handleInputChange}
                placeholder="Enter secret key"
              />
            </Field>
             <Field>
              <Label htmlFor="targetRegion">Target Region</Label>
              <InputField
              
                id="targetRegion"
                name="targetRegion"
                value={credentials.targetRegion||""}
                onChange={handleInputChange}
                placeholder="Enter target region"
              />
            </Field>
            </>) 
            }
            {credentials.platform === "gcp" && (<>
            <Field>
              <Label htmlFor="clientProjectId">Project ID</Label>
              <InputField
                id="clientProjectId"
                name="clientProjectId"
                value={credentials.clientProjectId||""}
                onChange={handleInputChange}
                placeholder="Enter project ID"
              />
            </Field>

            <Field>
              <Label htmlFor="clientDatasetId">Dataset ID</Label>
              <InputField
                id="clientDatasetId"
                name="clientDatasetId"
                value={credentials.clientDatasetId||""}
                onChange={handleInputChange}
                placeholder="Enter dataset ID"
              />
            </Field>
            
            </>)
            }
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleRegister}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              {editFlag ? (
                <>
                  Update Platform <Edit2Icon className="h-3 w-3" />
                </>
              ) : (
                <>
                  {" "}
                  Register platform
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
            >
              Back to dashboard
            </button>
          </div>

          {message ? (
            <div
              className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
                messageTone === "success"
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                  : messageTone === "error"
                    ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
                    : "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
              }`}
            >
              {message}
            </div>
          ) : null}
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/70 p-6 shadow-glow sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">
                Registered platforms
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-white">
                Saved credentials
              </h3>
            </div>
            <CheckCircle2 className="h-5 w-5 text-cyan-300" />
          </div>

          {clouds.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">
              No platforms registered yet. Add one on the left to begin.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {clouds.map((platform: any,idx:number) => <Fragment key={idx}>
               {(platform.platform==="azure" && <article
                  key={idx}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        {platform.platform.toUpperCase()}
                      </h4>
                      <p className="mt-1 text-sm text-slate-400">
                        <span className="text-slate-200">Tenant:</span>{" "}
                        {platform.tenantId}...
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        <span className="text-slate-200">Subscription:</span>{" "}
                        {platform.subscriptionId}...
                      </p>
                    </div>
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-emerald-200">
                      {platform.connectionStatus}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    {platform.connectionStatus !== "CONNECTED" && (
                      <button
                        type="button"
                        onClick={() => handleConnect(platform,'CONNECTED')}
                        disabled={loading===platform.platform}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading===platform.platform ? "Connecting..." : "Connect"}
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
                    {platform.connectionStatus !== "UNLINKED" && (
                      <button
                        type="button"
                        onClick={() => handleConnect(platform,'UNLINKED')}
                        disabled={loading===platform.platform}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading===platform.platform ? "UNLINKING..." : "UNLINK"}
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleEdit(platform)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
                    >
                      Edit
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(platform.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
                    >
                      Remove
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>)}

               { platform.platform==="aws" && <article
                  key={idx}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        {platform.platform.toUpperCase()}
                      </h4>
                      <p className="mt-1 text-sm text-slate-400">
                        <span className="text-slate-200">Region:</span>{" "}
                        {platform.targetRegion}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        <span className="text-slate-200">Access Key:</span>{" "}
                        {platform.awsAccessKey}
                      </p>
                      
                    </div>
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-emerald-200">
                      {platform.connectionStatus}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    {platform.connectionStatus !== "CONNECTED" && (
                      <button
                        type="button"
                        onClick={() => handleConnect(platform,'CONNECTED')}
                        disabled={loading===platform.platform}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading===platform.platform ? "Connecting..." : "Connect"}
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
                    {platform.connectionStatus !== "UNLINKED" && (
                      <button
                        type="button"
                        onClick={() => handleConnect(platform,'UNLINKED')}
                        disabled={loading===platform.platform}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading===platform.platform ? "UNLINKING..." : "UNLINK"}
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleEdit(platform)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
                    >
                      Edit
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(platform.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
                    >
                      Remove
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>}
                { platform.platform==="gcp" && <article
                  key={idx}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        {platform.platform.toUpperCase()}
                      </h4>
                     
                      <p className="mt-1 text-sm text-slate-400">
                        <span className="text-slate-200">Project ID:</span>{" "}
                        {platform.clientProjectId}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        <span className="text-slate-200">Dataset ID:</span>{" "}
                        {platform.clientDatasetId}
                      </p>
                      
                    </div>
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-emerald-200">
                      {platform.connectionStatus}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    {platform.connectionStatus !== "CONNECTED" && (
                      <button
                        type="button"
                        onClick={() => handleConnect(platform,'CONNECTED')}
                        disabled={loading===platform.platform}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading===platform.platform ? "Connecting..." : "Connect"}
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
                    {platform.connectionStatus !== "UNLINKED" && (
                      <button
                        type="button"
                        onClick={() => handleConnect(platform,'UNLINKED')}
                        disabled={loading===platform.platform}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading===platform.platform ? "UNLINKING..." : "UNLINK"}
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleEdit(platform)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
                    >
                      Edit
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(platform.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
                    >
                      Remove
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>}
                </Fragment>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}






