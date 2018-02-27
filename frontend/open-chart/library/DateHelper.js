var tjn = tjn || {}

tjn.DateHelper = function() {

    function getPastDateFromDate(_date, pastDays) {
        var day = _date.getDate() - pastDays
        var past_date = new Date(_date.getFullYear(), _date.getMonth(), day, 0, 0, 0, 0)
        return past_date
    }

    function stringToDate(dateStr) {
      return new Date(dateStr);
      var d = dateStr
      var yy = parseInt(d[0] + d[1] + d[2] + d[3])
      var mm = parseInt(d[4] + d[5]) - 1
      var dd = parseInt(d[6] + d[7])
      var hh = parseInt(d[8] + d[9])
      var mn = parseInt(d[10] + d[11])
      var ss = parseInt(d[12] + d[13])
      var _date = new Date(yy, mm, dd, hh, mn, ss, 00)
      return _date
    }

    function dateToDateStr(_date) {
        var y = _date.getFullYear()
        var m = formatWithLeadingZero(_date.getMonth() + 1)
        var d = formatWithLeadingZero(_date.getDate())

        var h  = formatWithLeadingZero(_date.getHours())
        var mm = formatWithLeadingZero(_date.getMinutes())
        var ss = formatWithLeadingZero(_date.getSeconds())
        var ms = formatWithLeadingZero(Math.round(_date.getMilliseconds() * 0.1))

        function formatWithLeadingZero(v) {
            return v > 9 ? "" + v : '0' + v
        }

        return y + m + d + h + mm + ss + ms
    }

    function getDateFromDateString(dateStr) {
      var y = dateStr[0] + dateStr[1] + dateStr[2] + dateStr[3]
      var m = dateStr[4] + dateStr[5]
      var day = dateStr[6] + dateStr[7]
      var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'Octomber', 'November', 'Decembler']
      return [y, months[m-1],day]
    }

    return {
        dateToDateStr: dateToDateStr,
        getPastDateFromDate: getPastDateFromDate,
        getDateFromDateString: getDateFromDateString,
        stringToDate: stringToDate
    }
}
