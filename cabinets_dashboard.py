import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd
from pathlib import Path

def plot_cabinet_results(results_by_cabinet: dict, optimal_cabinet: int = None):
    if not results_by_cabinet:
        print("No results to plot.")
        return

    # ===================================================================
    # 1. Build DataFrame with robust parsing
    # ===================================================================
    rows = []
    for data in results_by_cabinet.values():
        fm = data["financial_metrics"]

        # --- SPV IRR ---
        irr_raw = fm.get("spv_irr_value")
        if isinstance(irr_raw, (int, float)):
            spv_irr = irr_raw * 100
        elif irr_raw is None or str(irr_raw).strip() in {"N/A", "NA", "None", ""}:
            spv_irr = None
        else:
            spv_irr = None

        # --- SPV Breakeven Year ---
        break_raw = fm.get("spv_breakeven_year")
        try:
            spv_breakeven = float(break_raw)
            spv_display = f"{spv_breakeven:.1f}"
        except:
            spv_display = str(break_raw).strip()
            if spv_display.lower() in {"never", "na", "none"}:
                spv_display = "Never"
            spv_breakeven = None  # for sorting

        rows.append({
            "Cabinets": data["cabinets"],
            "Power_kW": data["p_nom"],
            "Energy_kWh": data["e_nom"],
            "Upfront_MNTD": data["upfront_cost"] / 1e6,
            "Annual_Savings_MNTD": data["gross_savings"] / 1e6,

            "SPV_NPV_MNTD": fm["spv_npv"] / 1e6,
            "SPV_IRR_%": spv_irr,
            "SPV_Breakeven_Yr": spv_breakeven,
            "SPV_Breakeven_Display": spv_display,

            "spv_cf_table": fm["spv_cashflow_table"],
            "grid_proj": data.get("grid_proj"),
        })

    df = pd.DataFrame(rows).sort_values("Cabinets").reset_index(drop=True)
    if df.empty:
        print("DataFrame is empty.")
        return

    # ===================================================================
    # 2. Optimal = Max SPV NPV
    # ===================================================================
    if optimal_cabinet is None or optimal_cabinet not in df["Cabinets"].values:
        optimal_cabinet = int(df.loc[df["SPV_NPV_MNTD"].idxmax(), "Cabinets"])
    opt_row = df[df["Cabinets"] == optimal_cabinet].iloc[0]

    # ===================================================================
    # 3. Top 5 for dispatch & cashflows
    # ===================================================================
    top5 = df.sort_values("SPV_NPV_MNTD", ascending=False).head(5)

    sample_date = "2024-07-15"
    try:
        first_cab = int(top5.iloc[0]["Cabinets"])
        if results_by_cabinet[first_cab].get("grid_proj") is not None:
            sample_date = results_by_cabinet[first_cab]["grid_proj"].index[0].strftime("%Y-%m-%d")
    except:
        pass

    # ===================================================================
    # 4. Layout
    # ===================================================================
    n_dispatch = min(4, len(top5))
    n_waterfall = min(4, len(top5))
    total_rows = 8 + n_dispatch + n_waterfall

    fig = make_subplots(
        rows=total_rows, cols=1,
        subplot_titles=[
            "1. SPV NPV (20Y, MNTD) – Bank's True Return",
            "2. SPV IRR (%)",
            "3. SPV Breakeven Year (Bank Recovery)",
            "4. Simple Payback vs SPV Breakeven",
            "5. Annual Savings vs Upfront Cost (MNTD)",
            "6. System Size (kW / kWh)",
            "7. Marginal Benefit per Extra MNTD Invested",
            "8. Equity NPV Summary",
        ] + [f"Daily Grid Import – {int(r.Cabinets)} cabinets ({sample_date})" for _, r in top5.head(n_dispatch).iterrows()]
          + [f"Equity Cashflow Waterfall – {int(r.Cabinets)} cabinets" for _, r in top5.head(n_waterfall).iterrows()],
        vertical_spacing=0.05,
    )

    opt_color = "#d62728"
    bar_colors = [opt_color if c == optimal_cabinet else "#1f77b4" for c in df["Cabinets"]]

    # 1. SPV NPV
    fig.add_trace(go.Bar(x=df["Cabinets"], y=df["SPV_NPV_MNTD"], marker_color=bar_colors,
                         name="SPV NPV (MNTD)"), row=1, col=1)
    fig.add_trace(go.Scatter(x=[optimal_cabinet], y=[opt_row["SPV_NPV_MNTD"]],
                             mode="markers", marker=dict(size=20, symbol="star", color="gold", line=dict(width=4, color="black")),
                             name="Optimal"), row=1, col=1)

    # 2. SPV IRR (skip N/A)
    irr_df = df[df["SPV_IRR_%"].notna()]
    if not irr_df.empty:
        fig.add_trace(go.Scatter(x=irr_df["Cabinets"], y=irr_df["SPV_IRR_%"],
                                 mode="markers+lines", line=dict(color="#9467bd", width=3),
                                 marker=dict(size=10), name="SPV IRR"), row=2, col=1)
        if opt_row["SPV_IRR_%"] is not None:
            fig.add_trace(go.Scatter(x=[optimal_cabinet], y=[opt_row["SPV_IRR_%"]], mode="markers",
                                     marker=dict(size=22, symbol="star", color="gold", line=dict(width=4, color="black")),
                                     showlegend=False), row=2, col=1)
    fig.add_hline(y=12, line_dash="dash", line_color="green", annotation_text="12% Hurdle", row=2, col=1)

    # 3. SPV Breakeven (numeric only + annotations for "Never")
    num_df = df[df["SPV_Breakeven_Yr"].notna()]
    if not num_df.empty:
        fig.add_trace(go.Bar(x=num_df["Cabinets"], y=num_df["SPV_Breakeven_Yr"],
                             text=num_df["SPV_Breakeven_Display"], textposition="outside",
                             marker_color="#ff7f0e", name="SPV Breakeven"), row=3, col=1)
    never_df = df[df["SPV_Breakeven_Yr"].isna()]
    for _, row in never_df.iterrows():
        fig.add_annotation(x=row["Cabinets"], y=1, text="Never", showarrow=True,
                           arrowcolor="red", font=dict(color="red", size=12),
                           bgcolor="white", bordercolor="red", row=3, col=1)
    fig.add_hline(y=10, line_dash="dash", line_color="red", annotation_text="Bank Max 10Y", row=3, col=1)

    # 4. Payback comparison
    simple_payback = df["Upfront_MNTD"] / df["Annual_Savings_MNTD"]
    if not num_df.empty:
        fig.add_trace(go.Bar(x=num_df["Cabinets"], y=num_df["SPV_Breakeven_Yr"], marker_color="#ff7f0e"), row=4, col=1)
    fig.add_trace(go.Scatter(x=df["Cabinets"], y=simple_payback, mode="markers+lines",
                             name="Simple Payback", line=dict(dash="dot"), marker=dict(color="black")), row=4, col=1)

    # 5. Savings & Cost
    fig.add_trace(go.Bar(x=df["Cabinets"], y=df["Annual_Savings_MNTD"], name="Annual Savings", marker_color="#2ca02c"), row=5, col=1)
    fig.add_trace(go.Bar(x=df["Cabinets"], y=df["Upfront_MNTD"], name="Upfront Cost", marker_color="#d62728"), row=5, col=1)

    # 6. System Size
    fig.add_trace(go.Bar(x=df["Cabinets"], y=df["Power_kW"], name="Power (kW)", marker_color="#1f77b4"), row=6, col=1)
    fig.add_trace(go.Scatter(x=df["Cabinets"], y=df["Energy_kWh"], mode="markers+lines",
                             name="Energy (kWh)", marker=dict(color="#ff7f0e"), yaxis="y2"), row=6, col=1)
    fig.update_yaxes(title_text="Power (kW)", row=6, col=1)
    fig.update_yaxes(title_text="Energy (kWh)", secondary_y=True, row=6, col=1)

    # 7. Marginal Benefit
    df_s = df.sort_values("Cabinets")
    if len(df_s) > 1:
        marginal = df_s["Annual_Savings_MNTD"].diff() / df_s["Upfront_MNTD"].diff()
        marginal.iloc[0] = marginal.iloc[1]
    else:
        marginal = pd.Series([df_s["Annual_Savings_MNTD"].iloc[0] / df_s["Upfront_MNTD"].iloc[0]], index=df_s.index)  # Average return
    fig.add_trace(go.Bar(x=df_s["Cabinets"], y=marginal, marker_color="#2ca02c",
                         text=marginal.round(3), textposition="outside"), row=7, col=1)

    # 8. Summary
    fig.add_trace(go.Bar(x=df["Cabinets"], y=df["SPV_NPV_MNTD"], marker_color=bar_colors,
                         showlegend=False), row=8, col=1)
    irr_text = f"{opt_row['SPV_IRR_%']:.1f}%" if opt_row["SPV_IRR_%"] is not None else "N/A"
    fig.add_annotation(
        text=f"OPTIMAL\n{int(optimal_cabinet)} cabinets\n"
             f"SPV NPV: {opt_row['SPV_NPV_MNTD']:.1f} MNTD\n"
             f"IRR: {irr_text} | SPV: {opt_row['SPV_Breakeven_Display']} Year",
        x=optimal_cabinet, y=opt_row["SPV_NPV_MNTD"], ay=-70,
        font=dict(size=16, color="white"), bgcolor=opt_color, showarrow=True,
        arrowhead=2, arrowcolor=opt_color, row=8, col=1
    )

    # Dispatch + Waterfalls (unchanged, safe)
    colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"]
    for i, (_, row) in enumerate(top5.head(n_dispatch).iterrows()):
        cabs = int(row["Cabinets"])
        r = 9 + i
        try:
            day = results_by_cabinet[cabs]["grid_proj"].loc[f"{sample_date} 00:00":f"{sample_date} 23:59"]
            fig.add_trace(go.Scatter(x=day.index.strftime("%H:%M"), y=day.values,
                                     line=dict(color=colors[i], width=3), fill="tozeroy"), row=r, col=1)
        except:
            fig.add_annotation(text="No data", x=0.5, y=0.5, xref="paper", yref="paper", showarrow=False, row=r, col=1)

    for i, (_, row) in enumerate(top5.head(n_waterfall).iterrows()):
        cabs = int(row["Cabinets"])
        cf = pd.DataFrame(row["spv_cf_table"])
        r = 9 + n_dispatch + i
        fig.add_trace(go.Waterfall(
            x=cf["Year"], y=cf["SPV Savings Share"] / 1e6,
            text=[f"{v:+.1f}" for v in cf["SPV Savings Share"] / 1e6],
            textposition="outside",
            increasing={"marker": {"color": "#2ca02c"}},
            decreasing={"marker": {"color": "#d62728"}},
            totals={"marker": {"color": "gold" if cabs == optimal_cabinet else "#9467bd", "line": {"width": 5}}}
        ), row=r, col=1)

    # Final layout
    irr_title = f"{opt_row['SPV_IRR_%']:.1f}%" if opt_row["SPV_IRR_%"] is not None else "N/A"
    fig.update_layout(
        height=480 * total_rows,
        title=dict(
            text=f"<b>BESS Investment Dashboard</b><br>"
                 f"Optimal: <span style='color:gold'>{int(optimal_cabinet)}</span> cabinets → "
                 f"SPV NPV <b>{opt_row['SPV_NPV_MNTD']:.1f} MNTD</b> | IRR <b>{irr_title}</b> | "
                 f"SPV Breakeven <b>{opt_row['SPV_Breakeven_Display']}Y</b>",
            x=0.5, font=dict(size=20)
        ),
        template="plotly_white",
        showlegend=False,
        margin=dict(l=80, r=80, t=140, b=80)
    )

    Path("result").mkdir(exist_ok=True)
    fig.write_html("result/bess_dashboard.html", include_plotlyjs="cdn",
                   config={"responsive": True, "displayModeBar": True})

    print(f"\nDASHBOARD EXPORTED: result/bess_dashboard.html")
    print(f"   Optimal: {int(optimal_cabinet)} cabinets")
    print(f"   SPV NPV : {opt_row['SPV_NPV_MNTD']:.1f} MNTD")
    print(f"   SPV IRR : {irr_title}")
    print(f"   SPV Breakeven: {opt_row['SPV_Breakeven_Display']} years")


