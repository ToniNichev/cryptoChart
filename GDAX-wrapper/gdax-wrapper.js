const config = require('../config');
const GDAX = require('../gdax-library');
//const GDAX = require('gdax');


const authenticatedClient = new GDAX.AuthenticatedClient( 	config.account.apiKey, 
                                                      		config.account.base64secret, 
                                                      		config.account.passPhrase, 
                                                      		config.account.apiURI);

// Establish websocket connection
const websocket = new GDAX.WebsocketClient(  
  config.symbols,
  config.account.wss,
  {
    key: config.account.apiKey,
    secret: config.account.base64secret,
    passphrase: config.account.passPhrase,
  },
  { heartbeat: true }
);

websocket.on('error', err => {
  console.log("Error !");
  console.log(err);
});

websocket.on('close', () => { 
  console.log("Socket closed !");
  console.log(err);
});


const gdaxWrapper = {

	attachOnMessageCallback: function(callbackFunction) {
		websocket.on('message', data => { 
		  if(!config.mockData.enable) {    
		    // ignore GDAX messages if mock data is enabled
		    //console.log("======= MESSAGE =======");
		    //console.log(data);
		    callbackFunction(data);  
		  }
		});
	},

	authenticatedClient: authenticatedClient,


	getProducts: function() {
		authenticatedClient.getProducts((error, response, data) => {
		    if (error)
		        return console.dir(error);
		    //@TODO: set base_min_size to make sure that placed orders satisfy upper and lower bounds
		    return console.dir(data[0]);
		  }
		);		
	},

	/**
	 * TRANSACTIONS
	 */

	placeBuyOrder: function(buyParams, callback) {
		var buyParams = {
			product_id: 'BTC-USD',
			type: 'market',
			size: '0.02'
		}

	    this.buyOrderId = authenticatedClient.buy(buyParams, (error, response, data) => {
		    if (error) {
		    	console.log("ERROR!");
		        console.dir(error);
		    }
		    callback(data);
		  });
	},

	placeSellOrder: function(price, size, product_id, callback) {
	    const sellParams = {
	        price: price,
	        size: size,
	        product_id: product_id,
	    };
	    const sellOrderId = authenticatedClient.sell(sellParams,  (error, response, data) => {
		    if (error) {
		    	console.log("ERROR!");
		        console.dir(error);
		    }
		    console.log("===== place Sell ORDER ========")
		    console.dir(data);
		  });
	},

	getOrders: function(callback) {
		const orders = authenticatedClient.getOrders(callback);
		console.log(orders);
	},

	getFills: function(callback) {
		const orders = authenticatedClient.getFills((error, response, data) => {
		    if (error) {
		    	console.log("ERROR!");
		        console.dir(error);
		    }			
			callback(data);
		} );
	},

	/**
	 * ORDERS
	 */

	getOrders: function() {
		let data = authenticatedClient.getOrders((error, response, data) => {
			console.log('----- test -----')
			console.log(data);
		});
		console.log(data);
	},

	/**
	 *  FUNDING
	 */
	
	getFundings: function() {
		let data = authenticatedClient.getFundings((error, response, data) => {
			console.log('----- test -----')
			console.log(data);
		});
		console.log(data);
	},	

	/**
	 * ORDER BOOK
	 */
	
	getProductOrderBook: function() {
		authenticatedClient.getProductOrderBook(
		  'BTC-USD',
		  { level: 3 },
		  (error, response, book) => {
		    console.log(book);
		  }
		);
	}

}

module.exports = gdaxWrapper