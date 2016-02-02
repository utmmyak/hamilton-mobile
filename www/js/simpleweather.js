// Docs at http://simpleweatherjs.com
// taken from sample example : bare minimum

$(document).ready(function() {
  $.simpleWeather({
    //location: 'Clinton, NY',
    woeid: '2510530',     //Oneida, NY woeid
    unit: 'f',
    success: function(weather) {
//      html = '<p>'+weather.temp+'&deg;'+weather.units.temp+'</p>';
//      $("#weather").html(html);
        var imgDisp = $('<img>').attr('src', weather.forecast[0].thumbnail);
        var tempDisp = $('<div/>').addClass('weather-text').html(weather.temp + '&deg;' + weather.units.temp);
        var weatherEl = $("#weather");
        weatherEl.empty();
        weatherEl.append(imgDisp);
        weatherEl.append(tempDisp);
    },
    error: function(error) {
      $("#weather").html('<p>'+error+'</p>');
    }
  });
});
