import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, BadgeDollarSign, BrainCircuit, ChartColumn, Loader2, PlusCircle, RefreshCcw, RefreshCw, ShieldAlert, UsersRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {  getDashboard } from "../lib/api";
import { getStoredToken } from "../lib/auth";
import { DashboardSummary } from "@shared/types";
import { PlatformCard } from "../components/PlatformCard";
import { StatCard } from "../components/StatCard";
import { useState } from "react";
import {useQueryClient} from "@tanstack/react-query";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

interface IPlatformCost {
  platform: string;
  cost: number;
}



export default function DashboardPage() {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const {data:dashboardData,isFetching} = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    retry:false
   
  });
  const dashboard:any[] = dashboardData||[]




const totalSpend = dashboard.reduce((total, item) => total + item.cost, 0);
const totalSavingOpportunity = dashboard.reduce((total, item) => total + item.estimatedSavings, 0);
const platformWiseSpent: Record<string, number> ={}
 dashboard.forEach((item) => {
 if (!item.platform) return;
  const cost = item.cost || 0; 
  platformWiseSpent[item.platform] = (platformWiseSpent[item.platform] ?? 0) + cost;
 })

 const platformWiseSavingOpportunity: Record<string, number> ={}
 dashboard.forEach((item) => {
  if (!item.platform) return;
   const cost = item.estimatedSavings || 0; 
   platformWiseSavingOpportunity[item.platform] = (platformWiseSavingOpportunity[item.platform] ?? 0) + cost;
 })

 const platforms = Array.from(new Set(dashboard.map((item) => item.platform).filter(Boolean)));

type GroupedData = Record<string, IPlatformCost[]>

const platformWiseData = dashboard.reduce<GroupedData>((acc, item) => {
  if (!item.platform) return acc;

  // Fallback to an empty array if it doesn't exist yet
  const platformArray = acc[item.platform] || [];
  
  platformArray.push({ ...item });
  
  // Assign it back to the accumulator
  acc[item.platform] = platformArray;

  return acc;
}, {});

 //const dashboard:any= undefined

 if(isFetching) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>

  function handleRefresh(): void {
   queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(8,15,28,0.94),rgba(14,23,41,0.92))] p-6 shadow-glow">
        <div className="absolute inset-0 bg-radial-grid bg-[size:20px_20px] opacity-30" />
        <div className="relative flex flex-col gap-6 md:flex-row items-center justify-center md:justify-between">
         
           <div className="flex gap-3 flex-col sm:gap-5 sm:flex-row">
            <StatCard label="Total spend" value={dashboard  ? formatCurrency(totalSpend) : "--"} />
            <StatCard label="Opportunity" value={dashboard ? formatCurrency(totalSavingOpportunity) : "--"} />
            
          </div>
          <div className="grid gap-3 rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-300 sm:min-w-[280px]">
            <button
              type="button"
              onClick={() => navigate("/organization-users")}
              className="inline-flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10"
            >
              <span className="flex items-center gap-2 text-slate-100">
                <UsersRound className="h-4 w-4 text-cyan-300" />
                Add organization user
              </span>
              <PlusCircle className="h-4 w-4 text-cyan-300" />
            </button>
            <button
              type="button"
              onClick={() => navigate("/cloud-platforms")}
              className="inline-flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10"
            >
              <span className="flex items-center gap-2 text-slate-100">
                <BadgeDollarSign className="h-4 w-4 text-cyan-300" />
                Add cloud platform
              </span>
              <PlusCircle className="h-4 w-4 text-cyan-300" />
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-white">Platform overview</h3>

               <RefreshCw className="h-5 w-5 text-cyan-300 hover:animate-spin hover:cursor-pointer active:animate-none active:cursor-default " onClick={() => handleRefresh()} />
            </div>
           
            <ArrowUpRight className="h-5 w-5 text-cyan-300" />
          </div>

          {platforms.map((platform, idx) => (
            
           <PlatformCard key={platform} platform={platform} totalSavingOpportunity={platformWiseSavingOpportunity[platform]??0} totalCost={platformWiseSpent[platform]??0} platformData={platformWiseData[platform]} />
          ))}
          
         
        </div>

      </section>
    </div>
  );
}


