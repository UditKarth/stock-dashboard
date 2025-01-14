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
}

export function MarketIndices() {
  const [indices, setIndices] = useState<MarketIndex[]>([
    { name: "NASDAQ", value: 0, change: 0, changePercent: 0 },
    { name: "S&P 500", value: 0, change: 0, changePercent: 0 },
    { name: "Dow Jones", value: 0, change: 0, changePercent: 0 }
  ])

  useEffect(() => {
    const fetchIndices = async () => {
      try {
        const symbolMap = [
          { symbol: "^IXIC", name: "NASDAQ" },
          { symbol: "^GSPC", name: "S&P 500" },
          { symbol: "^DJI", name: "Dow Jones" }
        ]

        const results = await Promise.all(
          symbolMap.map(async (index) => {
            const response = await fetch(
              `https://finnhub.io/api/v1/quote?symbol=${index.symbol}&token=${FINNHUB_API_KEY}`
            )
            const data = await response.json()
            return {
              name: index.name,
              value: data.c,
              change: data.d,
              changePercent: data.dp
            }
          })
        )
        setIndices(results)
      } catch (error) {
        console.error('Error fetching market indices:', error)
      }
    }

    fetchIndices()
    const interval = setInterval(fetchIndices, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {indices.map((index) => (
        <Card key={index.name}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{index.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <div className="text-2xl font-bold">{index.value.toLocaleString()}</div>
              <div
                className={`flex items-center space-x-2 ${
                  index.change >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {index.change >= 0 ? (
                  <ArrowUpIcon className="h-4 w-4" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4" />
                )}
                <span>
                  {index.change >= 0 ? "+" : ""}
                  {index.change.toFixed(2)} ({index.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

