"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCcw, MousePointer2, Hand } from "lucide-react"
import { BaseCaseChart } from "./charts/base-case-chart"
import { ProjectAdvancedChart } from "./charts/project-advanced-chart"
import { BatterySOCChart } from "./charts/battery-soc-chart"
import { CostChart } from "./charts/cost-chart"
import { format, subMonths, startOfYear, subYears, subDays } from "date-fns"
import { Toggle } from "@/components/ui/toggle"

interface VisualizationProps {
  results: any
}

type PresetType = '1D' | '7D' | '1M' | '3M' | '6M' | 'YTD' | '1Y';
type InteractionMode = 'zoom' | 'pan';

export function OptimizationCharts({ results }: VisualizationProps) {
  const t = useTranslations('OptimizationResults.charts');

  const chartData = useMemo(() => {
    if (!results) return []

    // Check SOC scaling
    const socValues = results.soc_percent ? Object.values(results.soc_percent) as number[] : [];
    const maxSoc = Math.max(...socValues, 0);
    const socNeedsScaling = maxSoc <= 1.0 && maxSoc > 0;
    
    const timestamps = Object.keys(results.load_kw).sort();

    return timestamps.map((timestamp) => {
        // Basic retrievals
        const load_kw = results.load_kw[timestamp] || 0;
        const grid_base = results.grid_base[timestamp] || 0;
        const grid_proj = results.grid_proj[timestamp] || 0;
        const base_cap = results.base_cap[timestamp] || 0;
        const proj_cap = results.proj_cap[timestamp] || 0;
        const battery_dispatch = results.battery_dispatch[timestamp] || 0; // +ve discharge, -ve charge
        
        let soc_percent = results.soc_percent[timestamp] || 0;
        if (socNeedsScaling) {
            soc_percent *= 100;
        }

        // Original Base (if exists)
        const original_load_kw = results.original_base?.load_kw?.[timestamp] || null;
        const original_grid_series = results.original_base?.grid_series?.[timestamp] || null;

        // Tariffs
        const base_tariff_rate = results.base_tariff_rate?.[timestamp] || 0;
        const proj_tariff_rate = results.proj_tariff_rate?.[timestamp] || 0;

        // Derived calculations (matching Python script)
        const battery_discharge = Math.max(0, battery_dispatch);
        const battery_charge = Math.max(0, -battery_dispatch); // Charge is positive flow INTO battery
        
        // Advanced flows
        const grid_to_battery = battery_charge; 
        const grid_to_load = grid_proj - grid_to_battery;
        const battery_to_load = battery_discharge;

        // Costs
        const cost_base = grid_base * base_tariff_rate;
        const cost_proj = grid_proj * proj_tariff_rate;

        return {
            timestamp,
            load_kw,
            grid_base,
            grid_proj,
            base_cap,
            proj_cap,
            battery_dispatch,
            soc_percent,
            original_load_kw,
            original_grid_series,
            grid_to_battery,
            grid_to_load,
            battery_to_load,
            cost_base,
            cost_proj
        }
    })
  }, [results])

  // State
  const [zoomRange, setZoomRange] = useState<{ startIndex?: number, endIndex?: number }>({
      startIndex: 0,
      endIndex: undefined
  })
  const [refAreaLeft, setRefAreaLeft] = useState<string | null>(null)
  const [refAreaRight, setRefAreaRight] = useState<string | null>(null)
  const [activePreset, setActivePreset] = useState<PresetType | null>(null)
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('zoom')
  const [panStartX, setPanStartX] = useState<number | null>(null) // We use Index for Panning
  const [hasInitialized, setHasInitialized] = useState(false)

  // Filter data based on zoom range
  const filteredData = useMemo(() => {
      if (!chartData.length) return [];
      const start = zoomRange.startIndex ?? 0;
      const end = zoomRange.endIndex ?? chartData.length - 1;
      return chartData.slice(start, end + 1);
  }, [chartData, zoomRange]);


  // Preset Handlers
  const applyPreset = (preset: PresetType) => {
      if (!chartData.length) return;
      const totalPoints = chartData.length;
      const lastDate = new Date(chartData[totalPoints - 1].timestamp);
      let startDate: Date;

      switch (preset) {
          case '1D': startDate = subDays(lastDate, 1); break;
          case '7D': startDate = subDays(lastDate, 7); break;
          case '1M': startDate = subMonths(lastDate, 1); break;
          case '3M': startDate = subMonths(lastDate, 3); break;
          case '6M': startDate = subMonths(lastDate, 6); break;
          case 'YTD': startDate = startOfYear(lastDate); break;
          case '1Y': startDate = subYears(lastDate, 1); break;
          default: startDate = subMonths(lastDate, 1);
      }
      
      const startIndex = chartData.findIndex(d => new Date(d.timestamp) >= startDate);
      setZoomRange({
          startIndex: startIndex >= 0 ? startIndex : 0,
          endIndex: totalPoints - 1
      });
      setActivePreset(preset);
  }

  // Initial Default Zoom using 7D
  useEffect(() => {
      if (!hasInitialized && chartData.length > 0) {
          applyPreset('7D');
          setHasInitialized(true);
      }
  }, [hasInitialized, chartData]);

  // Click-and-Drag Handlers
  const zoom = () => {
    if (interactionMode === 'pan') {
        setPanStartX(null)
        return
    }

    if (refAreaLeft === refAreaRight || refAreaRight === null) {
      setRefAreaLeft(null)
      setRefAreaRight(null)
      return
    }

    let left = refAreaLeft
    let right = refAreaRight
    if (left! > right!) [left, right] = [right, left]

    const startIndex = chartData.findIndex(d => d.timestamp === left)
    const endIndex = chartData.findIndex(d => d.timestamp === right)

    if (startIndex >= 0 && endIndex >= 0) {
        setZoomRange({ startIndex, endIndex })
        setActivePreset(null)
    }

    setRefAreaLeft(null)
    setRefAreaRight(null)
  }

  const handleMouseDown = (e: any) => {
      if (!e) return;
      
      // Need global index. 'activeTooltipIndex' gives index within the filtered view?
      // Recharts passes 'activeLabel' (timestamp) and 'activeTooltipIndex' (relative index).
      // Reliability: 'activeLabel' is best to find global index.
      
      if (interactionMode === 'pan') {
           // For panning, we just need to track the starting point (global index at mouse down)
           // But actually we are panning relative to movement.
           // Let's store the INDEX from the chartData that corresponds to activeLabel
            const globalIndex = chartData.findIndex(d => d.timestamp === e.activeLabel)
            if (globalIndex >= 0) {
                setPanStartX(globalIndex)
            }
      } else {
        if (e.activeLabel) {
            setRefAreaLeft(e.activeLabel)
        }
      }
  }

  const handleMouseMove = (e: any) => {
      if (!e || !e.activeLabel) return;
      
      if (interactionMode === 'pan' && panStartX !== null) {
          const currentGlobalIndex = chartData.findIndex(d => d.timestamp === e.activeLabel);
          if (currentGlobalIndex === -1) return;

          const diff = panStartX - currentGlobalIndex; // Dragging LEFT (current < start) should move window RIGHT (show future). 
          // Actually, dragging the chart to the RIGHT (visual pan right) means moving window LEFT.
          // If I grab point X and move mouse right to point Y (Y > X visual, Y < X index... wait)
          // Charts usually: Drag Right -> Pan Left (Move into past).
          // If I am at index 100, and I move mouse to where index 110 WAS...
          // Let's stick to index math:
          // newStart = currentStart + diff?
          
          if (diff !== 0) {
              const currentStart = zoomRange.startIndex ?? 0;
              const currentEnd = zoomRange.endIndex ?? chartData.length - 1;
              const windowSize = currentEnd - currentStart;

              let newStart = currentStart + diff;
              let newEnd = newStart + windowSize;

              // Clamp
              if (newStart < 0) {
                  newStart = 0;
                  newEnd = windowSize;
              }
              if (newEnd >= chartData.length) {
                  newEnd = chartData.length - 1;
                  newStart = newEnd - windowSize;
              }
              
              setZoomRange({ startIndex: newStart, endIndex: newEnd });
              // Update panStartX to current so it's incremental (avoids jumps if mouse moves fast?)
              // Actually if we update zoomRange, the data under the cursor changes... 
              // This is the tricky part of "live panning". The data SHIFTS.
              // So the "currentGlobalIndex" associated with the mouse position will CHANGE even if mouse doesn't move much.
              // We need to NOT update panStartX, but use original start vs current position? 
              // But 'activeLabel' updates based on data under cursor.
              // If we shift data, the data under cursor changes.
              
              // Better approach for live panning with Recharts (which redraws):
              // Just apply the shift, and RESET the panStartX to the NEW data index currently under cursor? 
              // Effectively "dragging the paper".
              
              setPanStartX(currentGlobalIndex); // Re-anchor to the point now under cursor (which should be roughly the same 'screen' spot?)
              setActivePreset(null);
          }
      } else {
        if (refAreaLeft) {
            setRefAreaRight(e.activeLabel)
        }
      }
  }

  const resetZoom = () => {
      setZoomRange({ startIndex: 0, endIndex: undefined });
      setActivePreset(null);
  }

  if (!results || chartData.length === 0) {
    return null
  }

  const showOriginal = !!results.original_base
  
  // Shared props for children
  const chartProps = {
      refAreaLeft: interactionMode === 'zoom' ? refAreaLeft : null,
      refAreaRight: interactionMode === 'zoom' ? refAreaRight : null,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: zoom,
      style: { cursor: interactionMode === 'pan' ? 'grab' : 'crosshair' } // Optional explicit cursor check in components
  }

  return (
    <div className="space-y-6 mt-8">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-4 rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
               {/* Mode Toggles */}
              <div className="flex items-center border rounded-md overflow-hidden">
                  <Button 
                    variant={interactionMode === 'zoom' ? 'secondary' : 'ghost'} 
                    size="icon" 
                    className="h-8 w-8 rounded-none"
                    onClick={() => setInteractionMode('zoom')}
                    title="Zoom Selection"
                  >
                      <MousePointer2 className="h-4 w-4" />
                  </Button>
                  <div className="w-px h-4 bg-border" />
                  <Button 
                    variant={interactionMode === 'pan' ? 'secondary' : 'ghost'} 
                    size="icon" 
                    className="h-8 w-8 rounded-none"
                    onClick={() => setInteractionMode('pan')}
                    title="Pan Move"
                  >
                      <Hand className="h-4 w-4" />
                  </Button>
              </div>

              <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-muted-foreground mr-2">Zoom:</span>
                  <Button variant={activePreset === '1D' ? "default" : "outline"} size="sm" onClick={() => applyPreset('1D')}>1D</Button>
                  <Button variant={activePreset === '7D' ? "default" : "outline"} size="sm" onClick={() => applyPreset('7D')}>7D</Button>
                  <Button variant={activePreset === '1M' ? "default" : "outline"} size="sm" onClick={() => applyPreset('1M')}>1M</Button>
                  <Button variant={activePreset === '3M' ? "default" : "outline"} size="sm" onClick={() => applyPreset('3M')}>3M</Button>
                  <Button variant={activePreset === '6M' ? "default" : "outline"} size="sm" onClick={() => applyPreset('6M')}>6M</Button>
                  <Button variant={activePreset === 'YTD' ? "default" : "outline"} size="sm" onClick={() => applyPreset('YTD')}>YTD</Button>
                  <Button variant={activePreset === '1Y' ? "default" : "outline"} size="sm" onClick={() => applyPreset('1Y')}>1Y</Button>
              </div>
          </div>
           <Button variant="ghost" size="sm" onClick={resetZoom} className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Reset Zoom
          </Button>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>{t('base_case')}</CardTitle>
        </CardHeader>
        <CardContent>
            <BaseCaseChart data={filteredData} showOriginal={showOriginal} {...chartProps} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>{t('project_case')}</CardTitle>
        </CardHeader>
        <CardContent>
            <ProjectAdvancedChart data={filteredData} {...chartProps} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
             <CardTitle>{t('battery_soc')}</CardTitle>
        </CardHeader>
        <CardContent>
            <BatterySOCChart data={filteredData} {...chartProps} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
             <CardTitle>{t('operating_cost')}</CardTitle>
        </CardHeader>
        <CardContent>
            <CostChart data={filteredData} {...chartProps} />
        </CardContent>
      </Card>
    </div>
  )
}
