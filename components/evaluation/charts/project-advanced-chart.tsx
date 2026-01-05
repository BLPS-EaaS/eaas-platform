import { CartesianGrid, Line, ComposedChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Area, ReferenceArea } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { format } from "date-fns"

interface ProjectAdvancedChartProps {
  data: any[]
  refAreaLeft?: string | null
  refAreaRight?: string | null
  onMouseDown?: (e: any) => void
  onMouseMove?: (e: any) => void
  onMouseUp?: (e: any) => void
  style?: React.CSSProperties
}

const chartConfig = {
  hardCap: {
    label: "Hard Cap",
    color: "var(--foreground)",
  },
  gridProj: {
    label: "Total Grid Load",
    color: "var(--destructive)",
  },
  load: {
    label: "Total Load",
    color: "var(--foreground)",
  },
  gridToLoad: {
    label: "Grid → Load",
    color: "#90EE90", // lightgreen
  },
  gridToBattery: {
    label: "Grid → Battery",
    color: "#1E90FF", // dodgerblue
  },
  batteryToLoad: {
    label: "Battery → Load",
    color: "#FFA500", // orange
  },
} satisfies ChartConfig

export function ProjectAdvancedChart({ 
  data,
  refAreaLeft,
  refAreaRight,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  style
 }: ProjectAdvancedChartProps) {
  return (
    <div className="w-full h-[400px]" style={style}>
      <ChartContainer config={chartConfig} className="h-full w-full">
        <ComposedChart 
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

          {/* Hard Cap */}
          <Line 
            type="monotone" 
            dataKey="proj_cap" 
            stroke={chartConfig.hardCap.color}
            strokeDasharray="5 5" 
            dot={false} 
            strokeWidth={2}
            name="Hard Cap"
            isAnimationActive={false}
          />

          {/* Total Grid Load */}
          <Line 
            type="monotone" 
            dataKey="grid_proj" 
            stroke={chartConfig.gridProj.color}
            dot={false} 
            strokeWidth={3}
            name="Total Grid Load"
            isAnimationActive={false}
          />

           {/* Total Load */}
           <Line 
            type="monotone" 
            dataKey="load_kw" 
            stroke={chartConfig.load.color} 
            dot={false} 
            strokeWidth={1.5}
            opacity={0.7}
            name="Total Load"
            isAnimationActive={false}
          />

          {/* Flow Areas */}
          <Area
            type="monotone"
            dataKey="grid_to_load"
            fill={chartConfig.gridToLoad.color}
            stroke={chartConfig.gridToLoad.color}
            fillOpacity={0.6}
            name="Grid → Load"
            isAnimationActive={false}
          />
           <Area
            type="monotone"
            dataKey="grid_to_battery"
            fill={chartConfig.gridToBattery.color}
            stroke={chartConfig.gridToBattery.color}
            fillOpacity={0.6}
            name="Grid → Battery"
            isAnimationActive={false}
          />
           <Area
            type="monotone"
            dataKey="battery_to_load"
            fill={chartConfig.batteryToLoad.color}
            stroke={chartConfig.batteryToLoad.color}
            fillOpacity={0.6}
            name="Battery → Load"
            isAnimationActive={false}
          />

        </ComposedChart>
      </ChartContainer>
    </div>
  )
}
