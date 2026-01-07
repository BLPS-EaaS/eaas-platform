"use client";

import useSWR from "swr";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useTranslations, useFormatter } from "next-intl";

import { OptimizationCharts } from "@/components/evaluation/optimization-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CabinetComparison } from "@/components/evaluation/cabinet-comparison";

interface OptimizationResultClientProps {
  jobId: string;
  locale: string;
  initialData: any;
}

// SWR key serializer
export function OptimizationResultClient({ jobId, locale, initialData }: OptimizationResultClientProps) {
    const t = useTranslations('OptimizationResults');
    const format = useFormatter();

    const { data: result } = useSWR(
        `optimization-result-${jobId}`, 
        null, 
        {
           fallbackData: initialData,
           revalidateOnFocus: false,
           revalidateIfStale: false,
           revalidateOnReconnect: false
        }
    );

    const { status, company_name, results } = result || {};
    
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
                  <h1 className="text-2xl font-bold tracking-tight">{company_name} {t('title')}:</h1>
                   <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                       status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                       status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
                       'bg-blue-50 text-blue-700 border-blue-200'
                   }`}>
                       {status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                       {status === 'failed' && <XCircle className="h-3 w-3" />}
                       {status === 'processing' && <Loader2 className="h-3 w-3 animate-spin" />}
                       <span className="capitalize">{status ? t(`status.${status}`) : status}</span>
                   </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 font-mono">
                  {t('job_id')}: {jobId}
                </p>
              </div>
            </div>
          </div>
  
          {results ? (
            <>
              <Card>
                  <CardHeader>
                      <CardTitle>{t('metrics.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {/* Technical Specs */}
                          <div className="space-y-1">
                              <p className="text-sm font-medium text-muted-foreground">{t('metrics.optimal_cabinets')}</p>
                              <p className="text-2xl font-bold">{metrics?.cabinets}</p>
                          </div>
                          <div className="space-y-1">
                              <p className="text-sm font-medium text-muted-foreground">{t('metrics.power_rating')}</p>
                              <p className="text-2xl font-bold">{format.number(metrics?.powerRating || 0)} kW</p>
                          </div>
                          <div className="space-y-1">
                              <p className="text-sm font-medium text-muted-foreground">{t('metrics.energy_capacity')}</p>
                              <p className="text-2xl font-bold">{format.number(metrics?.energyCapacity || 0)} kWh</p>
                          </div>
                           <div className="space-y-1">
                              <p className="text-sm font-medium text-muted-foreground">{t('metrics.spv_breakeven')}</p>
                              <p className="text-2xl font-bold">{format.number(metrics?.breakeven || 0, {maximumFractionDigits: 1})}</p>
                          </div>
  
                          {/* Financials */}
                           <div className="space-y-1">
                              <p className="text-sm font-medium text-muted-foreground">{t('metrics.upfront_cost')}</p>
                              <p className="text-2xl font-bold text-orange-600">
                                {format.number(metrics?.upfrontCost || 0, {style: 'currency', currency: 'TWD', maximumFractionDigits: 0})}
                              </p>
                          </div>
                          <div className="space-y-1">
                              <p className="text-sm font-medium text-muted-foreground">{t('metrics.gross_annual_savings')}</p>
                              <p className="text-2xl font-bold text-green-600">
                                {format.number(metrics?.grossSavings || 0, {style: 'currency', currency: 'TWD', maximumFractionDigits: 0})}
                              </p>
                          </div>
                          <div className="space-y-1">
                              <p className="text-sm font-medium text-muted-foreground">{t('metrics.spv_npv')}</p>
                              <p className={`text-2xl font-bold ${(metrics?.spvNpv || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {format.number(metrics?.spvNpv || 0, {style: 'currency', currency: 'TWD', maximumFractionDigits: 0})}
                              </p>
                          </div>
                          <div className="space-y-1">
                              <p className="text-sm font-medium text-muted-foreground">{t('metrics.spv_irr')}</p>
                              <p className={`text-2xl font-bold ${(metrics?.spvIrr || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {format.number(metrics?.spvIrr || 0, {style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2})}
                              </p>
                          </div>
                       </div>
                  </CardContent>
              </Card>

              <CabinetComparison results={results} />
  
              <OptimizationCharts results={results} />
          </>
          ) : (
               <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                      <div className="bg-primary/10 p-4 rounded-full">
                          <Clock className="h-8 w-8 text-primary" />
                      </div>
                      <div className="space-y-2">
                          <h3 className="text-xl font-semibold">{t('pending.title')}</h3>
                          <p className="text-muted-foreground max-w-sm">
                              {t('pending.description')}
                          </p>
                      </div>
                  </CardContent>
               </Card>
          )}
        </div>
      </main>
    );
}
