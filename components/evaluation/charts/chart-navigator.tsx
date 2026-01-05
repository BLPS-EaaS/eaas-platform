"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Brush } from "recharts"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { format } from "date-fns"

interface ChartNavigatorProps {
  data: any[]
  onBrushChange: (range: { startIndex?: number, endIndex?: number }) => void
}

const chartConfig = {
  load: {
    label: "Navigator",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function ChartNavigator({ data, onBrushChange }: ChartNavigatorProps) {
  return (
    <div className="w-full h-[150px]">
      <div className="text-sm font-medium mb-1 pl-2">Zoom Navigator</div>
      <ChartContainer config={chartConfig} className="h-full w-full">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
           {/* Minimal chart just for navigation */}
          <XAxis 
             dataKey="timestamp" 
             tickFormatter={(value) => format(new Date(value), "MM-dd")}
             minTickGap={64}
             hide
          />
           <Line 
            type="monotone" 
            dataKey="load_kw" 
            stroke="var(--chart-1)" 
            dot={false} 
            strokeWidth={1}
            isAnimationActive={false}
          />
          <Brush 
            height={30} 
            stroke="var(--primary)"
            onChange={onBrushChange}
            alwaysShowText={true}
            tickFormatter={(index) => {
                const date = new Date(data[index]?.timestamp);
                return isNaN(date.getTime()) ? "" : format(date, "MM-dd")
            }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  )
}
