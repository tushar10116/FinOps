import { CircleDollarSign, CloudCog } from "lucide-react";
import { formatCurrency } from "../pages/DashboardPage";
import { StatCard } from "./StatCard";
import { useMutation } from "@tanstack/react-query";
import { resizeResource } from "../lib/dashboard";
import { IOptimizeCostPayload } from "@shared/types";
import { useState } from "react";

const perPage = 3; // Number of platforms to display per page

export function PlatformCard({
  platform,
  platformData,
  totalCost,
  totalSavingOpportunity,
}: {
  platform: string;
  platformData: any;
  totalCost: number;
  totalSavingOpportunity: number;
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const resizeMutation = useMutation({
    mutationFn: ({
      platform,
      resourceName,
      resourceGroupName,
      recommendation,
      targetSize,
    }: IOptimizeCostPayload) =>
      resizeResource(
        platform,
        "RESIZE_VM",
        resourceName,
        resourceGroupName,
        recommendation,
        targetSize,
      ),
  });

  function handleResize(
    platform: any,
    resourceName: any,
    resourceGroupName: any,
    recommendation: any,
    targetSize: any,
  ) {
    resizeMutation.mutate({
      platform,
      resourceName,
      resourceGroupName,
      recommendation,
      targetSize,
    });
  }

  function handleShutDown(
    platform: any,
    resourceName: any,
    resourceGroupName: any,
    recommendation: any,
    targetSize: any,
  ) {
    throw new Error("Function not implemented.");
  }

  return (
    <div className="w-full  flex flex-col gap-2">
      <div className="grid grid-rows-3 gap-2 md:grid-cols-3 md:grid-rows-1 items-center justify-center">
        <div className="text-3xl font-semibold p-4">
          {platform[0]?.toUpperCase() + platform.slice(1)}
        </div>
        <div>
          <StatCard
            label="Cost"
            className="bg-red-400 w-full"
            value={formatCurrency(totalCost)}
          />
        </div>
        <div>
          <StatCard
            label="Saving opportunity"
            className="bg-emerald-800 w-full"
            value={formatCurrency(totalSavingOpportunity)}
          />
        </div>
      </div>

      <div className="w-full flex flex-col gap-3 p-4 justify-between">
        {platformData.slice((currentPage - 1) * perPage, currentPage * perPage).map((data: any) => (
          <div
            className="w-full rounded-2xl border border-gray-100/10 bg-gray-800/50 bg-opacity-50 p-4 flex gap-2.5 flex-col"
            key={data.resourceName}
          >
            <div className="w-full flex gap-2.5 flex-col md:flex-row">
              <div>Resource Group</div>
              <div className="space-y-5 flex items-center gap-2 font-semibold">
                <span className="inline-flex items-center gap-2 rounded-full border border-blue-600/20 bg-blue-600/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.3em] text-blue-100">
                  <CloudCog className="h-3.5 w-3.5" />
                  {data.resourceGroupName}
                </span>
              </div>
            </div>
            <div className="w-full flex gap-2.5 flex-col md:flex-row">
              <div>Resource</div>
              <div className="space-y-5 flex items-center gap-2 font-semibold">
                <span className="inline-flex items-center gap-2 rounded-full border border-blue-600/20 bg-blue-600/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.3em] text-blue-100">
                  <CloudCog className="h-3.5 w-3.5" />
                  {data.resourceName}
                </span>
              </div>
            </div>
            <div className="w-full flex gap-2.5 flex-col md:flex-row">
              <div className="w-full flex gap-2.5 flex-col md:flex-row">
                <div>Cost</div>
                <div className="space-y-5 flex items-center gap-2 font-semibold">
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-600/20 bg-blue-600/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.1em] text-blue-100">
                    {formatCurrency(data.cost)}
                  </span>
                </div>
              </div>
              <div className="w-full flex gap-2.5 flex-col md:flex-row">
                <div>Opportunity</div>
                <div className="space-y-5 flex items-center gap-2 font-semibold">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-600/20 bg-emerald-600/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.1em] text-emerald-100">
                    {formatCurrency(data.estimatedSavings)}
                  </span>
                </div>
              </div>
            </div>
            <div className="w-full items-center gap-2 font-normal">
              <div className="inline font-semibold">
                Finding<p className="text-red-300">{data.finding}</p>{" "}
              </div>
            </div>
            <div className="w-full items-center gap-2 font-normal">
              <div className="font-semibold">
                <div className="flex flex-row jutify-between">
                  <span>Suggestion</span>
                  {data.actionType === "NONE" && (
                    <span className="p-1 w-10 ml-1 text-center rounded-full text-xs uppercase border-blue-600/10 border bg-blue-600/20 text-blue-100 ">
                      {" "}
                      DIY
                    </span>
                  )}
                </div>
                <p className="text-sm text-white border border-gray-600 bg-gray-700 bg-opacity-20 p-4 mt-2">
                  {data.recommendation}
                </p>{" "}
              </div>
            </div>
            {data.actionType === "RESIZE" && (
              <div className="w-full">
                <button
                  onClick={() => {
                    handleResize(
                      data.platform,
                      data.resourceName,
                      data.resourceGroupName,
                      data.recommendation,
                      data.targetSize,
                    );
                  }}
                  className="inline-flex h-10 w-25 items-center gap-2 rounded-lg border border-emerald-500 bg-emerald-600/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.1em] hover:bg-emerald-800"
                >
                  <CircleDollarSign className="h-4 w-4" />
                  Resize to {data.targetSize}
                </button>
              </div>
            )}
            {data.actionType === "SHUTDOWN_VM" && (
              <div className="w-full">
                <button
                  onClick={() => {
                    handleShutDown(
                      data.platform,
                      data.resourceName,
                      data.resourceGroupName,
                      data.recommendation,
                      data.targetSize,
                    );
                  }}
                  className="inline-flex h-10 w-25 items-center gap-2 rounded-lg border border-emerald-500 bg-emerald-600/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.1em] hover:bg-emerald-800"
                >
                  <CircleDollarSign className="h-4 w-4" />
                  Shutdown VM
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {perPage < platformData.length && (
        <div className="flex justify-center mt-4">
          <div className="flex gap-2 mr-4">
            {currentPage > 1 && (
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                className="bg-blue-600 text-white px-3 py-1 rounded"
            >
              Previous
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {Array.from(
            { length: Math.ceil(platformData.length / perPage) },
            (_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`${
                  currentPage === index + 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-300 text-gray-700"
                } px-3 py-1 rounded`}
              >
                {index + 1}
              </button>
            ),
          )}
        </div>
        <div className="flex gap-2 ml-4">
          {currentPage < Math.ceil(platformData.length / perPage) && (
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              className="bg-blue-600 text-white px-3 py-1 rounded"
            >
              Next
            </button>
          )}
        </div>
      </div>)}
    </div>
  );
}
