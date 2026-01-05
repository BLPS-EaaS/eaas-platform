import { CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceArea } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { format } from "date-fns"

interface CostChartProps {
  data: any[]
  refAreaLeft?: string | null
  refAreaRight?: string | null
  onMouseDown?: (e: any) => void
  onMouseMove?: (e: any) => void
  onMouseUp?: (e: any) => void
  style?: React.CSSProperties
}

const chartConfig = {
  costBase: {
    label: "Cost (No Battery)",
    color: "var(--destructive)", // Red
  },
  costProj: {
    label: "Cost (With Battery)",
    color: "var(--chart-2)", // Green
  },
} satisfies ChartConfig

export function CostChart({ 
  data,
  refAreaLeft,
  refAreaRight,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  style
 }: CostChartProps) {
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
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => format(new Date(value), "PP pp")} />} />
          <Legend />

          {refAreaLeft && refAreaRight && (
            <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="hsl(var(--foreground))" fillOpacity={0.05} />
          )}
          
          <Line 
            type="monotone" 
            dataKey="cost_base" 
            stroke={chartConfig.costBase.color}
            dot={false} 
            strokeWidth={2}
            name="Cost (No Battery)"
            isAnimationActive={false}
          />
          <Line 
            type="monotone" 
            dataKey="cost_proj" 
            stroke={chartConfig.costProj.color}
            dot={false} 
            strokeWidth={2}
            name="Cost (With Battery)"
            isAnimationActive={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  )
}
