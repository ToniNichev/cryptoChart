var tjn = tjn || {}

tjn.ChatDataConnector = function(config) {

  var config = {'chartFeedURL': globalConfig.ajaxUrl}  
  var dateHelper = new tjn.DateHelper();
  var _formatedChartData = [];


  function loadChartData(symbol, startPeriod, endPeriod, apiGranularity, onComplete) {
    var start_period = dateHelper.dateToDateStr(startPeriod)
    var end_period = dateHelper.dateToDateStr(endPeriod)

    //var url = config.chartFeedURL + symbol + '/' + apiGranularity + '/' + start_period +  '/' + end_period + '/adjusted/GMT.json';
    var url = config.chartFeedURL + '?symbol=' + symbol;  // GDAX prod data
    //var url = 'http://toni-develops.com/external-files/crypto-chart/mock-data/data2.txt' //mock data

    $.ajax({
      url: url,
    }).done(function(data) {
      data = JSON.parse(data); 
      var chartData = _formatChartData(data)
      if(onComplete!=null)
        onComplete(chartData)
    });
  }

  function _formatChartData(rawChartData) {

    let chartData = rawChartData.barData.priceBars;
    let lastFormatedPoint = _formatedChartData.length;

    for(var dd=lastFormatedPoint;dd < chartData.length;dd ++) {
      var chartDataFormated = {
        "date"  : new Date(chartData[dd].tradeTime),
        "close" : parseFloat(chartData[dd].price)
      }
      if(typeof chartData[dd].trade != 'undefined') {
        chartDataFormated.trade = chartData[dd].trade;

        // send data to be added into the transactions list
        let id = idForSymbol(symbol);
        transactionsList[id].addTransaction(chartDataFormated);   
        transactionsList[id].updateBoughtTransactionsWhichAreSold(rawChartData.system.wallet.transactionsList);
      }
      _formatedChartData.push(chartDataFormated);
    }

    // format transactions data
    let transactions = rawChartData.trades;
    headerDashboardDisplay.updateSystem(rawChartData.system);

    return {chartData: _formatedChartData, transactions: transactions}
  }



  return {
    'loadChartData': loadChartData
  }
}
