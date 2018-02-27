const config = require('../config');
const gdaxWrapper = require('../GDAX-wrapper/gdax-wrapper.js');
const wallet = require('../wallet.js');

var allData = {};
var symbols = [];
var lastDataPoint = 0;

var analyses = {
  trend: [],
  finalTrend: ''
}

var threadBussy = false;


/**
 * Helper methods
 */

function registerTransactionAndUpdateWallet(action, sharesAmount, transactionID, product_id) {

  var _data = allData[product_id];
  const last = _data.length - 1;
  let shareLastPrice = parseFloat(_data[last].price); // based on the last transaction price
  let time;
  let totalSpent = sharesAmount * shareLastPrice;

  if(action == 'buy') {   

    if(config.wallet.simulateTrade) {
      wallet.funds -= totalSpent;
      wallet.shares += sharesAmount;  
      wallet.lastTradePrice = shareLastPrice;
      time = _data[last].tradeTime;
    }
    else {
      gdaxWrapper.placeBuyOrder({
            side: 'buy',
            product_id: 'BTC-USD',
            type: 'market',
            size: '0.02'
      }, function(data){
        const transacton_id = data.id;
      
        gdaxWrapper.getFills(function(data) {
          for(let c in data) {
            const _data = data[c];
            let transactionFound = false;
            if(_data.order_id == transacton_id) {
              transactionFound = true;
            }

            if(transactionFound) {

              // found the transaction
              shareLastPrice = data.price;
              // update wallet
              totalSpent = sharesAmount * shareLastPrice;
              wallet.funds -= totalSpent;
              wallet.shares += sharesAmount;  
              wallet.lastTradePrice = shareLastPrice;
            }
          }
        });
      });
    }   

  }
  else {
    wallet.funds += totalSpent;
    let shares = wallet.shares;
    wallet.shares -= sharesAmount;
    time = new Date();    
  }

  allData[product_id][last].trade = { action: action, 
                    shares: sharesAmount, 
                    pricePerShare: shareLastPrice, 
                    totalSpent: totalSpent, 
                    moneyLeft: wallet.funds,
                    sold: 'no',
                    time: time,
                    id: transactionID
                   };
  wallet.transactionsList.push(allData[product_id][last].trade);    
}



const tradingModule = {
  init: (_allData) => {
    allData = _allData;
  },

  buy: (product_id, ignoreBuyAllowed) => {
    // if the desiredMoneyToSpendPerTransaction are less than the funds in the wallet, use all funds,
    // or
    // if desiredMoneyToSpendPerTransaction is set up to 0, use all funds 
    var moneyToBy = 0.0;
    if( wallet.funds < config.algorithm.desiredMoneyToSpendPerTransaction || 
      config.algorithm.desiredMoneyToSpendPerTransaction === 0) {
      moneyToBy = wallet.funds;
    }
    else {
      moneyToBy = config.algorithm.desiredMoneyToSpendPerTransaction;
    }

    var _data = allData[product_id];  
    const last = _data.length - 1;
    const shareLastPrice = parseFloat(_data[last].price); // based on the last transaction price
    const shares = (moneyToBy / shareLastPrice);    

    if(moneyToBy < config.algorithm.minMoneyToSpendPerTransaction || shares < config.algorithm.minSharesToTradePerTransaction) {
      return;
    }

    if(last === lastDataPoint || (ignoreBuyAllowed == false && config.algorithm.buy.allowed == false) ) {
      return;
    }

    lastDataPoint = last;
    registerTransactionAndUpdateWallet('buy', shares, lastDataPoint, product_id);
  },

  sell: (product_id, ignoreSellAllowed) => {  
    var _data = allData[product_id];    
    if(threadBussy == true || (ignoreSellAllowed == false && config.algorithm.sell.allowed == false) ) // forse syncronuous execution to prevent selling multiple buy transaction with one sell
      return;
    threadBussy = true;     
    const transaction = findBuyTransactionToSell();

    const last = _data.length - 1;            
    if(transaction == null || last === lastDataPoint) {
      threadBussy = false;        
      return;     
    }
    const sharesAmount = transaction.shares;
    transaction.sold = 'yes';

    lastDataPoint = last;     
    const sharePrice = _data[last].price;   
    const lastMoneyAmount = sharesAmount * wallet.lastTradePrice;
    const curentMoneyAmount = sharesAmount * sharePrice;      
    const gainedLost = curentMoneyAmount - lastMoneyAmount;
    const time = new Date();

    const id = transaction.id;

    registerTransactionAndUpdateWallet('sell', sharesAmount, id, product_id);

    threadBussy = false;

    function findBuyTransactionToSell() {
      for(let c in wallet.transactionsList) {
        let transaction = wallet.transactionsList[c];
        let last = _data.length - 1;
        let priceDiff = _data[last].price - transaction.pricePerShare;
        let shares = transaction.shares;

        if( transaction.action == 'buy' && transaction.sold == 'no' && 
          priceDiff > config.algorithm.sell.minPriceDiff &&
          shares > config.algorithm.minSharesToTradePerTransaction
          ) 
        {
          // matched transaction was found. Return it
          return transaction;
        }
      }
      return null;
    } 
  }

}

module.exports = tradingModule