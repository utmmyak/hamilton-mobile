var campusMap = (function(){

	//public variables
	var App = {
		 points: []
		,currentLatLng: {}
	};  
	
	// private variables
	var  map = {}
        ,windows = []
		,infoWin = new google.maps.InfoWindow({pixelOffset:0,maxWidth:400})
		,showPoints = true
		,hamLatLng = new google.maps.LatLng(43.050741,-75.407442);		// defaults to center of hamilton college


	MapOverlay = function(options){
		this.setValues(options);
		this.markerLayer = $('<div />').addClass('overlay');
	};
		
	MapOverlay.prototype = new google.maps.OverlayView;
	
	MapOverlay.prototype.onAdd = function(){
		var $pane = $(this.getPanes().overlayImage);
		$pane.append(this.markerLayer);
	};
	
	MapOverlay.prototype.onRemove = function(){ };
	
	MapOverlay.prototype.draw = function(){

		var  projection = this.getProjection()
			,zoom = this.getMap().getZoom()
			,fragment = document.createDocumentFragment();
			
		this.markerLayer.empty();

		for ( var i = 0; i < App.points.length; i++ ){
			
			var  point = App.points[i]
				,latlng = new google.maps.LatLng(point.lat,point.lng)
				,location = projection.fromLatLngToDivPixel(latlng)
				,mapPoint;		

			mapPoint = $('<div />')
				.attr('id',point.id)
				.attr('title',point.name)
				.addClass('map-point')
				.css({
					 'left':(location.x-5)//These values(-5 and -10) added for infowindow to be directly over marker
					,'top':(location.y-10)
				});
			
			fragment.appendChild(mapPoint.get(0));
			
		}
		
		this.markerLayer.append(fragment);
		
	};
	
	
	// get all buildings points
	var loadPoints = function(items){ 
		App.points = items; 
		fillFindList(App.points);
	};
	
	var fillFindList = function(items){
		$('#listTmpl')
			.tmpl(App.points)
			.appendTo('ul#listing');
	};
    
    // create all infowindows
    var createInfoWins = function() {
        $.each(App.points,function(index,value){
			temp = new google.maps.InfoWindow({pixelOffset:0,maxWidth:400});
            temp.setPosition(new google.maps.LatLng(value.lat, value.lng));
            temp.setContent("<div id=\"content\" style=\"text-align:center\">"+
                            "<img src=\"http://www.hamilton.edu"+value.imgpath+"\" style=\"max-width:100%;max-height:auto;\">"+
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
	
	// show info window
	var showInfo = function(id){
        /*
		var item = getPoint(id);	
		infoWin.setPosition(new google.maps.LatLng(item.lat,item.lng));
		infoWin.setContent("<div id=\"content\" style=\"text-align:center\">"+
                            "<img src=\"http://www.hamilton.edu"+item.imgpath+"\" style=\"max-width:100%;max-height:auto;\">"+
                            "<h1 id=\"firstHeading\" class=\"firstHeading\">"+item.name+"</h1>"+
                            "<div id=\"bodyContent\" style=\"text-align:left\">"+
                            "<p>"+item.description+"</p>"+
                            "</div>"+
                            "</div>"
                            );
		infoWin.open(map);	*/
        temp = getWindow(id);
        temp.open(map);
        infoWin = temp;
	};

    // get the infowindow
    var getWindow = function(id){
        var item = [];
        $.each(App.points,function(index,value){
            if( id == value.id) 
                item= windows[index];
        });       
        return item;
    }
    
	// hide info window
	var hideInfo = function(){ infoWin.close() };
	
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
      		 position: curLatLng
     		,map: curMap
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
    $( document ).on( "click", "#listing",function(event, ui) { showInfo(event.target.id) });
	
	// event listener to locate current position
	$( document ).on( "click", "#compass",function(event,ui) { updateLocation() });
	
	
	$(document).ready(function(){

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
			 url:'ajax/locations.json'
			,dataType:'json'
			,success: function(data,textStatus,jqXHR){
				loadPoints(data);
                createInfoWins();
			}
		});

		$('#map_canvas')
			.css('height', $(document).height() - $('#map').find('[data-role=header]').height()  )
			.click(function(e){
				
				var target = $(e).prop('target'); // using .prop() instead of .attr() in jQuery 1.6
				
				// hide any open info window
				hideInfo();			
				
				// display info window when marker is clicked
				if ( $(target).attr('class') == 'map-point' ) {
					showInfo(target.id)
				}
				
			});
		
		
		// determines which map to display 
		mapTypeDisplay = google.maps.MapTypeId.ROADMAP;


		// setup and display map
		var mapOptions = {
             zoom: 16
            ,maxZoom: 19
			,center: hamLatLng
			,mapTypeId: mapTypeDisplay
			,mapTypeControl: false
			,streetViewControl: false
			,navigationControl: true
			,navigationControlOptions: { style: google.maps.NavigationControlStyle.SMALL }
			,zoomControl: true
			,zoomControlOptions: {
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
				
	});
	var OverlayMap = new MapOverlay({map:map});
	return App;

})();