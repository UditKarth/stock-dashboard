"use client"

import { useEffect, useState } from "react"
import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts"
import { X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { StockData, StockCardProps } from "@/types/stock"
import { fetchStockData } from "@/services/stockApi"

export function StockCard({ symbol, shares, purchaseDate, onRemove }: StockCardProps) {
  const [data, setData] = useState<StockData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredPrice, setHoveredPrice] = useState<number | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const stockData = await fetchStockData(symbol)
        setData(stockData)
        setError(null)
      } catch (err) {
        setError("Failed to load stock data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
    const interval = setInterval(loadData, 60000)
    return () => clearInterval(interval)
  }, [symbol])

  const handleMouseMove = (props: any) => {
    if (props?.activePayload?.[0]?.payload) {
      setHoveredPrice(props.activePayload[0].payload.price)
    }
  }

  const handleMouseLeave = () => {
    setHoveredPrice(null)
  }

  if (loading) {
    return (
      <Card className="w-full min-h-[300px] flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className="w-full min-h-[300px] flex items-center justify-center">
        <div className="text-destructive">{error}</div>
      </Card>
    )
  }

  const displayPrice = hoveredPrice ?? data.price
  const currentValue = shares ? shares * displayPrice : null

  // Calculate purchase price based on historical data and purchase date
  const getPurchasePrice = () => {
    if (!purchaseDate || !data.historicalData.length) return data.price

    const purchaseTimestamp = purchaseDate.getTime()
    const closestDataPoint = data.historicalData.reduce((prev, curr) => {
      return Math.abs(curr.timestamp - purchaseTimestamp) < Math.abs(prev.timestamp - purchaseTimestamp)
        ? curr
        : prev
    })

    return closestDataPoint.price
  }

  const purchasePrice = getPurchasePrice()
  const initialValue = shares ? shares * purchasePrice : null
  const profit = currentValue && initialValue ? currentValue - initialValue : null

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {data.symbol} - {data.name}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => onRemove(symbol)}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">${displayPrice.toFixed(2)}</span>
            <span
              className={`text-sm font-medium ${
                data.change >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {data.change >= 0 ? "+" : ""}
              {data.change.toFixed(2)} ({data.changePercent.toFixed(2)}%)
            </span>
          </div>
          
          {shares && (
            <div className="text-sm space-y-1">
              <div>Shares: {shares}</div>
              {purchaseDate && (
                <div>Purchased: {purchaseDate.toLocaleDateString()}</div>
              )}
              <div>Current Value: ${currentValue?.toFixed(2)}</div>
              {profit && (
                <>
                  <div>Purchase Value: ${initialValue?.toFixed(2)}</div>
                  <div className={profit >= 0 ? "text-green-600" : "text-red-600"}>
                    Profit: ${profit.toFixed(2)} ({((profit / initialValue) * 100).toFixed(2)}%)
                  </div>
                </>
              )}
            </div>
          )}

          <div className="h-[200px] w-full">
            <ChartContainer
              config={{
                price: {
                  label: "Price",
                  color: "hsl(var(--chart-1))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={data.historicalData}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="var(--color-price)"
                    strokeWidth={2}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatValue={(value) => `$${Number(value).toFixed(2)}`}
                      />
                    }
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

