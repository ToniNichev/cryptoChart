var tjn = tjn || {}

tjn.TransactionsMarker = function(drawingCanvas, config) {

	var drawingCanvas = drawingCanvas
	var context_width = context_width || (drawingCanvas.width - 50)
	var context_height = context_height || drawingCanvas.height
	var ctx = drawingCanvas.getContext("2d")


	function drawTransactions(chartData, offset, min, max) {

	    function getYPosition(price) {
	    let  y = (context_height - context_padding)  - ((price - min) * minMax);
	    return y;
	    }

		lineWidth = config.lineWidth
		lineColor = config.lineColor
		fillColor = config.fillColor
		context_width = context_width || (drawingCanvas.width - 50)
		context_height = context_height || drawingCanvas.height
		var context_padding = config.context_padding
		var speed = config.interaction.scrollingSpeed
		var dataLength = parseInt(chartData.length) - (offset.start + offset.end)
    	var minMax =  (context_height - context_padding * 2) / (max - min);

		ctx = ctx || drawingCanvas.getContext("2d");

    // set up starting coordinates
    var prevX = 0;
    if(typeof chartData[offset.start] != 'undefined') {
      var close = chartData[offset.start].close
      var prevY = getYPosition(close); // (context_height - context_padding * 2) - close;

    }
    var dataLength = chartData.length - (offset.start + offset.end)
    let ratio = context_width / dataLength;

    ctx.beginPath()
    //ctx.globalAlpha=0.5;
    ctx.lineWidth = config.lineWidth
    ctx.strokeStyle = config.lineColor

    // draw markers
    var firstXpos = 0;
    var lastPos = 0;
    for(var co = 0; co < context_width; co++) {
      var pos = Math.round(co / ratio) + offset.start;

      if(typeof chartData[pos] != 'undefined') {
        

        if(lastPos != pos) {
          // draws trades if any 
          if(typeof chartData[pos].trade != 'undefined') {
			var price = parseFloat(chartData[pos].close);
			const Ypos = getYPosition(price);
			const Xpos = co;
			//@todo find the right X
          	drawMarker(ctx, pos, chartData[pos], Xpos, Ypos);
          }
          // set up next coordinates
          prevX = co;
          prevY = getYPosition(price);
          lastPos = pos;
        }
      }
    }
    ctx.stroke();
	}

	function drawMarker(_ctx, _pos, _chartData, X, Y) {
		_ctx.font = "10px Arial"
		
		if( _chartData.trade.action == 'buy') {
			_ctx.fillStyle = _chartData.trade.sold == "yes" ? '#F1BCBC' : '#f57c5d';
		}
		else {
			_ctx.fillStyle = '#45f709';
		}
    	_ctx.lineWidth = 1;
    	_ctx.strokeStyle = '#45f709'; 

;
	    let y_offset = Y > 60 ? 20 : -20;
	    let Y_text_offset = Y > 60 ? 0 : -55;

	    _ctx.moveTo(X,Y);
	    _ctx.lineTo(X-10, Y - (y_offset - 3) );
	    _ctx.lineTo(X-50, Y - (y_offset - 3) );

	    var msg = _chartData.trade.action;
	    _ctx.fillText(msg, X-50, Y - y_offset - 40 - Y_text_offset);

	    var msg = 'shares: ' + parseFloat(_chartData.trade.shares).toFixed(4);
	    _ctx.fillText(msg, X-50, Y - y_offset - 30 - Y_text_offset);	    

	    var msg = 'price per share: $' + parseFloat(_chartData.trade.pricePerShare).toFixed(4);
	    _ctx.fillText(msg, X-50, Y - y_offset - 20 - Y_text_offset);	  	    

	    var msg = 'total spent: $' + parseFloat(_chartData.trade.totalSpent).toFixed(4);
	    _ctx.fillText(msg, X-50, Y - y_offset - 10 - Y_text_offset);

	    var msg = 'wallet left: $' + parseFloat(_chartData.trade.moneyLeft).toFixed(4);
	    _ctx.fillText(msg, X-50, Y - y_offset - Y_text_offset);	  	    	    

	}

	return {
		drawTransactions: drawTransactions
	}
}
  