import { z } from "zod";

export const optimizationSchema = z.object({
  company: z.object({
    name: z.string().min(1, "Company name is required"),
    address: z.string().min(1, "Address is required"),
  }),
//   time_steps_per_hour: z.number().int().min(1).max(60).default(4),
//   start_date: z.string().date(), // YYYY-MM-DD
//   end_date: z.string().date(),
  start_n_cabinets: z.number().int().min(1).default(1),
  n_cabinets: z.number().int().min(1),
  base_case: z.object({
    tariff_type: z.enum(["two_tier", "three_tier", "batch"]), // Add more if needed
    reg_cap_input: z.number().min(0),
    half_peak_cap_input: z.number().min(0),
    sat_half_peak_cap_input: z.number().min(0),
    off_cap_input: z.number().min(0),
    power_factor: z.number().min(0).max(1),
    grid: z.object({
      is_excess_contract_capacity_allowed: z.boolean().default(true),
    }),
  }),
  project_case: z.object({
    tariff_type: z.enum(["two_tier", "three_tier", "batch"]),
    reg_cap_input: z.number().min(0),
    half_peak_cap_input: z.number().min(0),
    sat_half_peak_cap_input: z.number().min(0),
    off_cap_input: z.number().min(0),
    power_factor: z.number().min(0).max(1),
    grid: z.object({
      is_excess_contract_capacity_allowed: z.boolean().default(false),
    }),
  }),
  battery: z.object({
    unit: z.object({
      energy_capacity_kwh: z.number().min(0),
      capacity_usable_fraction: z.number().min(0).max(1),
      power_rating_kw: z.number().min(0),
      rating_usable_fraction: z.number().min(0).max(1),
      efficiency_store: z.number().min(0).max(1),
      efficiency_dispatch: z.number().min(0).max(1),
      decay_rate: z.number().min(0),
      c_rate: z.number().min(0),
      initial_soc: z.number().min(0).max(1),
    }),
    costs: z.object({
      replacements: z.array(
        z.object({
          year: z.number(),
          fraction_of_energy_cost: z.number().min(0),
        })
      ),
      salvage_fraction: z.number().min(0).max(1),
    }),
  }),
  power_factor_tariff: z.object({
    base_threshold: z.number().min(0).max(1),
    credit_cap: z.number().min(0).max(1),
    adjustment_rate: z.number().min(0),
  }),
  financial: z.object({
    esco: z.object({
      spv: z.number().min(0).max(1),
      factory: z.number().min(0).max(1),
      operation: z.number().min(0).max(1),
      service: z.number().min(0).max(1),
    }),
    discount_rate: z.number().min(0),
    spv_interest_rate: z.number().min(0),
    lifetime_years: z.number().int().min(1),
    system_cost: z.object({
      exchange_rate: z.number().min(0),
      usd_per_kwh: z.number().min(0),
      cabinet_kwh_capacity: z.number().min(0),
      cost_cabinet_shipping: z.number().min(0),
      cost_low_voltage_unit: z.number().min(0),
      cost_ems_unit: z.number().min(0),
      cost_transformer_unit: z.number().min(0),
      cost_vcb_unit: z.number().min(0),
      insurance_rate: z.number().min(0),
      tax_rate: z.number().min(0),
      eng_tier_1_6: z.number().min(0),
      eng_tier_7_10: z.number().min(0),
      eng_tier_11_20: z.number().min(0),
      eng_tier_21_40: z.number().min(0),
      eng_tier_41_60: z.number().min(0),
      eng_tier_61_80: z.number().min(0),
      eng_tier_81_100: z.number().min(0),
      om_percent: z.number().min(0),
    }),
  }),
  adr: z.object({
    activate_all: z.boolean().default(false),
    schedule_dr: z.object({
      monthly_select_8_day: z.object({
        is_active: z.boolean(),
        pledge_kw_ratio: z.number().min(0).max(1),
      }),
      daily_select_time_block: z.object({
        pledge_kw_ratio: z.number().min(0).max(1),
        options: z.object({
          "2h": z.object({ is_active: z.boolean() }),
          "4h": z.object({ is_active: z.boolean() }),
          "6h": z.object({ is_active: z.boolean() }),
        }),
      }),
    }),
    real_time_dr: z.object({
      guaranteed_response_type: z.object({
        is_active: z.boolean(),
        pledge_kw_ratio: z.number().min(0).max(1),
        event_daily_probability: z.number().min(0).max(1),
        event_duration_hours: z.number(),
        peak_month_multiplier: z.number().min(0).max(2),
        notification_time: z.enum(["30m", "1h", "2h"]),
      }),
      flexible_response_type: z.object({
        is_active: z.boolean(),
        pledge_kw_ratio: z.number().min(0).max(1),
        event_daily_probability: z.number().min(0).max(1),
        event_duration_hours: z.number(),
        peak_month_multiplier: z.number().min(0).max(2)
      })
    }),
    demand_bidding: z.object({
      economic_type: z.object({
        is_active: z.boolean(),
        pledge_kw_ratio: z.number().min(0).max(1),
        bid_probability: z.number().min(0).max(1),
        event_duration_hours: z.number(),
        bid_price: z.number(),
        notification_type: z.enum(["day_ahead", "2h_before"])
      }),
      reliable_type: z.object({
        is_active: z.boolean(),
        pledge_kw_ratio: z.number().min(0).max(1),
        bid_probability: z.number().min(0).max(1),
        event_duration_hours: z.union([z.literal(2), z.literal(4)]),
        bid_price: z.number()
      }),
      combined_type: z.object({ is_active: z.boolean() })
    }),
    renewable_energy_obligations_type: z.object({
      obligated_hours_type: z.object({ is_active: z.boolean() }),
      progressive_incentive_type: z.object({ is_active: z.boolean() })
    })
  }),
});

export type OptimizationFormData = z.infer<typeof optimizationSchema>;