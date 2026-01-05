import { CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Area, ReferenceArea } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { format } from "date-fns"

interface BatterySOCChartProps {
  data: any[]
  refAreaLeft?: string | null
  refAreaRight?: string | null
  onMouseDown?: (e: any) => void
  onMouseMove?: (e: any) => void
  onMouseUp?: (e: any) => void
  style?: React.CSSProperties
}

const chartConfig = {
  soc: {
    label: "SOC (%)",
    color: "var(--chart-5)", // Purple-ish in Python script, mapped to chart-5
  },
} satisfies ChartConfig

export function BatterySOCChart({ 
  data,
  refAreaLeft,
  refAreaRight,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  style
 }: BatterySOCChartProps) {
  
  return (
    <div className="w-full h-[250px]" style={style}>
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
          <YAxis domain={[0, 100]} />
          <ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => format(new Date(value), "PP pp")} />} />
          <Legend />

          {refAreaLeft && refAreaRight && (
            <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="hsl(var(--foreground))" fillOpacity={0.05} />
          )}
          
          <Line
            type="monotone"
            dataKey="soc_percent"
            stroke={chartConfig.soc.color}
            strokeWidth={2}
            dot={false}
            name="SOC (%)"
            isAnimationActive={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  )
}
