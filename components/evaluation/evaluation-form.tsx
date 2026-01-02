"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { optimizationSchema, type OptimizationFormData } from "@/lib/schemas/optimization-schema";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { submitOptimizationAction } from "@/app/actions/optimization";
import { toast } from "sonner";
import { Loader2, Upload, ChevronDown, ChevronUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export function EvaluationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);

  const t = useTranslations('EvaluationForm');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<OptimizationFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(optimizationSchema) as any,
    defaultValues: {
      company: {
        name: "",
        address: "",
      },
      start_n_cabinets: 1,
      n_cabinets: 5,
      base_case: {
        tariff_type: "three_tier",
        reg_cap_input: 0,
        half_peak_cap_input: 0,
        sat_half_peak_cap_input: 0,
        off_cap_input: 0,
        power_factor: 1,
        grid: {
            is_excess_contract_capacity_allowed: true,
        }
      },
      project_case: {
        tariff_type: "batch",
        reg_cap_input: 0,
        half_peak_cap_input: 0,
        sat_half_peak_cap_input: 0,
        off_cap_input: 0,
        power_factor: 1,
        grid: {
            is_excess_contract_capacity_allowed: false,
        }
      },
      battery: {
        unit: {
            energy_capacity_kwh: 233,
            capacity_usable_fraction: 1.00,
            power_rating_kw: 116.5,
            rating_usable_fraction: 0.8583690987,
            efficiency_store: 1,
            efficiency_dispatch: 0.95,
            decay_rate: 0.015,
            c_rate: 0.5,
            initial_soc: 0.0,
        },
        costs: {
            replacements: [],
            salvage_fraction: 0.0,
        }
      },
      power_factor_tariff: {
        base_threshold: 0.8,
        credit_cap: 0.95,
        adjustment_rate: 0.001,
      },
      financial: {
        esco: {
            spv: 0.63,
            factory: 0.15,
            operation: 0.16,
            service: 0.06,
        },
        discount_rate: 0.05,
        spv_interest_rate: 0.05,
        lifetime_years: 10,
        system_cost: {
            exchange_rate: 32,
            usd_per_kwh: 400,
            cabinet_kwh_capacity: 215,
            cost_cabinet_shipping: 5000,
            cost_low_voltage_unit: 10000,
            cost_ems_unit: 5000,
            cost_transformer_unit: 15000,
            cost_vcb_unit: 20000,
            insurance_rate: 0.01,
            tax_rate: 0.05,
            eng_tier_1_6: 50000,
            eng_tier_7_10: 40000,
            eng_tier_11_20: 30000,
            eng_tier_21_40: 20000,
            eng_tier_41_60: 15000,
            eng_tier_61_80: 10000,
            eng_tier_81_100: 5000,
            om_percent: 0.01,
        }
      },
      adr: {
        activate_all: false,
        schedule_dr: {
            monthly_select_8_day: { is_active: false, pledge_kw_ratio: 0.5 },
            daily_select_time_block: {
                pledge_kw_ratio: 0.5,
                options: {
                    "2h": { is_active: false },
                    "4h": { is_active: false },
                    "6h": { is_active: false },
                }
            }
        },
        real_time_dr: {
            guaranteed_response_type: {
                is_active: false,
                pledge_kw_ratio: 0.5,
                event_daily_probability: 0.05,
                event_duration_hours: 1,
                peak_month_multiplier: 1.2,
                notification_time: "30m",
            },
            flexible_response_type: {
                is_active: false,
                pledge_kw_ratio: 0.5,
                event_daily_probability: 0.05,
                event_duration_hours: 1,
                peak_month_multiplier: 1.2,
            }
        },
        demand_bidding: {
            economic_type: {
                is_active: false,
                pledge_kw_ratio: 0.5,
                bid_probability: 0.5,
                event_duration_hours: 2,
                bid_price: 10,
                notification_type: "day_ahead",
            },
            reliable_type: {
                 is_active: false,
                 pledge_kw_ratio: 0.5,
                 bid_probability: 0.5,
                 event_duration_hours: 2,
                 bid_price: 15,
            },
            combined_type: { is_active: false }
        },
        renewable_energy_obligations_type: {
            obligated_hours_type: { is_active: false },
            progressive_incentive_type: { is_active: false }
        }
      }
    },
  });

  async function onSubmit(data: OptimizationFormData) {
    if (!file) {
      toast.error(t('validation.required'));
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("settings", JSON.stringify(data));
      formData.append("file", file);

      const response = await submitOptimizationAction(null, formData);

      if (response?.success) {
        toast.success(t('validation.success'));
        console.log("Optimization Result:", response.data);
        setResult(response.data);
      } else {
        throw new Error(response?.error || 'Unknown error');
      }
    } catch (error) {
       console.error(error);
       toast.error(error instanceof Error ? error.message : t('validation.error'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('submitting')}
              </>
            ) : (
                t('submit')
            )}
          </Button>
        </div>

        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('sections.company.title')}</CardTitle>
            <CardDescription>{t('sections.company.description')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="company.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sections.company.name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('sections.company.name_placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="company.address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sections.company.address')}</FormLabel>
                   <FormControl>
                    <Input placeholder={t('sections.company.address_placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

         {/* File Upload */}
         <Card>
            <CardHeader>
                <CardTitle>{t('sections.upload.title')}</CardTitle>
                <CardDescription>{t('sections.upload.description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-4">
                    <LabelPrimitiveForFile>{t('sections.upload.label')}</LabelPrimitiveForFile>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Input
                            id="file-upload"
                            type="file"
                            accept=".csv,.html,.htm"
                            onChange={(e) => {
                                const f = e.target.files?.[0] || null;
                                setFile(f);
                            }}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Minimal Configuration: Cabinets */}
        <Card>
            <CardHeader>
                <CardTitle>{t('sections.cabinets.title')}</CardTitle>
            </CardHeader>
             <CardContent className="grid gap-6 sm:grid-cols-2">
                 <FormField
                  control={form.control}
                  name="start_n_cabinets"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sections.project_case.start_n_cabinets')}</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="n_cabinets"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sections.project_case.n_cabinets')}</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </CardContent>
        </Card>

        {/* Minimal Base Case */}
        <Card>
          <CardHeader>
            <CardTitle>{t('sections.base_case.title')}</CardTitle>
             <CardDescription>{t('sections.base_case.description')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="base_case.tariff_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sections.base_case.tariff_type')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('sections.base_case.tariff_placeholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="two_tier">{t('options.two_tier')}</SelectItem>
                      <SelectItem value="three_tier">{t('options.three_tier')}</SelectItem>
                      <SelectItem value="batch">{t('options.batch')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="base_case.reg_cap_input"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sections.base_case.reg_cap')}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Extended Base Case Capacities */}
            <FormField
              control={form.control}
              name="base_case.half_peak_cap_input"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sections.base_case.half_peak_cap')}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="base_case.sat_half_peak_cap_input"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sections.base_case.sat_half_peak_cap')}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="base_case.off_cap_input"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sections.base_case.off_cap')}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        {/* Minimal Project Case */}
        <Card>
          <CardHeader>
            <CardTitle>{t('sections.project_case.title')}</CardTitle>
            <CardDescription>{t('sections.project_case.description')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
             <FormField
              control={form.control}
              name="project_case.tariff_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sections.base_case.tariff_type')}</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('sections.base_case.tariff_placeholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="two_tier">{t('options.two_tier')}</SelectItem>
                      <SelectItem value="three_tier">{t('options.three_tier')}</SelectItem>
                      <SelectItem value="batch">{t('options.batch')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
           
            <FormField
              control={form.control}
              name="project_case.reg_cap_input"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sections.project_case.reg_cap')}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Extended Project Case Capacities */}
            <FormField
              control={form.control}
              name="project_case.half_peak_cap_input"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sections.project_case.half_peak_cap')}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="project_case.sat_half_peak_cap_input"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sections.project_case.sat_half_peak_cap')}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="project_case.off_cap_input"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sections.project_case.off_cap')}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-center">
            <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2"
            >
                {showAdvanced ? (
                    <>
                        {t('sections.toggle.hide')}
                        <ChevronUp className="h-4 w-4" />
                    </>
                ) : (
                    <>
                         {t('sections.toggle.show')}
                        <ChevronDown className="h-4 w-4" />
                    </>
                )}
            </Button>
        </div>

        {showAdvanced && (
            <div className="space-y-8 animate-in slide-in-from-top-5 fade-in duration-300">
                 {/* Advanced Base Case/Project Case settings */}
                 <Card>
                    <CardHeader>
                        <CardTitle>{t('sections.base_case.advanced_settings')}</CardTitle>
                    </CardHeader>
                     <CardContent className="grid gap-6 sm:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="base_case.power_factor"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{t('sections.base_case.power_factor')}</FormLabel>
                                <FormControl>
                                    <PercentageInput {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="base_case.grid.is_excess_contract_capacity_allowed"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                                <FormControl>
                                    <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                    {t('sections.base_case.allow_excess')}
                                    </FormLabel>
                                </div>
                                </FormItem>
                            )}
                        />
                     </CardContent>
                 </Card>

                 {/* Battery Configuration */}
                 <Card>
                    <CardHeader>
                        <CardTitle>{t('sections.battery.title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium">{t('sections.battery.unit.title')}</h4>
                            <div className="grid gap-6 sm:grid-cols-2">
                                <FormField control={form.control} name="battery.unit.energy_capacity_kwh" render={({ field }) => (
                                    <FormItem><FormLabel>{t('sections.battery.unit.energy_capacity')}</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="battery.unit.power_rating_kw" render={({ field }) => (
                                    <FormItem><FormLabel>{t('sections.battery.unit.power_rating')}</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="battery.unit.capacity_usable_fraction" render={({ field }) => (
                                    <FormItem><FormLabel>{t('sections.battery.unit.capacity_usable_fraction')}</FormLabel><FormControl><PercentageInput {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="battery.unit.rating_usable_fraction" render={({ field }) => (
                                    <FormItem><FormLabel>{t('sections.battery.unit.rating_usable_fraction')}</FormLabel><FormControl><PercentageInput {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="battery.unit.efficiency_store" render={({ field }) => (
                                    <FormItem><FormLabel>{t('sections.battery.unit.efficiency_store')}</FormLabel><FormControl><PercentageInput {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="battery.unit.efficiency_dispatch" render={({ field }) => (
                                    <FormItem><FormLabel>{t('sections.battery.unit.efficiency_dispatch')}</FormLabel><FormControl><PercentageInput {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="battery.unit.decay_rate" render={({ field }) => (
                                    <FormItem><FormLabel>{t('sections.battery.unit.decay_rate')}</FormLabel><FormControl><PercentageInput {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="battery.unit.c_rate" render={({ field }) => (
                                    <FormItem><FormLabel>{t('sections.battery.unit.c_rate')}</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="battery.unit.initial_soc" render={({ field }) => (
                                    <FormItem><FormLabel>{t('sections.battery.unit.initial_soc')}</FormLabel><FormControl><PercentageInput {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium">{t('sections.battery.costs.title')}</h4>
                            <div className="grid gap-6 sm:grid-cols-2">
                                <FormField control={form.control} name="battery.costs.salvage_fraction" render={({ field }) => (
                                    <FormItem><FormLabel>{t('sections.battery.costs.salvage_fraction')}</FormLabel><FormControl><PercentageInput {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        </div>
                    </CardContent>
                 </Card>

                 {/* Power Factor Tariff */}
                 <Card>
                    <CardHeader>
                        <CardTitle>{t('sections.power_factor_tariff.title')}</CardTitle>
                        <CardDescription>{t('sections.power_factor_tariff.description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 sm:grid-cols-2">
                        <FormField control={form.control} name="power_factor_tariff.base_threshold" render={({ field }) => (
                            <FormItem><FormLabel>{t('sections.power_factor_tariff.base_threshold')}</FormLabel><FormControl><PercentageInput {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="power_factor_tariff.credit_cap" render={({ field }) => (
                            <FormItem><FormLabel>{t('sections.power_factor_tariff.credit_cap')}</FormLabel><FormControl><PercentageInput {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="power_factor_tariff.adjustment_rate" render={({ field }) => (
                            <FormItem><FormLabel>{t('sections.power_factor_tariff.adjustment_rate')}</FormLabel><FormControl><PercentageInput {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </CardContent>
                 </Card>

                 {/* Financial - Expanded */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('sections.financial.title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-6 sm:grid-cols-2">
                             <FormField control={form.control} name="financial.discount_rate" render={({ field }) => (
                                <FormItem><FormLabel>{t('sections.financial.discount_rate')}</FormLabel><FormControl><PercentageInput {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="financial.lifetime_years" render={({ field }) => (
                                <FormItem><FormLabel>{t('sections.financial.lifetime')}</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="financial.spv_interest_rate" render={({ field }) => (
                                <FormItem><FormLabel>{t('sections.financial.spv_interest_rate')}</FormLabel><FormControl><PercentageInput {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium">{t('sections.financial.system_cost.title')}</h4>
                            <div className="grid gap-6 sm:grid-cols-2">
                                <FormField control={form.control} name="financial.system_cost.exchange_rate" render={({ field }) => (
                                    <FormItem><FormLabel>{t('sections.financial.system_cost.exchange_rate')}</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="financial.system_cost.usd_per_kwh" render={({ field }) => (
                                    <FormItem><FormLabel>{t('sections.financial.system_cost.usd_per_kwh')}</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="financial.system_cost.cabinet_kwh_capacity" render={({ field }) => (
                                    <FormItem><FormLabel>{t('sections.financial.system_cost.cabinet_kwh_capacity')}</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>
                                )} />
                                 <FormField control={form.control} name="financial.system_cost.cost_cabinet_shipping" render={({ field }) => (
                                    <FormItem><FormLabel>{t('sections.financial.system_cost.cost_cabinet_shipping')}</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="financial.system_cost.cost_low_voltage_unit" render={({ field }) => (
                                    <FormItem><FormLabel>{t('sections.financial.system_cost.cost_low_voltage_unit')}</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="financial.system_cost.cost_ems_unit" render={({ field }) => (
                                    <FormItem><FormLabel>{t('sections.financial.system_cost.cost_ems_unit')}</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="financial.system_cost.cost_transformer_unit" render={({ field }) => (
                                    <FormItem><FormLabel>{t('sections.financial.system_cost.cost_transformer_unit')}</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="financial.system_cost.cost_vcb_unit" render={({ field }) => (
                                    <FormItem><FormLabel>{t('sections.financial.system_cost.cost_vcb_unit')}</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="financial.system_cost.insurance_rate" render={({ field }) => (
                                    <FormItem><FormLabel>{t('sections.financial.system_cost.insurance_rate')}</FormLabel><FormControl><PercentageInput {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="financial.system_cost.tax_rate" render={({ field }) => (
                                    <FormItem><FormLabel>{t('sections.financial.system_cost.tax_rate')}</FormLabel><FormControl><PercentageInput {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="financial.system_cost.om_percent" render={({ field }) => (
                                    <FormItem><FormLabel>{t('sections.financial.system_cost.om_percent')}</FormLabel><FormControl><PercentageInput {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        </div>

                         <div className="space-y-4">
                            <h4 className="text-sm font-medium">{t('sections.financial.esco.title')}</h4>
                            <div className="grid gap-6 sm:grid-cols-2">
                                <FormField control={form.control} name="financial.esco.spv" render={({ field }) => (
                                    <FormItem><FormLabel>{t('sections.financial.esco.spv')}</FormLabel><FormControl><PercentageInput {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="financial.esco.factory" render={({ field }) => (
                                    <FormItem><FormLabel>{t('sections.financial.esco.factory')}</FormLabel><FormControl><PercentageInput {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="financial.esco.operation" render={({ field }) => (
                                    <FormItem><FormLabel>{t('sections.financial.esco.operation')}</FormLabel><FormControl><PercentageInput {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="financial.esco.service" render={({ field }) => (
                                    <FormItem><FormLabel>{t('sections.financial.esco.service')}</FormLabel><FormControl><PercentageInput {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                {/* ADR Configuration */}
                 <Card>
                    <CardHeader>
                        <CardTitle>{t('sections.adr.title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="adr.activate_all"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                                <FormControl>
                                    <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                    {t('sections.adr.activate_all')}
                                    </FormLabel>
                                </div>
                                </FormItem>
                            )}
                        />

                        {/* Schedule DR */}
                         <div className="space-y-4 border rounded-md p-4">
                            <h4 className="font-medium">{t('sections.adr.schedule_dr.title')}</h4>
                            
                            {/* Monthly Select 8 Day */}
                             <div className="space-y-4 ml-4">
                                <FormField
                                    control={form.control}
                                    name="adr.schedule_dr.monthly_select_8_day.is_active"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <FormLabel className="font-normal">{t('sections.adr.schedule_dr.monthly_select_8_day.title')}</FormLabel>
                                        </FormItem>
                                    )}
                                />
                                <FormField control={form.control} name="adr.schedule_dr.monthly_select_8_day.pledge_kw_ratio" render={({ field }) => (
                                    <FormItem className="ml-8"><FormLabel>{t('sections.adr.schedule_dr.monthly_select_8_day.pledge_kw_ratio')}</FormLabel><FormControl><PercentageInput {...field} className="max-w-[150px]" /></FormControl><FormMessage /></FormItem>
                                )} />
                             </div>

                             {/* Daily Select Time Block */}
                             <div className="space-y-4 ml-4 mt-4">
                               <h5 className="text-sm font-medium">{t('sections.adr.schedule_dr.daily_select_time_block.title')}</h5>
                                <div className="grid gap-4 ml-4">
                                    <FormField control={form.control} name="adr.schedule_dr.daily_select_time_block.pledge_kw_ratio" render={({ field }) => (
                                        <FormItem><FormLabel>{t('sections.adr.schedule_dr.daily_select_time_block.pledge_kw_ratio')}</FormLabel><FormControl><PercentageInput {...field} className="max-w-[150px]" /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <div className="flex gap-4">
                                        {['2h', '4h', '6h'].map((opt) => (
                                            <FormField
                                                key={opt}
                                                control={form.control}
                                                // @ts-ignore
                                                name={`adr.schedule_dr.daily_select_time_block.options.${opt}.is_active`}
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                    <FormControl><Checkbox checked={field.value as boolean} onCheckedChange={field.onChange} /></FormControl>
                                                    {/* @ts-ignore */}
                                                    <FormLabel className="font-normal">{t(`sections.adr.schedule_dr.daily_select_time_block.options.${opt}`)}</FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                        ))}
                                    </div>
                                </div>
                             </div>
                         </div>

                        {/* Real Time DR */}
                        <div className="space-y-4 border rounded-md p-4">
                            <h4 className="font-medium">{t('sections.adr.real_time_dr.title')}</h4>
                            
                            {/* Guaranteed Response */}
                            <div className="space-y-4 ml-4">
                                <FormField
                                    control={form.control}
                                    name="adr.real_time_dr.guaranteed_response_type.is_active"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <FormLabel className="font-normal">{t('sections.adr.real_time_dr.guaranteed_response_type.title')}</FormLabel>
                                        </FormItem>
                                    )}
                                />
                                <div className="grid gap-4 sm:grid-cols-2 ml-8">
                                     <FormField control={form.control} name="adr.real_time_dr.guaranteed_response_type.pledge_kw_ratio" render={({ field }) => (
                                        <FormItem><FormLabel>{t('sections.adr.real_time_dr.guaranteed_response_type.pledge_kw_ratio')}</FormLabel><FormControl><PercentageInput {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                     <FormField control={form.control} name="adr.real_time_dr.guaranteed_response_type.event_daily_probability" render={({ field }) => (
                                        <FormItem><FormLabel>{t('sections.adr.real_time_dr.guaranteed_response_type.event_daily_probability')}</FormLabel><FormControl><PercentageInput {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                     <FormField control={form.control} name="adr.real_time_dr.guaranteed_response_type.event_duration_hours" render={({ field }) => (
                                        <FormItem><FormLabel>{t('sections.adr.real_time_dr.guaranteed_response_type.event_duration_hours')}</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                     <FormField control={form.control} name="adr.real_time_dr.guaranteed_response_type.peak_month_multiplier" render={({ field }) => (
                                        <FormItem><FormLabel>{t('sections.adr.real_time_dr.guaranteed_response_type.peak_month_multiplier')}</FormLabel><FormControl><PercentageInput {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                      <FormField
                                        control={form.control}
                                        name="adr.real_time_dr.guaranteed_response_type.notification_time"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>{t('sections.adr.real_time_dr.guaranteed_response_type.notification_time')}</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                <SelectItem value="30m">30m</SelectItem>
                                                <SelectItem value="1h">1h</SelectItem>
                                                <SelectItem value="2h">2h</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                </div>
                            </div>
                            
                            {/* Flexible Response */}
                             <div className="space-y-4 ml-4 mt-6">
                                <FormField
                                    control={form.control}
                                    name="adr.real_time_dr.flexible_response_type.is_active"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <FormLabel className="font-normal">{t('sections.adr.real_time_dr.flexible_response_type.title')}</FormLabel>
                                        </FormItem>
                                    )}
                                />
                                 <div className="grid gap-4 sm:grid-cols-2 ml-8">
                                     <FormField control={form.control} name="adr.real_time_dr.flexible_response_type.pledge_kw_ratio" render={({ field }) => (
                                        <FormItem><FormLabel>{t('sections.adr.real_time_dr.flexible_response_type.pledge_kw_ratio')}</FormLabel><FormControl><PercentageInput {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                     <FormField control={form.control} name="adr.real_time_dr.flexible_response_type.event_daily_probability" render={({ field }) => (
                                        <FormItem><FormLabel>{t('sections.adr.real_time_dr.flexible_response_type.event_daily_probability')}</FormLabel><FormControl><PercentageInput {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                     <FormField control={form.control} name="adr.real_time_dr.flexible_response_type.event_duration_hours" render={({ field }) => (
                                        <FormItem><FormLabel>{t('sections.adr.real_time_dr.flexible_response_type.event_duration_hours')}</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                     <FormField control={form.control} name="adr.real_time_dr.flexible_response_type.peak_month_multiplier" render={({ field }) => (
                                        <FormItem><FormLabel>{t('sections.adr.real_time_dr.flexible_response_type.peak_month_multiplier')}</FormLabel><FormControl><PercentageInput {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                 </div>
                             </div>
                        </div>

                        {/* Demand Bidding */}
                         <div className="space-y-4 border rounded-md p-4">
                            <h4 className="font-medium">{t('sections.adr.demand_bidding.title')}</h4>

                            {/* Economic Type */}
                            <div className="space-y-4 ml-4">
                                <FormField
                                    control={form.control}
                                    name="adr.demand_bidding.economic_type.is_active"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <FormLabel className="font-normal">{t('sections.adr.demand_bidding.economic_type.title')}</FormLabel>
                                        </FormItem>
                                    )}
                                />
                                <div className="grid gap-4 sm:grid-cols-2 ml-8">
                                     <FormField control={form.control} name="adr.demand_bidding.economic_type.pledge_kw_ratio" render={({ field }) => (
                                        <FormItem><FormLabel>{t('sections.adr.demand_bidding.economic_type.pledge_kw_ratio')}</FormLabel><FormControl><PercentageInput {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="adr.demand_bidding.economic_type.bid_probability" render={({ field }) => (
                                        <FormItem><FormLabel>{t('sections.adr.demand_bidding.economic_type.bid_probability')}</FormLabel><FormControl><PercentageInput {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="adr.demand_bidding.economic_type.event_duration_hours" render={({ field }) => (
                                        <FormItem><FormLabel>{t('sections.adr.demand_bidding.economic_type.event_duration_hours')}</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="adr.demand_bidding.economic_type.bid_price" render={({ field }) => (
                                        <FormItem><FormLabel>{t('sections.adr.demand_bidding.economic_type.bid_price')}</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                     <FormField
                                        control={form.control}
                                        name="adr.demand_bidding.economic_type.notification_type"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>{t('sections.adr.demand_bidding.economic_type.notification_type')}</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                <SelectItem value="day_ahead">Day Ahead</SelectItem>
                                                <SelectItem value="2h_before">2h Before</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                </div>
                            </div>
                             {/* Reliable Type */}
                             <div className="space-y-4 ml-4 mt-6">
                                <FormField
                                    control={form.control}
                                    name="adr.demand_bidding.reliable_type.is_active"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <FormLabel className="font-normal">{t('sections.adr.demand_bidding.reliable_type.title')}</FormLabel>
                                        </FormItem>
                                    )}
                                />
                                <div className="grid gap-4 sm:grid-cols-2 ml-8">
                                     <FormField control={form.control} name="adr.demand_bidding.reliable_type.pledge_kw_ratio" render={({ field }) => (
                                        <FormItem><FormLabel>{t('sections.adr.demand_bidding.reliable_type.pledge_kw_ratio')}</FormLabel><FormControl><PercentageInput {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="adr.demand_bidding.reliable_type.bid_probability" render={({ field }) => (
                                        <FormItem><FormLabel>{t('sections.adr.demand_bidding.reliable_type.bid_probability')}</FormLabel><FormControl><PercentageInput {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    {/* Event duration should be 2 or 4 */}
                                     <FormField
                                        control={form.control}
                                        name="adr.demand_bidding.reliable_type.event_duration_hours"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>{t('sections.adr.demand_bidding.reliable_type.event_duration_hours')}</FormLabel>
                                            <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={String(field.value)}>
                                                <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                <SelectItem value="2">2 Hours</SelectItem>
                                                <SelectItem value="4">4 Hours</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                    <FormField control={form.control} name="adr.demand_bidding.reliable_type.bid_price" render={({ field }) => (
                                        <FormItem><FormLabel>{t('sections.adr.demand_bidding.reliable_type.bid_price')}</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                             </div>
                         </div>
                         
                         {/* Renewable Obligations */}
                         <Card>
                            <CardHeader>
                                <CardTitle>{t('sections.adr.renewable_energy_obligations_type.title')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="adr.renewable_energy_obligations_type.obligated_hours_type.is_active"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <FormLabel className="font-normal">{t('sections.adr.renewable_energy_obligations_type.obligated_hours_type')}</FormLabel>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="adr.renewable_energy_obligations_type.progressive_incentive_type.is_active"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <FormLabel className="font-normal">{t('sections.adr.renewable_energy_obligations_type.progressive_incentive_type')}</FormLabel>
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                         </Card>

                    </CardContent>
                 </Card>
            </div>
        )}

      </form>
    </Form>
  );
}

// Helper for labels outside of FormField
function LabelPrimitiveForFile({ children }: { children: React.ReactNode }) {
    return <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{children}</label>
}

// Percentage Input Helper
const PercentageInput = (props: React.ComponentProps<typeof Input>) => {
    const { value, onChange, ...rest } = props;
    return (
        <div className="relative">
            <Input
                type="number"
                {...rest}
                value={value !== undefined && value !== null ? Number(value) * 100 : ''}
                onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (isNaN(val)) {
                        onChange?.(0 as any);
                    } else {
                        onChange?.((val / 100) as any);
                    }
                }}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
        </div>
    )
}

