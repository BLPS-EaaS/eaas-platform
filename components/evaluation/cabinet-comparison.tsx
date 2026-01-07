import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormatter, useTranslations } from "next-intl";

interface CabinetResult {
  cabinets: number;
  financial_metrics: {
    spv_irr_value: number | null;
    spv_npv: number;
    spv_breakeven_year: string | number | null;
  };
}

interface CabinetComparisonProps {
  results: {
    results_by_cabinet: Record<string, CabinetResult>;
    optimal_cabinet: {
      cabinets: number;
    };
  };
}

export function CabinetComparison({ results }: CabinetComparisonProps) {
  const t = useTranslations('OptimizationResults');
  const format = useFormatter();

  const cabinetData = Object.values(results.results_by_cabinet).sort(
    (a, b) => a.cabinets - b.cabinets
  );

  const optimalCabinets = results.optimal_cabinet.cabinets;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('cabinet_comparison.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  {t('cabinet_comparison.cabinets')}
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  {t('metrics.spv_irr')}
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  {t('metrics.spv_npv')}
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  {t('metrics.spv_breakeven')}
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {cabinetData.map((item) => {
                const isOptimal = item.cabinets === optimalCabinets;
                const irr = item.financial_metrics.spv_irr_value;
                const npv = item.financial_metrics.spv_npv;
                const breakeven = item.financial_metrics.spv_breakeven_year;

                return (
                  <tr
                    key={item.cabinets}
                    className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${
                      isOptimal ? "bg-muted/50 font-medium" : ""
                    }`}
                  >
                    <td className="p-4 align-middle">
                      {item.cabinets} {isOptimal && <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t('optimal')}</span>}
                    </td>
                    <td className={`p-4 align-middle ${irr && irr >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {irr !== null
                        ? format.number(irr, {
                            style: "percent",
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          })
                        : "N/A"}
                    </td>
                    <td className={`p-4 align-middle ${npv >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {format.number(npv, {
                        style: "currency",
                        currency: "TWD",
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className="p-4 align-middle">
                      {typeof breakeven === "number"
                        ? format.number(breakeven, { maximumFractionDigits: 1 })
                        : breakeven || "N/A"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
