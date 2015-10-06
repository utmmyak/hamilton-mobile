var campusMap = (function(){

    //public variables
    var App = {
        points: [],
        currentLatLng: {}
    };

    // private variables
    var  map = {},
        windows = [],
        infoWin = new google.maps.InfoWindow({pixelOffset:0,maxWidth:400}),
        showPoints = true,
        hamLatLng = new google.maps.LatLng(43.050741,-75.407442);		// defaults to center of hamilton college


    // get the infowindow
    var getWindow = function(id) {
        for (var el in App.points) {
            if(App.points.hasOwnProperty(el) &&
                id == App.points[el].id) {
                console.log("searching through points", el)
                console.log(windows[el]);
                return windows[el];
            }
        }
    };

    // hide info window
    var hideInfo = function(){ infoWin.close() };

    var markerClick = function() {
        var temp = getWindow(this.get('id'));
        temp.open(map);
        hideInfo();
        infoWin = temp;
    };

    var bounds = new google.maps.LatLngBounds(); // the limit for scrolling the map
    var putAllPointsOnMap = function(data) {
        for (var i in data) {
            if (data.hasOwnProperty(i)){
              console.log('adding', i);
                var point = data[i],
                    latlng = new google.maps.LatLng(point.lat,point.lng);
                bounds.extend(latlng);
                var marker = new google.maps.Marker({
                    position: latlng,
                    map: map,
                    title: point.name,
                    icon: 'images/map-marker-blue.png'
                });
                marker.set("id", point.id);
                marker.set('role', 'marker');
                marker.addListener('click', markerClick);
                marker.addListener('touchdown', markerClick);
            }
        }
        map.fitBounds(bounds); // enforce map scrolling limit
    };


    // get all buildings points
    //var loadPoints = function(items){
    //    App.points = items;
    //    fillFindList(App.points);
    //};

    var fillFindList = function(items){
        //$('#listTmpl')
        //	.tmpl(App.points)
        //	.appendTo('ul#listing');
    };
    
    // create all infowindows
    var createInfoWins = function(data) {
        $.each(data,function(index,value){
            temp = new google.maps.InfoWindow({pixelOffset:0,maxWidth:400});
            temp.setPosition(new google.maps.LatLng(value.lat, value.lng));
            temp.setContent("<div id=\"content\" style=\"text-align:center\">"+
                            '<div style="height: 140px;"><img src="http://www.hamilton.edu'+value.imgpath+'" style="max-width:100%;max-height:160px;"></div>'+
                            "<h1 id=\"firstHeading\" class=\"firstHeading\">"+value.name+"</h1>"+
                            "<div id=\"bodyContent\" style=\"text-align:left\">"+
                            "<p>"+value.description+"</p>"+
                            "</div>"+
                            "</div>"
                            );
            windows.push(temp);
        });
    };

    // update a building record in the array
    var updatePoint = function(index,position,value){ App.points[index][position] = value };


    // looks up point from array
    var getPoint = function(id){
        var item = [];
        $.each(App.points,function(index,value){
            if ( id == value.id )
                item = value;
        });
        return item;
    };

    // add a current location marker to map
    var addLocationMarker = function(curLatLng, curMap) {
        var marker = new google.maps.Marker({
            position: curLatLng,
            map: curMap
        });
    };

    // update current location
    var updateLocation = function() {
        // GeoLocation option
        navigator.geolocation.getCurrentPosition(function(position) {
                App.currentLatLng = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
                map.setCenter(App.currentLatLng);
                addLocationMarker(App.currentLatLng,map);
            },function(){ addLocationMarker(hamLatLng,map) });

    };


    // event listener to find a buidling or location
    //$( document ).on( "click", "#listing",function(event, ui) { showInfo(event.target.id) });

    // event listener to locate current position
    $( document ).on( "click", "#compass",function(event,ui) { updateLocation() });


    $(document).ready(function(){
        console.log('loading campus map');

        $('#hamSplash .mobilenav.search').tap(function() {

            var searchform = $('.searchform');

            if ( searchform.css('display') == 'none' ) {
                searchform.show();
            } else {
                searchform.hide();
            }

            return false;
        });

        // ajax call to get buildings and locations json object
        $.ajax({
                  url: 'ajax/locations.json',
                  dataType: 'json',
                  method: 'POST'
              })
        .done(function(data) {
          //loadPoints(data);
          console.log('loaded locations.json');
          App.points = data;
          createInfoWins(data);
          console.log(data);
          putAllPointsOnMap(data);
        }).error(function(jqXHR, textStatus, errorThrown){ console.log("error crit", errorThrown, textStatus, jqXHR); });

        $('#map_canvas')
            .css('height', $(document).height() - $('#map').find('[data-role=header]').height()  )
            .click(function(e){
                var target = $(e).prop('target'); // using .prop() instead of .attr() in jQuery 1.6

                // hide any open info window if the clicked object is not a marker
                if ('get' in e && e.get("role") != "marker") {
                    hideInfo();
                }
            });

        // determines which map to display
        mapTypeDisplay = google.maps.MapTypeId.ROADMAP;

        // setup and display map
        var mapOptions = {
            minZoom: 15,
            zoom: 16,
            maxZoom: 19,
            center: hamLatLng,
            mapTypeId: mapTypeDisplay,
            mapTypeControl: false,
            streetViewControl: false,
            navigationControl: true,
            navigationControlOptions: { style: google.maps.NavigationControlStyle.SMALL },
            zoomControl: true,
            zoomControlOptions: {
                style: google.maps.ZoomControlStyle.SMALL,
                position: google.maps.ControlPosition.TOP_LEFT
            }
        };
        
        map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);
        
        //Hide default points of interest by google(already have our own)
        var styles = [
               {
                 featureType: "poi",
                 stylers: [
                  { visibility: "off" }
                 ]   
                }
            ];
        map.setOptions({styles: styles});

        google.maps.event.addListener(map, 'dragend', function(){
            if (bounds.contains(map.getCenter())) return;
            map.setCenter(hamLatLng);
        });

    });

    return App;

})();