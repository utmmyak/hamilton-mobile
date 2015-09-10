function drawHamiltonMap (){
    var  map = {}
		,infoWin = new google.maps.InfoWindow({})
		,showPoints = true
		,hamLatLng = new google.maps.LatLng(43.050741,-75.407442);		// defaults to center of hamilton college

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
		var OverlayMap = new MapOverlay({map:map});		
}