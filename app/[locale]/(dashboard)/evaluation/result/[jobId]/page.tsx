import { getOptimizationStatusAction } from "@/app/actions/optimization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { OptimizationCharts } from "@/components/evaluation/optimization-charts";

interface PageProps {
  params: Promise<{
    locale: string;
    jobId: string;
  }>;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default async function OptimizationResultPage({ params }: PageProps) {
  const { jobId, locale } = await params;
  const result = await getOptimizationStatusAction(jobId);

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-8 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900">Job Not Found</h1>
        <p className="text-gray-500 mt-2">The requested optimization job could not be found.</p>
        <Link href="/evaluation" className="mt-4">
          <Button variant="outline">Back to Evaluations</Button>
        </Link>
      </div>
    );
  }

  const { status, results } = result as any;
  
  // Extract metrics for the highlight table
  const metrics = results ? {
    cabinets: results.optimal_cabinet?.cabinets ?? 0,
    powerRating: results.optimal_cabinet?.p_nom ?? 0,
    energyCapacity: results.optimal_cabinet?.e_nom ?? 0,
    upfrontCost: results.upfront_cost ?? 0,
    grossSavings: results.gross_savings ?? 0,
    spvNpv: results.financial_metrics?.spv_npv ?? 0,
    spvIrr: results.financial_metrics?.spv_irr_value ?? 0,
    breakeven: results.financial_metrics?.spv_breakeven_year ?? 0,
  } : null;

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/evaluation`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">Optimization Results</h1>
                 <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                     status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                     status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
                     'bg-blue-50 text-blue-700 border-blue-200'
                 }`}>
                     {status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                     {status === 'failed' && <XCircle className="h-3 w-3" />}
                     {status === 'processing' && <Loader2 className="h-3 w-3 animate-spin" />}
                     <span className="capitalize">{status}</span>
                 </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1 font-mono">
                Job ID: {jobId}
              </p>
            </div>
          </div>
        </div>

        {results ? (
          <>
            <Card>
                <CardHeader>
                    <CardTitle>Key Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Technical Specs */}
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Optimal Cabinets</p>
                            <p className="text-2xl font-bold">{metrics?.cabinets}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Power Rating</p>
                            <p className="text-2xl font-bold">{metrics?.powerRating} kW</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Energy Capacity</p>
                            <p className="text-2xl font-bold">{metrics?.energyCapacity} kWh</p>
                        </div>
                         <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">SPV Breakeven</p>
                            <p className="text-2xl font-bold">{metrics?.breakeven} Years</p>
                        </div>

                        {/* Financials */}
                         <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Upfront Cost</p>
                            <p className="text-2xl font-bold text-orange-600">{formatCurrency(metrics?.upfrontCost || 0)}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Gross Annual Savings</p>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics?.grossSavings || 0)}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">SPV NPV</p>
                            <p className={`text-2xl font-bold ${(metrics?.spvNpv || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(metrics?.spvNpv || 0)}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">SPV IRR</p>
                            <p className={`text-2xl font-bold ${(metrics?.spvIrr || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatPercent(metrics?.spvIrr || 0)}
                            </p>
                        </div>
                     </div>
                </CardContent>
            </Card>

            <OptimizationCharts results={results} />
        </>
        ) : (
             <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                    <div className="bg-primary/10 p-4 rounded-full">
                        <Clock className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">Results Pending</h3>
                        <p className="text-muted-foreground max-w-sm">
                            This optimization job is currently processing or has no results available.
                        </p>
                    </div>
                </CardContent>
             </Card>
        )}
      </div>
    </main>
  );
}
