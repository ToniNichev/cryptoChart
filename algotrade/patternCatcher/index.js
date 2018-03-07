//const tradingModule = require('../tradingModule');
const findPatternMatch = require('./findPatternMatch');
const algoConfig = require('./config');

var tmp = 0;
let allData;

const patternCatcher = {
  init: (mainConfig, _allData) => {
    allData = _allData;
    findPatternMatch.init(mainConfig, _allData);
  },

  analyze: (product_id) => {
    /*
    if(tmp == 20) {
      console.log("Analyzing ...");
      tradingModule.buy('ETH-USD', false);
    }
    tmp ++;
    */

    var _data = allData[product_id];

		_data[_data.length - 1].trend = 0;
		if(_data.length > algoConfig.minDataPoints) {

			let last = _data.length - 1;
			var mover = {
				trend: 0,
				tempTrend: 0
			}

			let threshood = algoConfig.minThreshoodToRegisterTrend;
			mover.trend = 0;

			// draw the trend
			for(var c=_data.length - algoConfig.minDataPoints;c < _data.length; c++) {
				if(_data[c-1].price > _data[c].price + threshood && mover.tempTrend > - 2) {
					mover.tempTrend --;
				}
				else if(_data[c-1].price < _data[c].price - threshood && mover.tempTrend < 2) {
					mover.tempTrend ++;
				}
			}

			if(mover.tempTrend < 0) {
				mover.trend = -1;
			}
			else if(mover.tempTrend > 0) {
				mover.trend = 1;
			}			
      _data[c-1].trends = _data[c-1].trends || {};
			_data[c-1].trends.patternCatcher = mover.trend;
			console.log(_data[c-1].trends.patternCatcher);
      findPatternMatch.find(product_id);

			let tradeTime = _data[_data.length - 1].tradeTime;
			let pos = _data.length - 1;
    }
  },
}


module.exports = patternCatcher;
