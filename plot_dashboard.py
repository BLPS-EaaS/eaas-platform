import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd
from pathlib import Path

# ------------------------------------------------------------------
# INPUT: results dict from main()
# ------------------------------------------------------------------
def plot_dashboard(results: dict, zoom_date: str | None = None):
    """
    5-panel (or 6-panel with optional Original Case) energy-arbitrage dashboard.
    - Full datetime on every x-axis
    - TRUE synchronized zoom: zoom any panel → all panels follow
    - Uses only `results` (no cell dependency)
    """
    # ---------- 1. Pull data from results ----------
    original_base = results.get("original_base")  # May be None
    load          = results["load_kw"]
    grid_base     = results["grid_base"]
    grid_proj     = results["grid_proj"]
    battery_p     = results["battery_dispatch"]
    soc_percent   = results["soc_percent"]

    # Constant cap lines (time-series for alignment)
    hard_cap = results["proj_cap"]
    base_cap = results["base_cap"]

    # Battery charge / discharge
    battery_discharge = battery_p.clip(lower=0)
    battery_charge    = (-battery_p).clip(lower=0)

    # Advanced flows
    grid_to_battery = battery_charge
    grid_to_load    = grid_proj - grid_to_battery
    battery_to_load = battery_discharge

    # Hourly cost (NT$/hr)
    cost_base = grid_base * results["base_tariff_rate"]
    cost_proj = grid_proj * results["proj_tariff_rate"]

    # ---------- 2. Optional single-day zoom ----------
    if zoom_date:
        start = f"{zoom_date} 00:00"
        end   = f"{zoom_date} 23:59"
        def _slice(s):
            return s.loc[start:end] if isinstance(s, pd.Series) else s

        # List all series to slice
        series_list = [
            load, grid_base, grid_proj, battery_p, hard_cap, base_cap,
            battery_discharge, battery_charge, grid_to_battery,
            grid_to_load, battery_to_load, soc_percent, cost_base, cost_proj
        ]
        if original_base:
            series_list += [original_base["load_kw"], original_base["grid_series"]]

        for i, var in enumerate(series_list):
            series_list[i] = _slice(var)

        # Reassign sliced versions
        load, grid_base, grid_proj, battery_p, hard_cap, base_cap, \
        battery_discharge, battery_charge, grid_to_battery, \
        grid_to_load, battery_to_load, soc_percent, cost_base, cost_proj = series_list[:14]

        if original_base:
            og_load = series_list[-2]
            og_grid_base = series_list[-1]
        else:
            og_load = og_grid_base = None
    else:
        if original_base:
            og_load = original_base["load_kw"]
            og_grid_base = original_base["grid_series"]

    # ---------- 3. Determine number of rows ----------
    show_original = original_base is not None
    n_rows = 6 if show_original else 5

    # Define subplot titles and row heights dynamically
    base_titles = [
        "1. Base Case: Demand & Grid",
        "2. Project Case (Simple): Demand + Grid + Battery",
        "3. Project Case (Advanced): Full Flow + Hard Cap",
        "4. Battery State of Charge (%)",
        "5. Hourly Operating Cost (NT$/hr)"
    ]
    if show_original:
        subplot_titles = ("0. Original Case: Demand & Grid",) + tuple(base_titles)
        row_heights = [0.18, 0.18, 0.18, 0.20, 0.15, 0.11]  # 6 rows
    else:
        subplot_titles = tuple(base_titles)
        row_heights = [0.22, 0.22, 0.25, 0.18, 0.13]  # 5 rows

    # ---------- 4. Build figure ----------
    fig = make_subplots(
        rows=n_rows, cols=1,
        subplot_titles=subplot_titles,
        shared_xaxes=False,  # Manual sync for true cross-panel zoom
        vertical_spacing=0.07,
        row_heights=row_heights
    )

    row_offset = 1 if show_original else 0  # Shift all rows down if original is shown

    # ---- SUBPLOT 0: Original Case (only if data exists) ----
    if show_original:
        fig.add_trace(go.Scatter(x=og_load.index, y=og_load, name="Demand (Original)",
                                line=dict(color="black", width=2)), row=1, col=1)
        fig.add_trace(go.Scatter(x=og_grid_base.index, y=og_grid_base, name="Grid (Original)",
                                fill="tozeroy", fillcolor="rgba(255,99,132,0.6)",
                                line=dict(color="tomato")), row=1, col=1)
        fig.add_trace(go.Scatter(x=base_cap.index, y=base_cap, name="Base Cap",
                                line=dict(color="gray", dash="dash")), row=1, col=1)

    # ---- SUBPLOT 1: Base Case ----
    fig.add_trace(go.Scatter(x=load.index, y=load, name="Demand",
                             line=dict(color="black", width=2)), row=1 + row_offset, col=1)
    fig.add_trace(go.Scatter(x=grid_base.index, y=grid_base, name="Grid",
                             fill="tozeroy", fillcolor="rgba(255,99,132,0.6)",
                             line=dict(color="tomato")), row=1 + row_offset, col=1)
    fig.add_trace(go.Scatter(x=base_cap.index, y=base_cap, name="Base Cap",
                             line=dict(color="gray", dash="dash")), row=1 + row_offset, col=1)

    # ---- SUBPLOT 2: Project (simple) ----
    fig.add_trace(go.Scatter(x=load.index, y=load, name="Demand",
                             line=dict(color="black", width=1.5)), row=2 + row_offset, col=1)
    fig.add_trace(go.Scatter(x=grid_proj.index, y=grid_proj, name="Grid Supply",
                             fill="tozeroy", fillcolor="rgba(144,238,144,0.7)",
                             line=dict(color="lightgreen")), row=2 + row_offset, col=1)
    fig.add_trace(go.Scatter(x=battery_discharge.index, y=battery_discharge,
                             name="Battery Discharge", fill="tozeroy",
                             fillcolor="rgba(255,159,64,0.8)",
                             line=dict(color="orange")), row=2 + row_offset, col=1)
    fig.add_trace(go.Scatter(x=battery_charge.index, y=battery_charge,
                             name="Battery Charge", fill="tozeroy",
                             fillcolor="rgba(54,162,235,0.8)",
                             line=dict(color="royalblue")), row=2 + row_offset, col=1)

    # ---- SUBPLOT 3: Project (advanced) ----
    fig.add_trace(go.Scatter(x=hard_cap.index, y=hard_cap, name="Hard Cap",
                             line=dict(color="black", width=2, dash="dash")), row=3 + row_offset, col=1)
    fig.add_trace(go.Scatter(x=grid_proj.index, y=grid_proj, name="Total Grid Load",
                             line=dict(color="red", width=3)), row=3 + row_offset, col=1)
    fig.add_trace(go.Scatter(x=load.index, y=load, name="Total Load",
                             line=dict(color="black", width=1.5)), row=3 + row_offset, col=1)
    fig.add_trace(go.Scatter(x=grid_to_load.index, y=grid_to_load,
                             name="Grid → Load", fill="tozeroy",
                             fillcolor="rgba(144,238,144,0.6)",
                             line=dict(color="lightgreen")), row=3 + row_offset, col=1)
    fig.add_trace(go.Scatter(x=grid_to_battery.index, y=grid_to_battery,
                             name="Grid → Battery", fill="tozeroy",
                             fillcolor="rgba(100,180,255,0.7)",
                             line=dict(color="dodgerblue")), row=3 + row_offset, col=1)
    fig.add_trace(go.Scatter(x=battery_to_load.index, y=battery_to_load,
                             name="Battery → Load", fill="tozeroy",
                             fillcolor="rgba(255,159,64,0.8)",
                             line=dict(color="orange")), row=3 + row_offset, col=1)

    # ---- SUBPLOT 4: SOC ----
    fig.add_trace(go.Scatter(x=soc_percent.index, y=soc_percent, name="SOC (%)",
                             line=dict(color="purple", width=2),
                             fill="tozeroy", fillcolor="rgba(128,0,128,0.2)"), row=4 + row_offset, col=1)

    # ---- SUBPLOT 5: Cost ----
    fig.add_trace(go.Scatter(x=cost_base.index, y=cost_base,
                             name="Cost (No Battery)", line=dict(color="red", width=2)), row=5 + row_offset, col=1)
    fig.add_trace(go.Scatter(x=cost_proj.index, y=cost_proj,
                             name="Cost (With Battery)", line=dict(color="green", width=2)), row=5 + row_offset, col=1)

    # ---------- 5. Layout with TRUE synchronized zoom ----------
    tickformat = "%m-%d %H:%M"

    fig.update_layout(
        height=1200 + (200 if show_original else 0),  # Extra height for 6th panel
        title_text="Energy Arbitrage – Dashboard (Synced Zoom + Full Time)",
        title_x=0.5,
        hovermode="x unified",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        template="plotly_white",
        margin=dict(t=160, l=80, r=80, b=80),
        uirevision="sync_zoom",  # Preserves zoom state across updates
        dragmode="zoom",
    )

    # Sync all x-axes: first axis is master, others match it
    for row in range(1, n_rows + 1):
        fig.update_xaxes(
            title="Time" if row == n_rows else "",
            tickformat=tickformat,
            showgrid=True,
            gridcolor="lightgray",
            showticklabels=True,
            fixedrange=False,
            matches="x" if row > 1 else None,  # All match the first x-axis
            row=row, col=1
        )
        fig.update_yaxes(
            fixedrange=True,
            autorange=True,
            row=row, col=1
        )

    # Y-axis titles
    y_titles = [
        "Power (kW)", "Power (kW)", "Power (kW)", "Power (kW)", "SOC (%)", "Cost (NT$/hr)"
    ]
    if show_original:
        y_titles = ["Power (kW)"] + y_titles  # Add one more for original panel

    for i, title in enumerate(y_titles, start=1):
        fig.update_yaxes(title_text=title, row=i, col=1)

    fig.update_yaxes(range=[0, 100], row=4 + row_offset, col=1)  # SOC fixed 0-100

    # ---------- 6. Export ----------
    suffix = f"_{zoom_date}" if zoom_date else "_full_year"
    out_path = Path("result")
    out_path.mkdir(exist_ok=True)
    filename = out_path / f"energy_arbitrage_dashboard.html"
    fig.write_html(filename)
    print(f"Exported: {filename}")

    # fig.show()  # Uncomment if running interactively
    return fig