def plot_optimal_detail(results: dict, config: dict):
    opt = results["optimal_cabinet"]
    fm = opt["financial_metrics"]
    cfg = config
    bat = cfg["battery"]["unit"]
    cost_cfg = cfg["financial"]["system_cost"]
    lifetime = cfg["financial"]["lifetime_years"]

    # Clean 8-row layout – no spans, no extra whitespace
    fig = make_subplots(
        rows=8, cols=2,
        subplot_titles=[
            "Simulation Configuration Summary",
            "Key Financial & System Highlights",
            "Annual Electricity Bill Comparison",
            "Battery Dispatch – Sample Day (2024-07-15)",
            "Equity Cash Flow Table (20Y Degraded)",
            "SPV Cash Flow Table (20Y)",
            "Replacement & Salvage Schedule",
            "Cash Flow Waterfalls (Equity vs SPV)",
        ],
        specs=[
            [{"colspan": 2, "type": "table"}, None],      # 1. Config
            [{"colspan": 2, "type": "table"}, None],      # 2. Highlights
            [{"colspan": 2, "type": "xy"}, None],         # 3. Bill
            [{"colspan": 2, "type": "xy"}, None],         # 4. Dispatch
            [{"colspan": 2, "type": "table"}, None],      # 5. Equity Table
            [{"colspan": 2, "type": "table"}, None],      # 6. SPV Table
            [{"colspan": 2, "type": "xy"}, None],         # 7. Replacements
            [{"colspan": 2, "type": "xy"}, None],         # 8. Waterfalls
        ],
        row_heights=[1.0, 0.8, 0.6, 0.8, 1.3, 1.3, 0.6, 1.0],
        vertical_spacing=0.06
    )

    # === 1. Configuration Summary ===
    config_rows = [
        ("Simulation Period", f"{cfg['start_date']} to {cfg['end_date']}"),
        ("Time Resolution", f"{cfg['time_steps_per_hour']} steps/hour"),
        ("Project Lifetime", f"{lifetime} years"),
        ("Discount Rate", f"{cfg['financial']['discount_rate']*100:.1f}%"),
        ("SPV Interest Rate", f"{cfg['financial']['spv_interest_rate']*100:.1f}%"),
        ("Revenue Split", f"SPV {cfg['financial']['esco']['spv']:.0%} | Factory {cfg['financial']['esco']['factory']:.0%} | "
                         f"Op {cfg['financial']['esco']['operation']:.0%} | Service {cfg['financial']['esco']['service']:.0%}"),
        ("Base Tariff", cfg["base_case"]["tariff_type"].capitalize()),
        ("Project Tariff", cfg["project_case"]["tariff_type"].capitalize()),
        ("Base Contract Cap", f"{cfg['base_case']['reg_cap_input']} kW"),
        ("Project Contract Cap", f"{cfg['project_case']['reg_cap_input']} kW (Reg) + {cfg['project_case']['off_cap_input']} kW (Off-peak)"),
        ("Battery per Cabinet", f"{bat['power_rating_kw']:.1f} kW / {bat['energy_capacity_kwh']:.0f} kWh"),
        ("Usable Power Fraction", f"{bat['rating_usable_fraction']:.1%}"),
        ("Dispatch Efficiency", f"{bat['efficiency_dispatch']:.1%}"),
        ("Annual Degradation", f"{bat['decay_rate']*100:.2f}%/year"),
        ("Battery Cost", f"USD ${cost_cfg['usd_per_kwh']}/kWh @ {cost_cfg['exchange_rate']:.1f} NTD/USD"),
        ("Salvage Fraction", f"{cfg['battery']['costs']['salvage_fraction']:.0%}"),
    ]

    fig.add_trace(go.Table(
        header=dict(values=["<b>Parameter</b>", "<b>Value</b>"],
                    fill_color="#1f77b4", font=dict(color="white", size=13), align="left"),
        cells=dict(
            values=[[r[0] for r in config_rows], [r[1] for r in config_rows]],
            align="left", font=dict(size=12), height=30,
            fill_color=[["#f8f9fa", "white"] * len(config_rows)]
        )
    ), row=1, col=1)

    # === 2. Key Highlights Table ===
    irr_raw = fm.get("spv_irr_value")
    irr_display = f"{irr_raw*100:.1f}%" if irr_raw is not None else "N/A"
    breakeven_raw = fm.get("spv_breakeven_year")
    breakeven_display = f"{breakeven_raw:.1f} years" if isinstance(breakeven_raw, (int, float)) and breakeven_raw < 100 else "Never"

    highlight_rows = [
        ("Optimal Cabinets", f"{opt['cabinets']} units"),
        ("Power Rating", f"{opt['p_nom']:,.0f} kW"),
        ("Energy Capacity", f"{opt['e_nom']:,.0f} kWh"),
        ("Upfront Cost", f"NT$ {opt['upfront_cost']:,.0f}"),
        ("Gross Annual Savings", f"NT$ {opt['gross_savings']:,.0f}"),
        ("SPV NPV (20Y)", f"NT$ {fm['spv_npv']:,.0f}"),
        ("SPV IRR", irr_display),
        ("SPV Breakeven", breakeven_display),
        ("Equity NPV (20Y)", f"NT$ {fm['equity_npv']:,.0f}"),
    ]

    fig.add_trace(go.Table(
        header=dict(values=["<b>Key Metric</b>", "<b>Value</b>"],
                    fill_color="#2ca02c", font=dict(color="white", size=14), align="center"),
        cells=dict(
            values=[[r[0] for r in highlight_rows], [r[1] for r in highlight_rows]],
            align=["left", "right"], font=dict(size=13),
            fill_color="white", height=40
        )
    ), row=2, col=1)

    # === 3. Annual Bill ===
    fig.add_trace(go.Bar(
        x=["Base Case", "With BESS"],
        y=[results['total_base'], results['total_proj']],
        marker_color=["#d62728", "#2ca02c"],
        text=[f"NT$ {results['total_base']:,.0f}", f"NT$ {results['total_proj']:,.0f}"],
        textposition="outside"
    ), row=3, col=1)
    fig.add_annotation(
        text=f"<b>Annual Savings: NT$ {opt['gross_savings']:,.0f}</b>",
        x=0.5, y=results['total_base'] * 0.8,
        font=dict(size=16, color="#2ca02c"), showarrow=False, bgcolor="white",
        row=3, col=1
    )

    # === 4. Sample Day Dispatch ===
    sample_date = "2024-07-15"
    try:
        mask = results["grid_proj"].index.strftime("%Y-%m-%d") == sample_date
        if mask.any():
            t = results["grid_proj"].index[mask].strftime("%H:%M")
            fig.add_trace(go.Scatter(x=t, y=results["load_kw"][mask], name="Site Load", line=dict(color="black", width=2)), row=4, col=1)
            fig.add_trace(go.Scatter(x=t, y=results["grid_proj"][mask], name="Grid Import", fill="tonexty", fillcolor="rgba(255,165,0,0.3)"), row=4, col=1)
            fig.add_trace(go.Scatter(x=t, y=-results["battery_dispatch"][mask], name="Battery Discharge (+)", fill="tozeroy", fillcolor="rgba(50,205,50,0.4)"), row=4, col=1)
            fig.update_xaxes(title_text="Time of Day", row=4, col=1)
            fig.update_yaxes(title_text="Power (kW)", row=4, col=1)
    except:
        fig.add_annotation(text="No dispatch data for sample day", x=0.5, y=0.5,
                           xref="paper", yref="paper", showarrow=False, row=4, col=1)

    # === 5. Full Equity Cash Flow Table ===
    eq_df = pd.DataFrame(fm["equity_cashflow_table"])
    eq_display = eq_df[[
        "Year", "Factory Rev", "Operation Rev", "Service Rev", "Total Equity Rev",
        "SPV Interest Cost", "O&M/Rep Cost", "Salvage", "Net Equity CF", "Equity Cumulative CF"
    ]].round(0).astype(int)

    fig.add_trace(go.Table(
        header=dict(values=[f"<b>{col}</b>" for col in eq_display.columns],
                    fill_color="#1f77b4", font=dict(color="white", size=12), align="center"),
        cells=dict(
            values=[eq_display[col] for col in eq_display.columns],
            format=["", ",.0f", ",.0f", ",.0f", ",.0f", ",.0f", ",.0f", ",.0f", ",.0f", ",.0f"],
            align="center", font=dict(size=11),
            fill_color=[["white", "#f8f9fa"] * (len(eq_display)//2 + 1)]
        )
    ), row=5, col=1)

    # === 6. Full SPV Cash Flow Table ===
    spv_df = pd.DataFrame(fm["spv_cashflow_table"])
    spv_display = spv_df[[
        "Year", "SPV Interest Income", "SPV Savings Share",
        "SPV Recovery Cumulative", "Interest Cumulative CF"
    ]].round(0).astype(int)

    fig.add_trace(go.Table(
        header=dict(values=[f"<b>{col}</b>" for col in spv_display.columns],
                    fill_color="#d62728", font=dict(color="white", size=12), align="center"),
        cells=dict(
            values=[spv_display[col] for col in spv_display.columns],
            format=["", ",.0f", ",.0f", ",.0f", ",.0f"],
            align="center", font=dict(size=11),
            fill_color=[["white", "#fff0f0"] * (len(spv_display)//2 + 1)]
        )
    ), row=6, col=1)

    # === 7. Replacement & Salvage ===
    repl = cfg["battery"]["costs"]["replacements"]
    has_replacement = repl and repl[0]["fraction_of_energy_cost"] > 0
    if has_replacement:
        years = [r["year"] for r in repl]
        costs = [r["fraction_of_energy_cost"] * opt['upfront_cost'] for r in repl]
        fig.add_trace(go.Bar(x=years, y=[-c for c in costs], name="Replacement Cost", marker_color="#d62728"), row=7, col=1)
    salvage = opt.get("salvage_value", 0)
    if salvage > 0:
        fig.add_trace(go.Bar(x=[lifetime], y=[salvage], name="Salvage Value", marker_color="#2ca02c"), row=7, col=1)
    if not has_replacement and salvage == 0:
        fig.add_annotation(text="No replacement or salvage scheduled", x=0.5, y=0.5,
                           xref="paper", yref="paper", showarrow=False, row=7, col=1)

    # === 8. Waterfalls ===
    fig.add_trace(go.Waterfall(
        name="Equity Net CF",
        x=eq_df["Year"], y=eq_df["Net Equity CF"],
        text=[f"{v:+,.0f}" for v in eq_df["Net Equity CF"]],
        increasing={"marker": {"color": "#2ca02c"}},
        decreasing={"marker": {"color": "#d62728"}},
        totals={"marker": {"color": "gold"}}
    ), row=8, col=1)

    fig.add_trace(go.Waterfall(
        name="SPV Savings Share",
        x=spv_df["Year"], y=spv_df["SPV Savings Share"],
        text=[f"{v:+,.0f}" for v in spv_df["SPV Savings Share"]],
        increasing={"marker": {"color": "#9467bd"}},
        decreasing={"marker": {"color": "#ff7f0e"}},
        totals={"marker": {"color": "navy"}}
    ), row=8, col=1)

    # === Final Layout ===
    fig.update_layout(
        height=6200,
        title=dict(
            text=f"<b>BESS Optimal Configuration – Detailed Report</b><br>"
                 f"{opt['cabinets']} cabinets → SPV NPV NT$ {fm['spv_npv']:,.0f} | IRR {irr_display} | Breakeven {breakeven_display}",
            x=0.5, font=dict(size=21)
        ),
        template="plotly_white",
        showlegend=True,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="center", x=0.5),
        margin=dict(t=150)
    )

    Path("result").mkdir(exist_ok=True)
    fig.write_html("result/bess_optimal_detail.html", include_plotlyjs="cdn", config={"responsive": True})

    print("\nOPTIMAL DETAILED REPORT EXPORTED (CLEAN LAYOUT):")
    print("   → result/bess_optimal_detail.html")
    print(f"   Optimal: {opt['cabinets']} cabinets | SPV NPV: NT$ {fm['spv_npv']:,.0f}")