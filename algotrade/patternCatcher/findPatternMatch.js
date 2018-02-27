const tradingModule = require('../tradingModule');
const algoConfig = require('./config');

var tmp = 0;
let allData;

const findPatternMatch = {
  init: (mainConfig, _allData) => {
    allData = _allData;
  },

  find: (product_id) => {
		let evalPattern = (pattern, matchRate, action) => {
			const minDataPoints = pattern.length;
			const _data = allData[product_id];
			if(_data.length < minDataPoints + 1)
				return;

			let co = 0;
			var match = 0;
			for(var c = _data.length - minDataPoints; c < _data.length; c ++) {
				if(typeof _data[c].trends != 'undefined' && typeof _data[c].trends.patternCatcher != "undefined") {
					let trend = _data[c].trends.patternCatcher;
					if(pattern[co] == trend)
						match ++;
					co ++;
				}
			}
			const matchTimes = (matchRate * pattern.length) / 100;
			if(match >= matchTimes) {
				// pattern found. Execute buy/sell
				tradingModule[action](product_id, false);
			}
		}

		// runs through all patterns and looks for a match
		Object.keys(algoConfig.patterns).map(action => {			
			algoConfig.patterns[action].map(patternObject => {
				const pattern = patternObject.pattern;
				const matchRate = patternObject.matchRate;
				evalPattern(pattern, matchRate, action);
			});
		});
	},
	

}

module.exports = findPatternMatch;
