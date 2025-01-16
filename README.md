# Stock Dashboard

A real-time stock tracking dashboard built with Next.js that allows users to monitor stocks, analyze market trends, and receive trading recommendations.

## Features

- Real-time stock price tracking
- Technical analysis and trading recommendations
- Market indices monitoring (S&P 500, NASDAQ, Dow Jones)
- Historical price charts
- Portfolio tracking with profit/loss calculations
- Stock search functionality

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Recharts for data visualization
- Finnhub API for stock data
- shadcn/ui components

## Installation
0. Get a free Finnhub API key from [Finnhub](https://finnhub.io/)
1. Clone the repository
2. Run `npm install`
2.5 Create a `.env.local` file in the root of the project and add the following:
```
NEXT_PUBLIC_FINNHUB_API_KEY=<your-api-key>
```
3. Run `npm run dev`

## Usage

1. Enter a stock symbol in the search bar
2. Select a stock from the list of results
3. View the stock's current price, historical data, and trading recommendations
