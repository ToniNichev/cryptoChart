const config = require('../config');


var allData = {};
var symbols = [];

const orderBookScanner = {

	init: (_symbols, _allData) => {
		symbols = _symbols;		
		allData = _allData;
	},

	analyze: (data) => {
		if(data.type =='heartbeat' || data.reason == 'canceled' || typeof allData == 'undefined') 
			return;

		if(data.price === undefined && (data.side != 'buy' || data.side != 'sell') )
			return;

		var priceThreshold = 5; 

		const productData = allData[data.product_id];
		var cursor = productData.length;
		const datapoint = {
		price: data.price,
		tradeTime: data.time
		}


		if (!(data.type === 'done' && data.reason === 'filled')) {
		if(cursor > 0 && data.type == 'open') {
		  let prevPrice = parseFloat(productData[cursor - 1].price);
		  let price = parseFloat(datapoint.price);
		  if(Math.abs(price - prevPrice) > priceThreshold) {

		    if(data.side == 'sell') {
		      if(price < prevPrice) {
		        console.log("SELL ! PRICE: " + price + " prev price:" + prevPrice);
		        console.log(data);

		        const shares = data.remaining_size;
		        //gdaxWrapper.getProductOrderBook();
		        //gdaxWrapper.placeBuyOrder(price, 0.11805214, 'BTC-USD', function(data){});            
		      }
		    }
		    else if(data.side == 'buy') {
		      if(price > prevPrice) {
		        console.log("BUY ! PRICE: " + price + " prev price:" + prevPrice);
		        console.log(data);
		      }
		    }
		  }
		}
		return;
		}		
	}
}

module.exports = orderBookScanner