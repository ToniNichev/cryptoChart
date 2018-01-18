let config = {

  symbols: ['ETH-USD'],
  ajaxUrl: 'http://toni-develops.com:1140',

  account: {
    passPhrase: "",
    apiKey: "",
    base64secret: "",
    apiURI: "https://api.gdax.com",
    wss: 'wss://ws-feed.gdax.com'
  },

  mockData: {
    enable:  false,
    Url: './mock-data/jan-17-2018.txt',
    speed: 50,                                // miliseconds. 1000 = 1 sec.
  },

  algorithm: {  
    minDataPoints: 6,                         // minimum  data points before starting to check the data 
    desiredMoneyToSpendPerTransaction: 200,   // what amount should be bought per trade in USD. 0 means use all available wallet money
    minMoneyToSpendPerTransaction: 10.0,      // minimum amount of money per buying. Adjust it to be higher than the transaction fee

    buy: {
      allowed: true
    },

    sell: {
      allowed: true,
      minPriceDiff: 0.0003        // min difference between the price when bought and when the attempt to sell happens in USD
    },

    trentPatterns: [
      {pattern: ["down","down","down","down","down","down","down", "up","up","up", "up","up","up","up"], match: 100, action: 'buy'},
      {pattern: ["up","up","up","up","up","up","up", "up", "down","down","down","down","down","down"], match: 100, action: 'sell'},
    ]
  }
}

module.exports = config