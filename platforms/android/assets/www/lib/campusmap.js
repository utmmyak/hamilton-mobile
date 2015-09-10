var campusMap = (function(){

	//public variables
	var App = {
		 points: []
		,currentLatLng: {}
	};

	// private variables
	var  map = {}
		,infoWin = new google.maps.InfoWindow({})
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
					 'left':(location.x)
					,'top':(location.y-15)
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

	// update a building record in the array
	var updatePoint = function(index,position,value){ App.points[index][position] = value };

	// show info window
	var showInfo = function(id){
		var item = getPoint(id);
		infoWin.setPosition(new google.maps.LatLng(item.lat,item.lng));
		infoWin.setContent(item.name);
		infoWin.open(map);
	};

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
	$('#listing').live('click',function(event, ui) { showInfo(event.target.id) });

	// event listener to locate current position
	$('#compass').live('click',function(event,ui) { updateLocation() });


	$(document).ready(function(){

		// ajax call to get buildings and locations json object
		$.ajax({
			 url:'/mobile/map/ajax/buildings.json'
			,dataType:'json'
			,success: function(data,textStatus,jqXHR){
				loadPoints(data);
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


	});

	$(window).load(function(){
		// display Markers overylay for buildings and locations
		if ( showPoints )
			var OverlayMap = new MapOverlay({map:map});
	});

	return App;

})();
