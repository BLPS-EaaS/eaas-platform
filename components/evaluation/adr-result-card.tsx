import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useFormatter, useTranslations, useLocale } from "next-intl";
import { CalendarDays, Clock, DollarSign, Zap } from "lucide-react";

interface ADRInfo {
  time_window: string;
  duration_hours: number;
  hours?: number[];
  note?: string;
}

interface ADREvent {
  rule: string;
  info: Record<string, ADRInfo>;
}

interface ADRMonthData {
  scenario: string;
  revenue: number;
  events: ADREvent[];
}

interface ADRResultCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adrData?: Record<string, ADRMonthData> | null;
  onDateClick?: (date: string) => void;
}

export function ADRResultCard({ adrData, onDateClick }: ADRResultCardProps) {
  const t = useTranslations('OptimizationResults.ADRResults');
  const format = useFormatter();
  const locale = useLocale();

  if (!adrData || Object.keys(adrData).length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(adrData).sort().map(([month, data]) => (
          <Card key={month} className="overflow-hidden border-l-4 border-l-primary/20">
            <div className="bg-muted/30 p-3 border-b flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{month}</span>
                </div>
                <Badge variant={data.revenue > 0 ? "default" : "secondary"}>
                    {data.revenue > 0 ? (
                        <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {format.number(data.revenue, { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 })}
                        </div>
                    ) : (
                        t('no_revenue')
                    )}
                </Badge>
            </div>
            
            <div className="p-4 space-y-4">
                <div className="text-sm">
                    <span className="text-muted-foreground mr-2">{t('scenario')}:</span>
                    <span className="font-medium">
                        {(() => {
                            const parts = data.scenario.split(' + ');
                            
                            const translatedParts = parts.map(part => {
                                return t(`adr_names.${part.trim()}`)
                            });

                            return translatedParts.join(' + ');
                        })()}
                    </span>
                </div>

                {data.events.length > 0 && (
                     <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="events">
                             <AccordionTrigger className="text-sm py-2">{t('view_events')} ({data.events.reduce((acc, curr) => acc + Object.keys(curr.info).length, 0)})</AccordionTrigger>
                             <AccordionContent>
                                <ScrollArea className="h-[200px] w-full rounded-md border p-2">
                                    <div className="space-y-4">
                                        {data.events.map((event, idx) => (
                                            <div key={idx} className="space-y-2">
                                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                     {t(`adr_names.${event.rule}`)}
                                                </div>
                                                <div className="space-y-2">
                                                    {Object.entries(event.info).sort().map(([date, info]) => (
                                                        <div 
                                                            key={date} 
                                                            className={`text-sm bg-muted/50 p-2 rounded flex flex-col gap-1 transition-colors ${onDateClick ? 'cursor-pointer hover:bg-muted hover:ring-1 hover:ring-primary/20' : ''}`}
                                                            onClick={() => onDateClick?.(date)}
                                                        >
                                                            <div className="font-medium flex justify-between">
                                                                <span>{date}</span>
                                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                    <Clock className="h-3 w-3" />
                                                                    {info.duration_hours}h
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground flex justify-between">
                                                                <span>{info.time_window}</span>
                                                            </div>
                                                            {info.note && (
                                                                <div className="text-xs text-muted-foreground italic border-t pt-1 mt-1">
                                                                    {info.note}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                             </AccordionContent>
                        </AccordionItem>
                     </Accordion>
                )}
                {data.events.length === 0 && (
                    <div className="text-sm text-muted-foreground italic">
                        {t('no_events')}
                    </div>
                )}
            </div>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
