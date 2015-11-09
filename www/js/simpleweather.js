// Docs at http://simpleweatherjs.com
// taken from sample example : bare minimum

$(document).ready(function() {
  $.simpleWeather({
    location: 'Clinton, NY',
    woeid: '',
    unit: 'f',
    success: function(weather) {
//      html = '<p>'+weather.temp+'&deg;'+weather.units.temp+'</p>';
//      $("#weather").html(html);
        html = '<h2>'+weather.temp+'&deg;'+weather.units.temp+'</h2>';
        $("#weather").html(html);
    },
    error: function(error) {
      $("#weather").html('<p>'+error+'</p>');
    }
  });
});
