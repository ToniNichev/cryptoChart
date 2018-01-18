const config = require('../config');

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

var algotrade = {

	init: function(_symbols, _allData) {
		symbols = _symbols;
		allData = _allData;
		for(var c in symbols) {
		  var symbol = symbols[c];
		  allData[symbol] = [];
		}		
	},

	analyze: function(product_id) {

		function buy(moneyToBy) {
			const last = _data.length - 1;
			if(last === lastDataPoint || config.algorithm.buy.allowed == false) {
				return;
			}
			lastDataPoint = last;
			const sharePrice = _data[last].price;
			const shares = (moneyToBy / sharePrice);
			const time = _data[last].tradeTime;

			wallet.funds -= moneyToBy;
			wallet.shares += shares;	
			wallet.lastTradePrice = sharePrice;					
			allData[product_id][last].trade = {	action: 'buy', 
												shares: shares, 
												pricePerShare: sharePrice, 
												totalSpent: moneyToBy, 
												moneyLeft: wallet.funds,
												sold: 'no',
												time: time,
												id: last
											 };
			wallet.transactionsList.push(allData[product_id][last].trade);
		}

		function sell() {			
			if(threadBussy == true || config.algorithm.sell.allowed == false) // forse syncronuous execution to prevent selling multiple buy transaction with one sell
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

			wallet.funds += curentMoneyAmount;
			let shares = wallet.shares;
			wallet.shares -= sharesAmount;

			allData[product_id][last].trade = {	action: 'sell', 
												shares: sharesAmount, 
												pricePerShare: sharePrice, 
												totalSpent: gainedLost, 
												moneyLeft: wallet.funds,
												time: time,
												buyId: transaction.id
											 };		

			wallet.transactionsList.push(allData[product_id][last].trade);	
			threadBussy = false;
		}

		function findBuyTransactionToSell() {
			for(let c in wallet.transactionsList) {
				let transaction = wallet.transactionsList[c];
				let last = _data.length - 1;
				let priceDiff = _data[last].price - transaction.pricePerShare;
				if(transaction.action == 'buy' && transaction.sold == 'no' && priceDiff > config.algorithm.sell.minPriceDiff) {
					return transaction;
				}
			}
			return null;
		}

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
						match ++;
				}
				if(match == pattern_len)
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

		var _data = allData[product_id];


		if(_data.length > config.algorithm.minDataPoints) {

			let last = _data.length - 1;
			
			var mover = {
				trend: 0
			}

			mover.trend = 0;
			for(var c=_data.length - config.algorithm.minDataPoints;c < _data.length-1; c++) {	
				if(_data[c-1].price > _data[c].price  ) {
					mover.trend --;
				}
				else if(_data[c-1].price == _data[c].price) {
					if(mover.trend != 0)
						mover.trend += !mover.trend;
				}
				else if(_data[c-1].price < _data[c].price) {
					mover.trend ++;
				}
			}


			let tradeTime = _data[_data.length - 1].tradeTime;
			let pos = _data.length - 1;
			if(mover.trend > 0) {
				console.log("up");	
				analyses.trend.push('up');
			}
			else if(mover.trend < 0) {
				console.log("down");
				analyses.trend.push('down');
			}

			// check if it we found patern for trade
			
			var trend = analyses.trend;
			let lastPrice = parseFloat(_data[last].price);

			for(var c = trend.length - 8; c < trend.length; c++) {			
				const suggestedAtion = getTrend();
				if(wallet.funds > 0 && suggestedAtion == 'buy')
				{ 
					// down to up trend
					analyses.finalTrend = 'UP';
					// buy action
					var money = 0.0;
					if(wallet.funds < config.algorithm.desiredMoneyToSpendPerTransaction || config.algorithm.desiredMoneyToSpendPerTransaction === 0) {
						// if the desiredMoneyToSpendPerTransaction are less than the funds in the wallet, use all funds,
						// or
						// if desiredMoneyToSpendPerTransaction is set up to 0, use all funds
						money = wallet.funds;
					}
					else {
						money = config.algorithm.desiredMoneyToSpendPerTransaction;
					}

					if(money > config.algorithm.minMoneyToSpendPerTransaction) {
						buy(money);
					}
				} else if(wallet.shares > 0 && suggestedAtion == 'sell') 
				{
					// up to down trend
					analyses.finalTrend = 'DOWN';
					// sell action
					sell();
				}			
			}
		}
		wallet.finalTrend = analyses.finalTrend;
		return wallet;
	},


	command(command) {
		eval('config.' + command);
	}
}

module.exports = algotrade