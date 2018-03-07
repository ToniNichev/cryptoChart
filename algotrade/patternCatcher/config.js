let algoConfig = {
  minDataPoints: 15,                           // minimum  data points before starting to check the data
  desiredMoneyToSpendPerTransaction: 200,     // what amount should be bought per trade in USD. 0 means use all available wallet money
  minMoneyToSpendPerTransaction: 10.0,        // minimum amount of money per buying. Adjust it to be higher than the transaction fee
  minSharesToTradePerTransaction: 0.01,       // minimum shares to trade
  minThreshoodToRegisterTrend: 0.07,           // minimum difference between last data point and previous one in order to set the trend up or down
  patterns: {
    buy: [
      {
        name:'one',
        pattern: [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,0],        
        matchRate: 100 // %
      },                      
    ],

    sell: [
      {
        name:'one',
        pattern: [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,0],
        matchRate: 90
      },     
    ]
  },
}

module.exports = algoConfig;
