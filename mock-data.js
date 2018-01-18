var pos = 0;
let data = [];
var _mockDataURL = "";

function loadMockData() {

	let fs = require('fs');
	fs.readFile(_mockDataURL, 'utf8', function (err,_data) {
	if (err) {
	  console.log("Error reading mock data file!");
	}
	let tmpData = JSON.parse(_data);
	data = tmpData.barData.priceBars;
	});  
}


let mockData = {
	getData: function(mockDataURL) {

		_mockDataURL = mockDataURL;
		if(data.length == 0) {
			loadMockData();
		}		
		else {
			let dataPoint = { type: 'done',
							  order_id: '41345e0e-9962-44a7-a7cf-289b71692d19',
							  order_type: 'limit',
							  size: '9.00000000',
							  price: data[pos].price,
							  side: 'buy',
							  client_oid: '77153670-1fe8-4e84-83aa-0b38531ca379',
							  product_id: 'ETH-USD',
							  sequence: 1996155536,
							  time: data[pos].tradeTime,
							  reason: 'filled'
							};
			pos ++;
			return dataPoint;
		}
	}
}



module.exports = mockData
