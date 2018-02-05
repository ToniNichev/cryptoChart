var tjn = tjn || {}

tjn.ThrendsDrawer = function(drawingCanvas, config) {

  var drawingCanvas = drawingCanvas
  var context_width = context_width || (drawingCanvas.width - 50)
  var context_height = context_height || drawingCanvas.height
  var ctx = drawingCanvas.getContext("2d")


  function drawThrends(chartData, offset, min, max) {

    function getYPosition(price) {
      //let  y = (context_height - context_padding)  - ((price - min));
      let y = (context_height - context_padding) - price;
      return y;
    }

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
      var trendVal = chartData[offset.start].trend;
      var prevY = getYPosition(trendVal); 
    }
    //var dataLength = chartData.length - (offset.start + offset.end)
    let ratio = context_width / dataLength;


    ctx.beginPath();    
    ctx.globalAlpha=1;
    ctx.lineWidth = 0.6;    
    ctx.strokeStyle="#45f709";

    const y = (context_height - context_padding);
    ctx.moveTo(0,  y)
    ctx.lineTo(context_width, y);
    ctx.stroke();    

    ctx.beginPath();
    ctx.lineWidth = 1; 
    ctx.strokeStyle = '#E36049';    
    ctx.moveTo(0,  y);    
    ctx.stroke();

    // draw chart
    var firstXpos = 0;
    var lastPos = 0;
    for(var co = 0; co < context_width; co++) {
      var pos = Math.round(co / ratio) + offset.start;
      if(typeof pos == 'undefined') {
        debugger;
      }

      if(typeof chartData[pos] != 'undefined') {
        var price = parseFloat(chartData[pos].trend)

        price = price * 15;

        if(lastPos != pos) {
          ctx.lineTo(prevX, prevY);
          // set up next coordinates
          prevX = co;
          prevY = getYPosition(price);
          lastPos = pos;
        }
      }
    }  
    ctx.stroke();


    ctx.lineTo(prevX, prevY);
    ctx.stroke();

    // close the fill in area
    ctx.lineTo(prevX, context_height - context_padding / 2);
    ctx.lineTo(firstXpos, context_height - context_padding / 2);

    //ctx.fillStyle = config.fillColor
    //ctx.fill();
  }


  return {
    drawThrends: drawThrends
  }
}
  