
"use client"

import * as React from "react"
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
} from "recharts"

import { cn } from "@/lib/utils"

const CHART_CONFIG = {
  visitors: {
    label: "Visitors",
  },
  chrome: {
    label: "Chrome",
    color: "hsl(var(--chart-1))",
  },
  safari: {
    label: "Safari",
    color: "hsl(var(--chart-2))",
  },
  firefox: {
    label: "Firefox",
    color: "hsl(var(--chart-3))",
  },
  edge: {
    label: "Edge",
    color: "hsl(var(--chart-4))",
  },
  other: {
    label: "Other",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

type ChartConfig = {
  [k in string]: {
    label: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<string, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config: ChartConfig
    children: React.ComponentProps<
      typeof PieChart | typeof LineChart | typeof BarChart
    >["children"]
  }
>(({ config, children, className, ...props }, ref) => {
  const chartRef = React.useRef<HTMLDivElement>(null)
  const [legendHeight, setLegendHeight] = React.useState(0)

  const [activeChart, setActiveChart] =
    React.useState<keyof typeof config | null>(null)

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        ref={ref}
        data-chart
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer:focus-visible]:outline-none [&_.recharts-polar-axis-tick_text]:fill-muted-foreground [&_.recharts-pie-label-text]:fill-foreground [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line-line]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <div className="flex h-full w-full flex-col">
          <div
            className="flex-1"
            style={{
              maxHeight: legendHeight > 0 ? `calc(100% - ${legendHeight}px)` : "100%",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "Chart"

const ChartTooltip = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'>
>((props, ref) => {
  return (
    <div
      ref={ref}
      {...props}
    />
  )
})
ChartTooltip.displayName = "ChartTooltip"
ChartTooltip.displayName = "ChartTooltip"

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    React.ComponentProps<any> & {
      indicator?: "dot" | "line" | "dashed"
      hideLabel?: boolean
      hideIndicator?: boolean
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${item.dataKey as string}`
      const itemConfig = config[key]

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(label, payload)}
          </div>
        )
      }

      if (!itemConfig) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {label}
          </div>
        )
      }

      if (itemConfig.label) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {itemConfig.label}
          </div>
        )
      } else {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {label}
          </div>
        )
      }
    }, [label, payload, hideLabel, labelFormatter, labelClassName, config])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item: any, index: number) => {
            const key = `${item.dataKey as string}`
            const itemConfig = config[key]
            const indicatorColor = item.color

            return (
              <div
                key={item.dataKey}
                className={cn(
                  "flex w-full items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center"
                )}
              >
                {formatter && item?.value && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {!hideIndicator && (
                      <div
                        className={cn(
                          "shrink-0",
                          "h-2.5 w-2.5",
                          indicator === "dot" && "rounded-full",
                          indicator === "line" && "w-1",
                          indicator === "dashed" && "my-0.5 w-1 border-[1.5px] border-dashed"
                        )}
                        style={{
                          backgroundColor: indicatorColor,
                        }}
                      />
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel && "items-center"
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {item.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltipContent"

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
}

    