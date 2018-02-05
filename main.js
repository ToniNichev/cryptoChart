function TransactionList(container) {

	let _container = container;
	var lastBuyPrice = 0.00;
	var lastTransactionEntered = 0;

	function addTransaction(chartDataPoint) {

		/*
		const findTransactionById(id) {
			for(let c in )
		}
		*/

		const transaction = chartDataPoint.trade;
		if(transaction.length < lastTransactionEntered)
			return;
		lastTransactionEntered = transaction.length;
		const action = transaction.action;
		const shares = transaction.shares.toFixed(4);
		const pricePerShare = parseFloat(transaction.pricePerShare).toFixed(4);
		const totalSpent = parseFloat(transaction.totalSpent).toFixed(4);
		const wallet = parseFloat(transaction.moneyLeft).toFixed(4);
		const timestamp = (new Date(chartDataPoint.date)).getHours() + ':' + (new Date(chartDataPoint.date)).getMinutes() + ':' + (new Date(chartDataPoint.date)).getSeconds();
		const id = transaction.id;

		var trClass = '';

		/*
		if(action == 'sell') {
			if(pricePerShare < lastBuyPrice) 
				trClass += ' down';
			else if(pricePerShare > lastBuyPrice) 
				trClass += ' up';
		}
		*/


		$('.' + container).append(`<tr class='${action} ${trClass}' id='transaction_${action}_id_${id}'> 
										<td>${timestamp}</td>
										<td>${transaction.action}</td>
										<td>${shares}</td>
										<td>$ ${pricePerShare}</td>
										<td>$ ${totalSpent}</td>
										<td>$ ${wallet}</td>
										<td>${id}</td>
								  </tr>`)

		if(action == 'buy')
			lastBuyPrice = pricePerShare;		
	}

	function updateBoughtTransactionsWhichAreSold(transactionsList) {
		for(let c in transactionsList) {
			const transaction = transactionsList[c];
			if(transaction.action == 'buy' && transaction.sold == 'yes') {
				$('#transaction_buy_id_' + transaction.id).addClass('bought-and-sold');
			}
		}
	}

	return {
		addTransaction: addTransaction,
		updateBoughtTransactionsWhichAreSold: updateBoughtTransactionsWhichAreSold
	}
}


headerDashboardDisplay = {
	startTime: 0,

	init: function() {		

		setInterval( () => {
			let runingTime = Math.round( (new Date().getTime() - new Date(this.startTime).getTime()) / 1000);
			$('body > div.header > div.algorithm > span:nth-child(3)').html( ' ' + runingTime + ' sec.');
		}, 1000);

		setButtonAction('.header > .actions > button.disable-buying', 'algorithm.buy.allowed', true);
		setButtonAction('.header > .actions > button.disable-selling', 'algorithm.sell.allowed', true);

		setButtonAction('.header > .actions > button.buy-now', 'buy-now', false);
		setButtonAction('.header > .actions > button.sell-now', 'sell-now', false);


		function setButtonAction(selector, command, switchButton) {
			$(selector).click(function(){
				let _url = globalConfig.ajaxUrl + '?product_id=' + symbols[0]  + '&command=' + command;
				if(switchButton) {
					let mode = false;
					if($(selector).hasClass('selected')) {
						mode = true;
						$(selector).removeClass('selected');
					}
					else {
						$(selector).addClass('selected')
					}
					_url = _url + '=' + mode;
				}

			    $.ajax({			    	
			      	url: _url
			    }).done(function(data) {
			    });
			});
		}
	},

	updateSystem: function(system) {
		this.startTime = system.startTime;
		const sharePrice = system.wallet.sharePrice;
		const shares = system.wallet.shares;
		const potentialGainLoss = sharePrice * shares;
		// Algorithm
		const trend = system.wallet.finalTrend=='UP' ? '<span class="up">&#x25B2</span>' : '<span class="down">&#x25BC;</span>';
		$('body > div.header > div.algorithm > span:nth-child(5)').html(' ' + trend + ' ');		
		// WALLET
		if(typeof system.wallet != 'undefined') {
			$('.header > .wallet > .init_amount').html(' ' + globalConfig.wallet.init_amount.toFixed(4) + ' ');
			$('.header > .wallet > .funds').html(' ' + system.wallet.funds.toFixed(4) + ' ');
			$('.header > .wallet > .shares').html(' ' + shares.toFixed(4) + ' ');
			if(typeof sharePrice != 'undefined') {
				$('.header > .wallet > .lastPrice').html(' ' + sharePrice.toFixed(4) + ' ');
				$('.header > .wallet > .gainLoss').html(' ' + potentialGainLoss.toFixed(4) + ' ');
			}
		}
	}
}



// HELPER METHODS

function idForSymbol(symbol) {

	for(var c in symbols) {
		if(symbols[c] == symbol)
			return c;
	}
}


