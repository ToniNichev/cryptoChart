class TjnChartUI extends HTMLElement {

  constructor() {
    super()
    this.symbolData = {}
  }

  getSymbolData(objectID) {
    this.symbolData = eval(objectID + ".getSymbolData()")
    return this.symbolData
  }
}

///////////////////////////////////////////////////////////////
// web component name: TjnOpenchartsTimeIntervals
// description:
///////////////////////////////////////////////////////////////
class TjnOpenchartsTimeIntervals extends TjnChartUI {
  constructor() {
    // Always call super first in constructor
    super()

    var objectID = this.getAttribute('objectID')
    var buttons = this.getElementsByTagName('li')
    var symbolData = super.getSymbolData(objectID)

    for (var q=0;q< buttons.length; q++) {
      var b = buttons[q]
      b.onclick = function(event) {
        //alert(this.getAttribute('time-frame'))
        var timePeriod = this.getAttribute('time-frame')
        eval(objectID + ".requestChartForTimeFrame('" + symbolData.symbol + "', '" + timePeriod + "', null, false, null)")
      }
    }
  }
}

///////////////////////////////////////////////////////////////
// web component name: TjnOpenchartsTimeIntervals
// description:
///////////////////////////////////////////////////////////////
class TjnOpenchartsTimeGranularity extends TjnChartUI {
  constructor() {
    // Always call super first in constructor
    super();

    var objectID = this.getAttribute('objectID')
    var buttons = this.getElementsByTagName('li')
    var symbolData = super.getSymbolData(objectID)

    for (var q=0;q< buttons.length; q++) {
      var b = buttons[q]
      b.onclick = function(event) {
        var granularity = this.getAttribute('time-granularity')
        eval(objectID + ".requestChartForTimeFrame('" + symbolData.symbol + "', null, '" + granularity + "', null)")
      }
    }
  }
}



$( document ).ready(function() {
  // Define the new element
  customElements.define('tjn-opencharts-time-intervals', TjnOpenchartsTimeIntervals)
  customElements.define('tjn-opencharts-time-granularity', TjnOpenchartsTimeGranularity)
})


/**
 * dependencies: DateHelper
 *
 */
 var tjn = tjn || {}
tjn.ChartUI = function(CanvasId, _config) {

}
