const axios = require('axios');
const { verifyToken } = require('../auth');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify authentication
  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { tickers } = req.query;
  
  if (!tickers) {
    return res.status(400).json({ error: 'Tickers parameter required' });
  }

  const tickerList = tickers.split(',');
  const prices = {};

  // Yahoo Finance v8 API endpoints
  const fetchQuoteData = async (ticker) => {
    try {
      // Try multiple Yahoo Finance API endpoints for comprehensive data
      const urls = [
        // Main quote endpoint with all modules
        `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=price,summaryDetail,defaultKeyStatistics,financialData,earningsHistory,earningsTrend,industryTrend,indexTrend,sectorTrend`,
        // Alternative query endpoint
        `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`,
        // Additional summary endpoint
        `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${ticker}`
      ];

      const responses = await Promise.allSettled(
        urls.map(url => 
          axios.get(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 5000
          })
        )
      );

      // Combine data from all successful responses
      let combinedData = {
        ticker,
        price: null,
        current: null,
        change: null,
        changePercent: null,
        dayHigh: null,
        dayLow: null,
        volume: null,
        marketCap: null,
        pe: null,
        eps: null,
        dividendYield: null,
        dividendRate: null,
        beta: null,
        fiftyTwoWeekHigh: null,
        fiftyTwoWeekLow: null,
        fiftyDayAverage: null,
        twoHundredDayAverage: null,
        forwardPE: null,
        priceToBook: null,
        priceToSales: null,
        enterpriseValue: null,
        profitMargins: null,
        grossMargins: null,
        ebitdaMargins: null,
        revenueGrowth: null,
        earningsGrowth: null,
        currentRatio: null,
        debtToEquity: null,
        returnOnAssets: null,
        returnOnEquity: null,
        freeCashflow: null,
        operatingCashflow: null,
        earningsDate: null,
        exDividendDate: null,
        targetMeanPrice: null,
        numberOfAnalystOpinions: null,
        recommendationMean: null,
        currency: 'USD',
        exchange: null,
        quoteType: null,
        sector: null,
        industry: null,
        website: null,
        description: null,
        employees: null,
        country: null,
        name: null
      };

      // Parse quoteSummary response (first URL)
      if (responses[0].status === 'fulfilled' && responses[0].value?.data?.quoteSummary?.result?.[0]) {
        const modules = responses[0].value.data.quoteSummary.result[0];
        
        // Price module
        if (modules.price) {
          const price = modules.price;
          combinedData.price = price.regularMarketPrice?.raw || null;
          combinedData.current = price.regularMarketPrice?.raw || null;
          combinedData.change = price.regularMarketChange?.raw || null;
          combinedData.changePercent = price.regularMarketChangePercent?.raw || null;
          combinedData.dayHigh = price.regularMarketDayHigh?.raw || null;
          combinedData.dayLow = price.regularMarketDayLow?.raw || null;
          combinedData.volume = price.regularMarketVolume?.raw || null;
          combinedData.marketCap = price.marketCap?.raw || null;
          combinedData.currency = price.currency || 'USD';
          combinedData.exchange = price.exchangeName || null;
          combinedData.quoteType = price.quoteType || null;
          combinedData.name = price.longName || price.shortName || null;
        }

        // Summary Detail module
        if (modules.summaryDetail) {
          const detail = modules.summaryDetail;
          combinedData.pe = detail.trailingPE?.raw || null;
          combinedData.forwardPE = detail.forwardPE?.raw || null;
          combinedData.dividendYield = detail.dividendYield?.raw || null;
          combinedData.dividendRate = detail.dividendRate?.raw || null;
          combinedData.beta = detail.beta?.raw || null;
          combinedData.fiftyTwoWeekHigh = detail.fiftyTwoWeekHigh?.raw || null;
          combinedData.fiftyTwoWeekLow = detail.fiftyTwoWeekLow?.raw || null;
          combinedData.fiftyDayAverage = detail.fiftyDayAverage?.raw || null;
          combinedData.twoHundredDayAverage = detail.twoHundredDayAverage?.raw || null;
          combinedData.volume = combinedData.volume || detail.volume?.raw || null;
          combinedData.marketCap = combinedData.marketCap || detail.marketCap?.raw || null;
          combinedData.priceToSales = detail.priceToSalesTrailing12Months?.raw || null;
          combinedData.exDividendDate = detail.exDividendDate?.raw ? new Date(detail.exDividendDate.raw * 1000).toISOString() : null;
        }

        // Default Key Statistics module
        if (modules.defaultKeyStatistics) {
          const stats = modules.defaultKeyStatistics;
          combinedData.enterpriseValue = stats.enterpriseValue?.raw || null;
          combinedData.priceToBook = stats.priceToBook?.raw || null;
          combinedData.beta = combinedData.beta || stats.beta?.raw || null;
          combinedData.eps = stats.trailingEps?.raw || null;
          combinedData.pegRatio = stats.pegRatio?.raw || null;
          combinedData.forwardEps = stats.forwardEps?.raw || null;
        }

        // Financial Data module
        if (modules.financialData) {
          const financial = modules.financialData;
          combinedData.currentRatio = financial.currentRatio?.raw || null;
          combinedData.debtToEquity = financial.debtToEquity?.raw || null;
          combinedData.returnOnAssets = financial.returnOnAssets?.raw || null;
          combinedData.returnOnEquity = financial.returnOnEquity?.raw || null;
          combinedData.profitMargins = financial.profitMargins?.raw || null;
          combinedData.grossMargins = financial.grossMargins?.raw || null;
          combinedData.ebitdaMargins = financial.ebitdaMargins?.raw || null;
          combinedData.operatingMargins = financial.operatingMargins?.raw || null;
          combinedData.revenueGrowth = financial.revenueGrowth?.raw || null;
          combinedData.earningsGrowth = financial.earningsGrowth?.raw || null;
          combinedData.freeCashflow = financial.freeCashflow?.raw || null;
          combinedData.operatingCashflow = financial.operatingCashflow?.raw || null;
          combinedData.targetMeanPrice = financial.targetMeanPrice?.raw || null;
          combinedData.numberOfAnalystOpinions = financial.numberOfAnalystOpinions?.raw || null;
          combinedData.recommendationMean = financial.recommendationMean?.raw || null;
        }
      }

      // Parse chart response (second URL) for latest price if needed
      if (responses[1].status === 'fulfilled' && responses[1].value?.data?.chart?.result?.[0]) {
        const chart = responses[1].value.data.chart.result[0];
        const meta = chart.meta;
        const quote = chart.indicators?.quote?.[0];
        
        if (meta && !combinedData.price) {
          combinedData.price = meta.regularMarketPrice || null;
          combinedData.current = meta.regularMarketPrice || null;
          combinedData.change = meta.regularMarketPrice - meta.previousClose || null;
          combinedData.changePercent = ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100 || null;
        }
        
        if (quote && quote.high?.length > 0) {
          const lastIndex = quote.high.length - 1;
          combinedData.dayHigh = combinedData.dayHigh || quote.high[lastIndex] || null;
          combinedData.dayLow = combinedData.dayLow || quote.low[lastIndex] || null;
          combinedData.volume = combinedData.volume || quote.volume[lastIndex] || null;
        }
      }

      // Parse quote response (third URL) for additional data
      if (responses[2].status === 'fulfilled' && responses[2].value?.data?.quoteResponse?.result?.[0]) {
        const quote = responses[2].value.data.quoteResponse.result[0];
        
        // Fill in any missing data
        combinedData.price = combinedData.price || quote.regularMarketPrice || null;
        combinedData.current = combinedData.current || quote.regularMarketPrice || null;
        combinedData.change = combinedData.change || quote.regularMarketChange || null;
        combinedData.changePercent = combinedData.changePercent || quote.regularMarketChangePercent || null;
        combinedData.dayHigh = combinedData.dayHigh || quote.regularMarketDayHigh || null;
        combinedData.dayLow = combinedData.dayLow || quote.regularMarketDayLow || null;
        combinedData.volume = combinedData.volume || quote.regularMarketVolume || null;
        combinedData.marketCap = combinedData.marketCap || quote.marketCap || null;
        combinedData.pe = combinedData.pe || quote.trailingPE || null;
        combinedData.eps = combinedData.eps || quote.epsTrailingTwelveMonths || null;
        combinedData.fiftyTwoWeekHigh = combinedData.fiftyTwoWeekHigh || quote.fiftyTwoWeekHigh || null;
        combinedData.fiftyTwoWeekLow = combinedData.fiftyTwoWeekLow || quote.fiftyTwoWeekLow || null;
        combinedData.fiftyDayAverage = combinedData.fiftyDayAverage || quote.fiftyDayAverage || null;
        combinedData.twoHundredDayAverage = combinedData.twoHundredDayAverage || quote.twoHundredDayAverage || null;
        combinedData.name = combinedData.name || quote.longName || quote.shortName || null;
        combinedData.exchange = combinedData.exchange || quote.exchange || null;
        combinedData.quoteType = combinedData.quoteType || quote.quoteType || null;
        combinedData.currency = combinedData.currency || quote.currency || 'USD';
      }

      // Calculate RSI if we have enough data (would need historical prices)
      // For now, set to null as we need 14+ days of price data
      combinedData.rsi = null;

      // Ensure we at least have a current price
      if (!combinedData.price && !combinedData.current) {
        throw new Error(`No price data available for ${ticker}`);
      }

      return combinedData;

    } catch (error) {
      console.error(`Error fetching data for ${ticker}:`, error.message);
      // Return minimal data with error flag
      return {
        ticker,
        error: true,
        errorMessage: error.message,
        price: null,
        current: null,
        change: null,
        changePercent: null
      };
    }
  };

  try {
    // Fetch all ticker data in parallel
    const promises = tickerList.map(ticker => fetchQuoteData(ticker));
    const results = await Promise.all(promises);

    // Convert array to object keyed by ticker
    for (const data of results) {
      prices[data.ticker] = data;
    }

    return res.status(200).json(prices);
  } catch (error) {
    console.error('Error fetching prices:', error);
    return res.status(500).json({ error: 'Failed to fetch prices' });
  }
};
