import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormatter, useTranslations } from "next-intl";
import { type OptimizationFormData } from "@/lib/schemas/optimization-schema";

interface ConfigurationSummaryProps {
  settings?: OptimizationFormData | null;
  locale: string;
}

export function ConfigurationSummary({ settings, locale }: ConfigurationSummaryProps) {
  const t = useTranslations('OptimizationResults.ConfigurationSummary');
  const tBase = useTranslations('EvaluationForm.sections.base_case');
  const tProject = useTranslations('EvaluationForm.sections.project_case');
  const tOptions = useTranslations('EvaluationForm.options');
  const tFinancial = useTranslations('EvaluationForm.sections.financial');
  
  const format = useFormatter();

  if (!settings) {
    return null;
  }

  const { base_case, project_case, financial } = settings;
  const esco = financial.esco;
  const systemCost = financial.system_cost;

  // Helper to render capacities if > 0
  const renderCapacity = (label: string, value: number) => {
    if (!value || value <= 0) return null;
    return (
      <div className="flex justify-between items-center py-1">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="font-medium">{format.number(value)} kW</span>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Base Case Config */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2 border-b pb-1">
            {t('base_case_config')}
          </h4>
          <div className="space-y-1">
             <div className="flex justify-between items-center py-1">
                <span className="text-sm text-muted-foreground">{tBase('tariff_type')}</span>
                <span className="font-medium">
                  {/* @ts-ignore */}
                   {tOptions(base_case.tariff_type)}
                </span>
             </div>
             {renderCapacity(tBase('reg_cap'), base_case.reg_cap_input)}
             {renderCapacity(tBase('half_peak_cap'), base_case.half_peak_cap_input)}
             {renderCapacity(tBase('sat_half_peak_cap'), base_case.sat_half_peak_cap_input)}
             {renderCapacity(tBase('off_cap'), base_case.off_cap_input)}
          </div>
        </div>

        {/* Project Case Config */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2 border-b pb-1">
            {t('project_case_config')}
          </h4>
          <div className="space-y-1">
             <div className="flex justify-between items-center py-1">
                <span className="text-sm text-muted-foreground">{tBase('tariff_type')}</span>
                <span className="font-medium">
                   {/* @ts-ignore */}
                   {tOptions(project_case.tariff_type)}
                </span>
             </div>
             {renderCapacity(tProject('reg_cap'), project_case.reg_cap_input)}
             {renderCapacity(tProject('half_peak_cap'), project_case.half_peak_cap_input)}
             {renderCapacity(tProject('sat_half_peak_cap'), project_case.sat_half_peak_cap_input)}
             {renderCapacity(tProject('off_cap'), project_case.off_cap_input)}
          </div>
        </div>

        {/* Financial & Battery Config */}
        <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2 border-b pb-1">
                {t('financial_config')}
            </h4>
            <div className="space-y-1">
                <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-muted-foreground">{tFinancial('system_cost.usd_per_kwh')}</span>
                    <span className="font-medium">
                        {format.number(systemCost.usd_per_kwh, { style: 'currency', currency: 'USD' })}
                    </span>
                </div>
                 <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-muted-foreground">{tFinancial('esco.spv')}</span>
                    <span className="font-medium">{format.number(esco.spv, { style: 'percent' })}</span>
                </div>
                 <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-muted-foreground">{tFinancial('esco.factory')}</span>
                    <span className="font-medium">{format.number(esco.factory, { style: 'percent' })}</span>
                </div>
                 <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-muted-foreground">{tFinancial('esco.operation')}</span>
                    <span className="font-medium">{format.number(esco.operation, { style: 'percent' })}</span>
                </div>
                 <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-muted-foreground">{tFinancial('esco.service')}</span>
                    <span className="font-medium">{format.number(esco.service, { style: 'percent' })}</span>
                </div>
            </div>
        </div>

      </CardContent>
    </Card>
  );
}
