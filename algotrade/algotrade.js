const config = require('../config');
const gdaxWrapper = require('../GDAX-wrapper/gdax-wrapper.js');

var allData = {};
var symbols = [];
var lastDataPoint = 0;

var analyses = {
	trend: [],
	finalTrend: ''
}

var wallet = {
	funds: 500.00,
	shares: 0.00,
	transactionsList: []	// holds the list of all buy/sell transactions
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

	allData[product_id][last].trade = {	action: action, 
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

function buy(product_id, ignoreBuyAllowed) {
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

}

function sell(product_id, ignoreSellAllowed) {	
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


/**
 * ALGOTRADE V 1.0
 */

var algotrade = {
	init: function(_symbols, _allData) {
		symbols = _symbols;
		allData = _allData;
		wallet.funds = config.wallet.funds;
		for(var c in symbols) {
		  var symbol = symbols[c];
		  allData[symbol] = [];
		}		
	},

	analyze: function(product_id) {

		var _data = allData[product_id];
		_data[_data.length - 1].trend = 0;
		if(_data.length > config.algorithm.minDataPoints) {

			let last = _data.length - 1;
			
			var mover = {
				trend: 0
			}

			let threshood = config.algorithm.minThreshoodToRegisterTrend;
			mover.trend = 0;			

			// FILTER TREND
			for(var c=_data.length - config.algorithm.minDataPoints;c < _data.length; c++) {	
				if(_data[c-1].price > _data[c].price + threshood && mover.trend > - 6  ) {
					mover.trend --;
				}
				else if(_data[c-1].price < _data[c].price - threshood && mover.trend < 6) {
					mover.trend ++;				
				}

				_data[c].trend = mover.trend;	
			}


			let tradeTime = _data[_data.length - 1].tradeTime;
			let pos = _data.length - 1;
			if(mover.trend > 0) {
				analyses.trend.push('up');
			}
			else if(mover.trend < 0) {
				analyses.trend.push('down');
			}

			// check if it we found patern for trade
			
			var trend = analyses.trend;
			let lastPrice = parseFloat(_data[last].price);

			for(var c = trend.length - 5; c < trend.length; c++) {			
				const suggestedAction = getTrend();
				if(wallet.funds > 0 && suggestedAction == 'buy')
				{ 
					// down to up trend
					analyses.finalTrend = 'UP';
					// buy action
					buy(product_id, false);
				} else if(wallet.shares > 0 && suggestedAction == 'sell') 
				{
					// up to down trend
					analyses.finalTrend = 'DOWN';
					// sell action
					sell(product_id, false);
				}			
			}
		}

		wallet.finalTrend = analyses.finalTrend;


		function getTrend() {

			function checkTrend(PatternObj) {
				let trends = analyses.trend;
				var trends_len = parseInt(trends.length);
				var pattern = PatternObj.pattern;
				var pattern_len = parseInt(pattern.length);
				var match = 0;
				for(var c in pattern) {
					var cursorPos = (trends_len - pattern_len) + parseInt(c);
					if(pattern[c] == trends[cursorPos])
						match = match + 1;
				}
				if(match >= pattern_len)
					return PatternObj.action;
				return null;
			}

			for(var c in config.algorithm.trentPatterns) {
				let pattern = config.algorithm.trentPatterns[c];
				const suggestedAction = checkTrend(pattern);
				if(suggestedAction != null) {
					return suggestedAction;
				}
			}
			return null;
		}		
		return wallet;
	},

	command(command, product_id) {
		if(command.indexOf('algorithm')== -1) {
			switch(command) {
				case 'buy-now':
				console.log("Buy action!")
					buy(product_id, true);
					break;
				case 'sell-now':
					sell(product_id, true);
					console.log("Sell action!")
					break;
			}
		}
		else {
			eval('config.' + command);
		}
	}
}

module.exports = algotrade