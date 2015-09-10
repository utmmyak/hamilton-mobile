$(document).on('pageshow', '#news', function (e, data) {
    $('#test').rssfeed('http://students.hamilton.edu/rss/articles.cfm?item=A9AAF6B5-FB82-2ADF-26A75A82CDDD1221', {
            limit: 10,
            linktarget: '_blank',
            header: false
          }, writeClass);
        onDeviceReady();
}); 

$(document).on('pageshow', '#map', function (e, data) {
    setTimeout(function () {
        $.getScript( "js/campus.map.js", function( data, textStatus, jqxhr ) {
        });
    }, 100);
}); 
writeClass =  function() {
    $( "h4 a" ).addClass( "external" );
     $('#news .iscroll-content').attr("style", "");
}

//document.addEventListener('deviceready', onDeviceReady, false);


function onDeviceReady() {

    // Mock device.platform property if not available
    if (!window.device) {
        window.device = { platform: 'Browser' };
    }
    handleExternalURLs();
}
$(function() {
    FastClick.attach(document.body);
});
function handleExternalURLs() {
    // Handle click events for all external URLs
    if (device.platform.toUpperCase() === 'ANDROID') {
        $(document).on('click', 'a[href^="http"]', function (e) {
            var url = $(this).attr('href');
            navigator.app.loadUrl(url, { openExternal: true });
            e.preventDefault();
        });
    }
    else if (device.platform.toUpperCase() === 'IOS') {
        $(document).on('click', 'a[href^="http"]', function (e) {
            var url = $(this).attr('href');
            window.open(url, '_blank');
            alert('clicked a link');
            e.preventDefault();
        });
    }
    else {
        // Leave standard behaviour
    }
}