var tjn = tjn || {}

tjn.ChartGrid = function(drawingCanvas, config) {
  var drawingCanvas = drawingCanvas
  var context_width = context_width || (drawingCanvas.width - 50)
  var context_height = context_height || drawingCanvas.height
  var ctx = drawingCanvas.getContext("2d")
  var lstPrice=0
  var dateHelper = tjn.DateHelper()


  function drawGrid(chartData, offset, min, max, lastPrice) {
      ctx.beginPath();
      ctx.strokeStyle = config.grid.lineColor
      ctx.lineWidth = config.grid.lineWidth
      var context_padding = config.context_padding
      var dataLength = chartData.length - (offset.start + offset.end)
      var oldTradeTime = 0

      function getYPosition(price) {
        //let minMax =  (context_height - context_padding * 2) / (max - min);
        let  y = (context_height - context_padding)  - ((price - min) * minMax);
        return y;
      }  

      var cc = context_width / dataLength;
      var c = 3
      // draw vertical lines
      for(var co = 0; co < context_width; co++) {
        var pos = Math.round(co / cc) + offset.start

        if(typeof chartData[pos] != 'undefined') {
          var data = chartData[pos];
          var tradeTime = data.date
          var tradeHr = tradeTime.getHours()
          var tradeMin = tradeTime.getMinutes()

          if(tradeMin != oldTradeTime) {
            oldTradeTime = tradeMin
            ctx.moveTo(co, 0)
            ctx.lineTo(co, context_height - 10)
            ctx.font = "11px Arial"
            ctx.fillStyle = config.grid.lineColor
            // minutes
            ctx.fillText(tradeHr + ':' +tradeMin, co + 5, context_height - 15);
            // month
            c = 0        
          }
        }
      }
      // draw horizontal lines
      ctx.font = "11px Arial"
      ctx.fillStyle = config.grid.lineColor
      var h = context_height - (context_padding);
      let minMax =  (context_height - context_padding * 2) / (max - min);

      for(var co = 0; co < h ;co = co + config.grid.gridStep) {
        ctx.moveTo(0, co)
        ctx.lineTo(context_width, co);
        var txt = min + ( (h - co) / minMax);
        txt = txt.toFixed(2);
        ctx.fillText(txt ,context_width, co);
      }
      //ctx.stroke();

      // draw price arrow
      if(chartData.length > 1) {
        var price = parseFloat(lastPrice)
        var y = h - ((h / (max - (min))) * (txt - min))
        price = price.toFixed(2)
      }
      let arrowWidth = 50;

      y = getYPosition(price);

      ctx.moveTo(context_width + arrowWidth, y + 3)
      ctx.lineTo(context_width - 42 + arrowWidth, y + 3)
      ctx.lineTo(context_width - 50 + arrowWidth, y - 5)
      ctx.lineTo(context_width - 42 + arrowWidth, y - 11)
      ctx.lineTo(context_width + arrowWidth, y -11)
      ctx.fillStyle = config.priceArrow.fillCollor
      ctx.fill()
      ctx.fillStyle = config.priceArrow.priceColor
      ctx.fillText(price ,context_width + 5, y);
      ctx.stroke()
  }

  return {
    drawGrid: drawGrid
  }
}
  