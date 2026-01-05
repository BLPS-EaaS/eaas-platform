import { CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Area, ReferenceArea } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { format } from "date-fns"

interface BaseCaseChartProps {
  data: any[]
  showOriginal: boolean
  refAreaLeft?: string | null
  refAreaRight?: string | null
  onMouseDown?: (e: any) => void
  onMouseMove?: (e: any) => void
  onMouseUp?: (e: any) => void
  style?: React.CSSProperties
}

const chartConfig = {
  demand: {
    label: "Demand",
    color: "var(--chart-1)",
  },
  grid: {
    label: "Grid",
    color: "var(--chart-2)",
  },
  baseCap: {
    label: "Base Cap",
    color: "var(--muted-foreground)",
  },
  originalDemand: {
    label: "Demand (Original)",
    color: "var(--chart-3)",
  },
  originalGrid: {
    label: "Grid (Original)",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

export function BaseCaseChart({ 
  data, 
  showOriginal,
  refAreaLeft,
  refAreaRight,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  style
}: BaseCaseChartProps) {
  return (
    <div className="w-full h-[300px]" style={style}>
      <ChartContainer config={chartConfig} className="h-full w-full">
        <LineChart 
          data={data} 
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={(value) => format(new Date(value), "MM-dd HH:mm")}
            minTickGap={32}
            allowDataOverflow
          />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => format(new Date(value), "PP pp")} />} />
          <Legend />
          
          {refAreaLeft && refAreaRight && (
            <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="hsl(var(--foreground))" fillOpacity={0.05} />
          )}

          {/* Base Cap - Dashed Line */}
           <Line 
            type="monotone" 
            dataKey="base_cap" 
            stroke={chartConfig.baseCap.color}
            strokeDasharray="5 5" 
            dot={false} 
            strokeWidth={2}
            name="Base Cap"
            isAnimationActive={false}
          />

          {/* Original Case (Overlay) */}
          {showOriginal && (
            <>
               <Line 
                type="monotone" 
                dataKey="original_load_kw" 
                stroke={chartConfig.originalDemand.color}
                dot={false} 
                strokeWidth={2}
                opacity={0.5}
                name="Demand (Original)"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="original_grid_series"
                fill={chartConfig.originalGrid.color}
                stroke={chartConfig.originalGrid.color}
                fillOpacity={0.1}
                strokeOpacity={0.5}
                name="Grid (Original)"
                isAnimationActive={false}
              />
            </>
          )}

          {/* Current Base Case */}
          <Line 
            type="monotone" 
            dataKey="load_kw" 
            stroke={chartConfig.demand.color} 
            dot={false} 
            strokeWidth={2}
            name="Demand"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="grid_base"
            fill={chartConfig.grid.color}
            fillOpacity={0.4}
            stroke={chartConfig.grid.color}
            name="Grid"
            isAnimationActive={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  )
}
