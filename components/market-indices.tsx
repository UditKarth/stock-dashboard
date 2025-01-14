"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react'
import { FINNHUB_API_KEY } from "@/lib/config"

interface MarketIndex {
  name: string
  value: number
  change: number
  changePercent: number
  high: number
  low: number
  prevClose: number
}

export function MarketIndices() {
  const [indices, setIndices] = useState<MarketIndex[]>([
    { name: "NASDAQ", value: 0, change: 0, changePercent: 0, high: 0, low: 0, prevClose: 0 },
    { name: "S&P 500", value: 0, change: 0, changePercent: 0, high: 0, low: 0, prevClose: 0 },
    { name: "Dow Jones", value: 0, change: 0, changePercent: 0, high: 0, low: 0, prevClose: 0 }
  ])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchIndices = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const symbolMap = [
          { symbol: "QQQ", name: "QQQ" },
          { symbol: "SPY", name: "SPY" },
          { symbol: "DIA", name: "DIA" }
        ]

        const results = await Promise.all(
          symbolMap.map(async (index) => {
            const response = await fetch(
              `https://finnhub.io/api/v1/quote?symbol=${index.symbol}&token=${FINNHUB_API_KEY}`
            )
            
            if (!response.ok) {
              console.error(`API Error for ${index.name}:`, {
                status: response.status,
                statusText: response.statusText,
                url: response.url.replace(FINNHUB_API_KEY, 'HIDDEN')
              })
              throw new Error(`Failed to fetch ${index.name} data`)
            }
            
            const data = await response.json()
            console.log(`API response for ${index.name}:`, {
              symbol: index.symbol,
              data: data,
              hasData: data.c !== 0 && data.c !== null
            })
            
            return {
              name: index.name,
              value: data.c ?? 0,
              change: data.d ?? 0,
              changePercent: data.dp ?? 0,
              high: data.h ?? 0,
              low: data.l ?? 0,
              prevClose: data.pc ?? 0
            }
          })
        )
        console.log('Processed results:', results)
        setIndices(results)
      } catch (error) {
        console.error('Error fetching market indices:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch market data')
      } finally {
        setLoading(false)
      }
    }

    fetchIndices()
    // Update every minute
    const interval = setInterval(fetchIndices, 60000)
    return () => clearInterval(interval)
  }, [])

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <p>Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {indices.map((index) => (
        <Card key={index.name}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{index.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                <div className="text-2xl font-bold">
                  {typeof index.value === 'number' 
                    ? index.value.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })
                    : 'N/A'
                  }
                </div>
                <div
                  className={`flex items-center space-x-2 ${
                    (index.change || 0) >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {(index.change || 0) >= 0 ? (
                    <ArrowUpIcon className="h-4 w-4" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4" />
                  )}
                  <span>
                    {typeof index.change === 'number' ? (
                      <>
                        {index.change >= 0 ? "+" : ""}
                        {index.change.toFixed(2)} ({index.changePercent?.toFixed(2) ?? 0}%)
                      </>
                    ) : 'N/A'}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>High: {typeof index.high === 'number' ? index.high.toLocaleString() : 'N/A'}</div>
                    <div>Low: {typeof index.low === 'number' ? index.low.toLocaleString() : 'N/A'}</div>
                    <div className="col-span-2">
                      Prev Close: {typeof index.prevClose === 'number' ? index.prevClose.toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

