/**
 * dependencies: DateHelper
 *
 */
 var tjn = tjn || {}
tjn.OpenCharts = function(CanvasId, _config, ChartDataConnector) {

  var apiGranularity = null
  var startPeriod = null
  var drawingCanvas = document.getElementById(CanvasId)
  var offset = {'start': 0, 'end':0, 'fstart': 0.0, 'fend': 0.0}
  var fetchedDataOffset = {'start': 0, 'end':0}
  var config = {'lineWidth': '3', 'lineColor': '#3DA5ED', 'fillColor': '#EAF5FD', 'backgroundColor': '#FFFFFF',
                'context_padding': 50,
                'grid': {'lineWidth': 0.2, 'lineColor': '#A9A9A9'},
                'priceArrow' : {'fillCollor': '#3DA5ED', 'priceColor': '#FFFFFF'},
                'interaction': {'scrollingSpeed': 42}
              }

  Object.assign(config, _config)

  var symbolData = {'symbol': ''}
  var chartData = {}
  var transactions = {}
  var context_height = 0.0
  var context_width = 0.0
  var ctx
  var min = 10000.0, max=0.0
  var dragChart = false
  var clientX
  var lstPrice=0.0
  var whellKinetic = 0.0
  var kineticZoomInterval = null
  var kineticZoomTimeoutIntervar = null;
  var kineticZoomActive = false;
  var _kineticMouseZoom = null;
  var _zoomResidualSpeedTimer = null;
  var kineticDragInterval = null
  var kineticDragVelocity = 0.0
  var lastDragDirection = 0.0
  var _destX = 0.0
  var _kineticSpeed = 0.0
  var _kineticCount = 0.0
  var _kineticMouseWhellSpeed = 0.0
  var _kineticMouseWhellcount = 0.0
  var _time1 = new Date().getTime()
  var _horizontalDragResidualSpeedTimer = null
  var chartGrid = new tjn.ChartGrid(drawingCanvas, config)
  var chartUI = new tjn.ChartUI(drawingCanvas, config)
  // ====================================================
  // DECLARE PLUG-INS HERE
  // ====================================================
  var transactionsMarker = new tjn.TransactionsMarker(drawingCanvas, config)
  var threndsDrawer = new tjn.ThrendsDrawer(drawingCanvas, config)
  // ====================================================
  var chartDataConnector = ChartDataConnector               // the chart data feed


  var disableDrag = 0


  var requestChartForTimeFrame = function(symbol, timeFrame, granularity, attachEvents, onComplete) {
    symbolData.symbol = symbol
    var dateHelper = tjn.DateHelper()
    var today = new Date()
    timeFrame = timeFrame || ''
    switch(timeFrame.toLowerCase()) {
      case '1y':
        apiGranularity = granularity || '1D'
        startPeriod = dateHelper.getPastDateFromDate(today, 365)
        break
      case '6m':
        apiGranularity = granularity || '1D'
        startPeriod = dateHelper.getPastDateFromDate(today, 365 / 2)
        break
      case '3m':
        apiGranularity = granularity || '1D'
        startPeriod = dateHelper.getPastDateFromDate(today, 30 * 3)
        break
      case '1m':
        apiGranularity = granularity || '1H'
        startPeriod = dateHelper.getPastDateFromDate(today, 30)
        break
      case '5d':
        apiGranularity = granularity || '10M'
        startPeriod = dateHelper.getPastDateFromDate(today, 5)
        break
      case '1d':
        apiGranularity = granularity || '1M'
        startPeriod = dateHelper.getPastDateFromDate(today, 0)
        break
    }
    if(granularity) {
      apiGranularity = granularity
    }
    _requestChartForPeriod(symbol, startPeriod, today, attachEvents, onComplete)
  }

  var _requestChartForPeriod = function(symbol, startPeriod, endPeriod, attachEvents, onComplete) {
    chartDataConnector.loadChartData(symbol, startPeriod, endPeriod, apiGranularity, function(ChartData) {
      chartData = ChartData.chartData;
      transactions = ChartData.transactions;
     _initDrawing(attachEvents)
     _drawChart(onComplete)
    })
  }

  var _requestChartData = function(symbol, startPeriod, endPeriod, attachEvents, onComplete) {
    chartDataConnector.loadChartData(symbol, startPeriod, endPeriod, apiGranularity, function(ChartData) {

      chartData = ChartData.concat(chartData);
      disableDrag = 0;
      offset.fstart = 0;
      //offset.fend = 0
     _initDrawing(false);
     _drawChart(onComplete);
    })
  }

  function clearDrawArea() {
    var ctx = drawingCanvas.getContext("2d")
    ctx.fillStyle = config.backgroundColor
    ctx.fillRect(0, 0, context_width + 50, context_height)
  }

  function mouseWheellTurned(e) {
    if(e.wheelDeltaY > -1) {
      kineticZoom(true)
    }
    else  {
      kineticZoom(false)
    }
    event.preventDefault()
  }

  function kineticZoom(zoomIn) {
    var p = chartData.length - (offset.start + offset.end)
    var c = p / context_width
    c = c * 5;
    var zoomSpeed = c;
      if(zoomIn) {
        offset.fstart = offset.fstart + zoomSpeed
        offset.fend = offset.fend + zoomSpeed
        _kineticMouseZoom = true;
      }
      else  {
        offset.fstart = offset.fstart - zoomSpeed
        offset.fend = offset.fend - zoomSpeed
        _kineticMouseZoom = false;
      }
      offset.start = Math.round(offset.fstart)
      offset.end = Math.round(offset.fend)
      _kineticMouseWhellSpeed ++;

      _drawChart()
      console.log(_kineticMouseWhellSpeed);
      kineticZoomTimeoutIntervar = null;

      if(kineticZoomActive)
        return;
      kineticZoomActive = true;
      kineticZoomTimeoutIntervar = setTimeout(() => {
        kineticZoomTimeoutIntervar = null;
        setKineticZoomResidualSpeed(_kineticMouseWhellSpeed * 2);
      }, 50);
  }

  function setKineticZoomResidualSpeed(speed) {
    //dragChart = false
    kineticZoom(_kineticMouseZoom, speed);
    speed = speed / 1.1;
    clearInterval(_zoomResidualSpeedTimer)
    if(speed > 0.1) {
      _zoomResidualSpeedTimer = setInterval(function(){
        setKineticZoomResidualSpeed(speed)
      },2)
    }
    else {
      clearInterval(_zoomResidualSpeedTimer)
      _kineticZoomSpeed = 0
      kineticZoomActive = false;
      _kineticMouseWhellSpeed = 0;
    }
  }

  function _horizontalDrag(x) {
    var p = chartData.length - (offset.start + offset.end)
    var c = p / context_width
    var drag = c * (clientX - x) // drag width
    offset.fstart = offset.fstart + drag
    offset.fend = offset.fend - drag

    offset.start = Math.round(offset.fstart)
    offset.end = Math.round(offset.fend)

    // calculate when to pull extra data on drag right
    var length = Math.round(context_width / 5) // chart will pull extra data when dragged 1/5 of it's width
    var c = (chartData.length - (offset.start + offset.end) ) / context_width
    //var pos = Math.round(length / cc) + offset.start
    var dataLength = Math.round(length * c)
    if(offset.start < - dataLength && disableDrag == 0) {
      disableDrag = 1
      var date1 = chartData[0].date
      var date2 = chartData[dataLength].date
      var days = Math.round((date2 - date1) / 86400000)  // return days between date1 and date2
      var startPeriod = new Date(date1 - 1000 * 60 * 60 *24 * days)
      var endPeriod = new Date(date1 - 1000 * 60 * 60 *24 * 1)
      _requestChartData(symbolData.symbol, startPeriod, endPeriod, false, function(){})
    }
    clientX = x
    _drawChart()
  }

  function setKineticDragResidualSpeed(speed, length) {
    //dragChart = false
    var d = Math.round(clientX - (speed / 2))
    _horizontalDrag(d)
    length = length - 0.06
    speed = speed / 1.01
    clearInterval(_horizontalDragResidualSpeedTimer)
    if(length > 0) {
      _horizontalDragResidualSpeedTimer = setInterval(function(){
        setKineticDragResidualSpeed(speed, length)
      },5)
    }
    else {
      _kineticSpeed = 0
    }
  }

  /**
   *  Attach mouse events
   */
  function _initDrawing(attachEvents) {
    if(attachEvents) {

      $(drawingCanvas).bind('touchstart', function(event) {
        dragChart = true
        clientX = event.originalEvent.touches[0].clientX;
      });

      $(drawingCanvas).bind('touchmove', function(event) {
        if(dragChart) {
          var x = event.originalEvent.touches[0].clientX;
          // calculate the residual speed
          _kineticCount ++
          if(_kineticCount > 1) {
            _kineticSpeed = clientX - x
          }
          _horizontalDrag(x)
        }
      });

      $(drawingCanvas).bind('touchend', function(event) {
        dragChart = false
        if(_kineticSpeed != 0)
         setKineticDragResidualSpeed(_kineticSpeed, Math.abs(_kineticSpeed) )
      });

      drawingCanvas.onmousedown = function(event) {
        dragChart = true
        clientX = event.clientX
      }

      drawingCanvas.onmouseup = function(event) {
        dragChart = false
        if(_kineticSpeed != 0)
         setKineticDragResidualSpeed(_kineticSpeed, Math.abs(_kineticSpeed) )
      }

      drawingCanvas.onmousemove = function(event) {
        if(dragChart) {
          var x = event.clientX
          // calculate the residual speed
          _kineticCount ++
          if(_kineticCount > 1) {
            _kineticSpeed = clientX - x
          }
          _horizontalDrag(x)
        }
      }
      drawingCanvas.onwheel = function(event){
        mouseWheellTurned(event)
      };

      drawingCanvas.onmousewheel = function(event){
        mouseWheellTurned(event)
      };

      drawingCanvas.onmouseout = function(event) {
        dragChart = false
        if(_kineticSpeed != 0)
          setKineticDragResidualSpeed(_kineticSpeed, Math.abs(_kineticSpeed) )
      }
    }
  }

  /**
   *  Draw the chart
   */
  function _drawChart(onDrawComplete) {
    lineWidth = config.lineWidth
    lineColor = config.lineColor
    fillColor = config.fillColor
    context_width = context_width || (drawingCanvas.width - 50)
    context_height = context_height || drawingCanvas.height
    var context_padding = config.context_padding
    var speed = config.interaction.scrollingSpeed
    var dataLength = parseInt(chartData.length) - (offset.start + offset.end)
    clearDrawArea()
    ctx = ctx || drawingCanvas.getContext("2d");

    // find min and max values
    min = 10000000.0;
    max = 0.0;

    for(var co = offset.start;co < offset.start + dataLength; co++) {
      if(typeof chartData[co] != 'undefined') {
        var close = parseFloat(chartData[co].close)
        min = close < min ? close : min
        max = close > max ? close : max
      }
    }
    min = parseFloat(min)
    max = parseFloat(max)
    var minMax =  (context_height - context_padding * 2) / (max - min);


    function getYPosition(price) {
    let  y = (context_height - context_padding)  - ((price - min) * minMax);
    return y;
    }

    // set up starting coordinates
    var prevX = 0;
    if(typeof chartData[offset.start] != 'undefined') {
      var close = chartData[offset.start].close
      //var prevY = (context_height + context_padding * 2) - ((close - min) * minMax);
      var prevY = getYPosition(close); // (context_height - context_padding * 2) - close;

    }
    var dataLength = chartData.length - (offset.start + offset.end)
    let ratio = context_width / dataLength;

    ctx.beginPath()
    //ctx.globalAlpha=0.5;
    ctx.lineWidth = config.lineWidth
    ctx.strokeStyle = config.lineColor

    // draw chart
    var firstXpos = 0;
    var lastPos = 0;
    for(var co = 0; co < context_width; co++) {
      var pos = Math.round(co / ratio) + offset.start;

      if(typeof chartData[pos] != 'undefined') {
        var price = parseFloat(chartData[pos].close)

        if(lastPos != pos) {
          ctx.lineTo(prevX, prevY);
          // set up next coordinates
          prevX = co;
          prevY = getYPosition(price);
          lastPos = pos;
        }
      }
    }

    // make sure that we get the last price
    if(chartData.length > 0)
      price = parseFloat(chartData[chartData.length - 1].close);

    ctx.lineTo(prevX, prevY);
    ctx.stroke();

    // close the fill in area
    ctx.lineTo(prevX, context_height - context_padding / 2);
    ctx.lineTo(firstXpos, context_height - context_padding / 2);

    ctx.fillStyle = config.fillColor
    ctx.fill()


    // draw the grid
    chartGrid.drawGrid(chartData,
                       offset,        // offset.start and offset.end
                       min,           // min data value
                       max,           // max data value
                       price          // last price
    )
    // ===========================================
    // ADD PLUG-INS HERE
    // ===========================================
    if(typeof transactionsMarker != 'undefined')
      transactionsMarker.drawTransactions(chartData, offset, min, max);

    if(typeof threndsDrawer != 'undefined')
      threndsDrawer.drawThrends(chartData, offset, min, max);

    // call on draw complete function
    if(onDrawComplete!= null)
      onDrawComplete()
  }

  function getSymbolData() {
    return symbolData
  }


  return {
    _requestChartForPeriod: _requestChartForPeriod,
    requestChartForTimeFrame: requestChartForTimeFrame,
    getSymbolData: getSymbolData
  }
}
