function GeolocMapa (pSettings){
		var _this = this,
		map,
		estadoBounds,
		mapPanel,
		mapContainer,
		mapOptions,
		tplMap,
		arrMarks = {},// arreglo de marcadores
		arrShapes = {},//arreglo de shapes
		arrLines = {},
		arrPolylines = {},
		shapesBounds,// bounds de lista de shapes
		markConfig, //configuracion de marcador
		arrPoligons,
		dgoCenter,//centro del estado de durango
		editable = false,
		drawingManager,
		strokeColor = "#0f6b62",
		fillColor = "#159397",
		doInfoWindow = true;
		infoWindow = null,
		drawingModes = null,
		scrollwheel = false, //habilitar o deshabilitar el scroll para zoom dentro de mapa
		streetViewControl = false, //habilitar o deshabilitar el streetview
		panControl = false, //habilitar o deshabilitar el panel de movimiento del mapa
		controlsPosition = 'tl',
		settings = pSettings;

		// inicia variables
		var setSettings = function ( sSettings ){

			//centro del estado de durango
			dgoCenter = new google.maps.LatLng(23.740979865680476, -104.95682708808589);
			// limites del estado
			estadoBounds = new google.maps.LatLngBounds();
			var objlatlng = new google.maps.LatLng( 27.132058980260883, -107.67674866120603 )
			estadoBounds.extend( objlatlng );
			var objlatlng = new google.maps.LatLng( 27.132058980260883, -102.48021545808103 )
			estadoBounds.extend( objlatlng );
			var objlatlng = new google.maps.LatLng( 22.283576059596054, -107.67674866120603 )
			estadoBounds.extend( objlatlng );
			var objlatlng = new google.maps.LatLng( 22.283576059596054, -102.48021545808103 )
			estadoBounds.extend( objlatlng );
			//template contenedor mas basico

			//configuracion default de marcador
			markConfig = {
				draggable: false
	         };
	         //opciones default de mapa
         	mapOptions = {
				center: dgoCenter,
				zoom: 12,
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				scrollwheel: sSettings.scrollwheel? sSettings.scrollwheel : scrollwheel,
				streetViewControl: sSettings.streetViewControl? sSettings.streetViewControl : streetViewControl,
				panControl:sSettings.panControl? sSettings.panControl : panControl,
			};

			//console.log(sSettings);
			//asigna el panel donde se dibujara el mapa
			mapPanel = sSettings.mapPanel;
			//cambia las opciones de mapa si son mandadas por parametro
			mapOptions = sSettings.mapOptions ? sSettings.mapOptions : mapOptions;

			tplMap = sSettings.tplMap ? sSettings.tplMap : tplMap;

			editable = sSettings.editable ? sSettings.editable : editable;

			doInfoWindow = sSettings.doInfoWindow ? sSettings.doInfoWindow : doInfoWindow;

			if( doInfoWindow ){
				infoWindow = new google.maps.InfoWindow({
			      	content: 'test'
			  	});
			}

			drawingModes = [
		        //google.maps.drawing.OverlayType.CIRCLE,
		        //google.maps.drawing.OverlayType.MARKER,
		        //google.maps.drawing.OverlayType.POLYGON,
		        //google.maps.drawing.OverlayType.POLYLINE,
		        //google.maps.drawing.OverlayType.RECTANGLE
		    ];

		    if( sSettings.marker ){
		    	drawingModes.push(google.maps.drawing.OverlayType.MARKER);
		    }

		    if( sSettings.polyline ){
		    	drawingModes.push(google.maps.drawing.OverlayType.POLYLINE);
		    }
			

		};

		
		//inicia el mapa sin marcadores ni shapes
		this.init = function(panel){			

			
			mapPanel = panel ? panel : mapPanel;

			//nombra el div que contiene el mapa
			mapContainer = mapPanel;
 			//var detalleEl = Ext.getCmp(mapPanel).body;

 			//dibuja el div de mapa en el panel
			//tplMap.overwrite(detalleEl, { mapContainer : mapContainer });
			//crea el mapa
			map = new google.maps.Map(document.getElementById(mapContainer),mapOptions);

			shapesBounds = new google.maps.LatLngBounds();

			if( editable ){
				makeEditable();
			}
		};
		this.init_layout = function(panel){	// solo usado en modo con layout	

			
			mapPanel = panel ? panel : mapPanel;

			//nombra el div que contiene el mapa
			mapContainer = mapPanel;			
 			
			//crea el mapa
			map = new google.maps.Map(document.getElementById(mapContainer),mapOptions);

			shapesBounds = new google.maps.LatLngBounds();

			if( editable ){
				makeEditable();
			}
		};
		//change the map zoom
		this.setZoom = function(z){ // int z			
		  	var zoomChangeBoundsListener = google.maps.event.addListener(map, 'bounds_changed', function (event) {		               
                this.setZoom(z);		                 
                google.maps.event.removeListener(zoomChangeBoundsListener);
            });
		     
		};
		//setters

		this.setTemplate = function(tpl){
			tpl.map = tpl;
		};

		// getters 
		// obtiene el objeto googlemap
		this.getMap = function(){
			return map;
		}

		this.setCenter = function(lat,log){
			//var center=new GLatLng(lat, log);
			map.setCenter(lat,log);
		}	

		this.resize = function(){
			var center = map.getCenter();
		    google.maps.event.trigger(map, "resize");
		    map.setCenter(center);
		}
		//obtiene el drawingmanager
		this.getDrawingManager = function(){
			return drawingManager;
		}
		//obtiene una marca del arreglo
		this.getMark = function ( idx ){
			idx = idx? idx : 0;
			return arrMarks[idx];
		}
		//obtiene un shape del arreglo
		this.getShape = function ( idx ){

			idx = idx? idx : 0;
			return arrShapes[idx];
		}
		//obtiene una linea del arreglo
		this.getLine = function ( idx ){

			idx = idx? idx : 0;
			return arrLines[idx];
		}

		this.getPolyline = function ( idx ){

			idx = idx? idx : 0;
			return arrPolylines[idx];
		}

		this.getPolylineRoute = function ( idx ){

			var result = new Array();
			idx = idx? idx : 0;
			if( arrPolylines[idx] ){
				var polyline = arrPolylines[idx].getPath();

				polyline.forEach(function(item, index){
					result.push( {lat: item.lat(), lng: item.lng()} )
				});
			}

			return result;
		}

		// crea una polylinea
		var createPolyline = function( polygonJson, pStrokeColor, pFillColor, idx ){	

			if( pStrokeColor ){
				strokeColor = pStrokeColor;
				//map = null;
			}
			if( pFillColor ){
				//map = null;
				fillColor = pFillColor;
			}
			var arrLatLng = Array();
			Ext.each( polygonJson , function( pItem, pIdx, pItems ){
				//console.log(pItem);
				var objlatlng = new google.maps.LatLng( pItem.lat, pItem.lng );
				arrLatLng.push( objlatlng );

			});
			//console.log(arrLatLng[0].getLan()+" "+arrLatLng[0].getLn() );
			var poli = new google.maps.Polyline({
				map : map,
				path : arrLatLng,
				// strokeColor: strokeColor,
				// strokeOpacity: 1,
				// strokeWeight: 1,
				// clickable : false,
				// fillColor: fillColor,
			});

		
			return poli;
		}
		
		this.addPolyline = function( idx, polyline, bounds ){

			this.removeLine(idx);
			var polylineJson = Ext.util.JSON.decode( polyline );
			var boundsJson = true; //Ext.util.JSON.decode( bounds );
			//console.log(polylineJson);

			//console.log(polygonJson);
			//console.log(boundsJson);

			if( polylineJson && boundsJson ){
				var item = createPolyline(polylineJson, null, null, idx);
				if( idx ){
					arrPolylines[idx] = item;
				}else{
					arrPolylines[0] = item;
				}
				//shapesBounds.union(item.bounds);
				//console.log(Object.keys(arrShapes).length);
				//map.fitBounds( item.bounds );
				console.log(item);

				return item;
			}else{
				//console.log(Object.keys(arrShapes).length);
				return null;
			}
			
		}

		var makeEditable = function(){
			var POS;
			switch(controlsPosition){
				case 'tl': POS = google.maps.ControlPosition.TOP_LEFT; break;
				case 'tc': POS = google.maps.ControlPosition.TOP_CENTER; break;
				case 'tr': POS = google.maps.ControlPosition.TOP_RIGHT; break;
				case 'bl': POS = google.maps.ControlPosition.BOTTOM_LEFT; break;
				case 'bc': POS = google.maps.ControlPosition.BOTTOM_CENTER; break;
				case 'br': POS = google.maps.ControlPosition.BOTTOM_RIGHT; break;
				default: POS = google.maps.ControlPosition.TOP_RIGHT; break;
			}
			drawingManager = new google.maps.drawing.DrawingManager({
			    drawingMode: google.maps.drawing.OverlayType.MARKER,
			    drawingControl: true,
			    drawingControlOptions: {
			      position: POS,
			      drawingModes: drawingModes
			    },
			    polylineOptions: {}
		  	});
			  drawingManager.setMap(map);

			  google.maps.event.addListener( drawingManager, 'polygoncomplete', function (poly) {
				if( arrShapes[0] ){
					_this.removeShape();
				}
				arrShapes[0] =  {
					shape: poly,
					bounds : null,
				};

			  });

			  google.maps.event.addListener( drawingManager, 'markercomplete', function (mark) {
				if( arrMarks[0] ){
					_this.removeMark();
				}
				arrMarks[0] = mark;

			  });

			  google.maps.event.addListener( drawingManager, 'polylinecomplete', function (polyline) {
				if( arrPolylines[0] ){
					_this.removePolyline();
				}
				arrPolylines[0] = polyline;

			  });
		}

		//agrega un marcador al arreglo
		this.addMark = function( idx, lat, lng, config ){

			this.removeMark(idx);
			var position, mark;
			//si hay configuracion la cambia
			if(config){
				markConfig = config;
			}
			// solo pone marcador si lat y lng son mayor a cero
			if( (lat.length > 0 && lng.length > 0) || (lat != 0 && lng != 0) ){
		        	
	        	position = new google.maps.LatLng( lat, lng );
		          
	          	markConfig.map = map;
				markConfig.position = position;
				//console.log(markConfig);
				var mark = new google.maps.Marker(markConfig);
				
				if( idx ){
					arrMarks[idx] = mark;
				}else{
					arrMarks[0] = mark;
				}  
				//console.log(arrMarks);
				//console.log(mark);
				shapesBounds.extend(mark.getPosition());
	        	return mark;            
		    }else{
		        return null;
		    }

			//map.setCenter(position);
		    
		};

		this.centerMark = function( idx ){
			idx = idx? idx : 0;
			
			if( arrMarks[idx] ){
				map.setCenter( arrMarks[idx].getPosition() );
				return true;
			}else{
				return false;
			}
		}

		
		this.searchMark = function( address, onSuccess ){
			var geocoder = new google.maps.Geocoder();
		    var bnds = estadoBounds;
		    // funcion callback de geocode
		    var geocodeResult = function(results, status) {
			    
			    if (status == 'OK') {
			        // Si hay resultados encontrados, centramos y repintamos el mapa
			        // esto para eliminar cualquier pin antes puesto
			        var location = results[0].geometry.location;
			        
			        // fitBounds acercará el mapa con el zoom adecuado de acuerdo a lo buscado
			        map.fitBounds(results[0].geometry.viewport);
			        // Dibujamos un marcador con la ubicación del primer resultado obtenido
			        if( arrMarks[0] ){
			        	arrMarks[0].setPosition( location );
			        }else{
			        	var mrk = setMark( location.lat(), location.lng() );
			        	//console.log(mrk);
			        }
			        
			        onSuccess( location );			   

			    } else {
			        msg = "";
			        if(status == "ZERO_RESULTS"){           
			            msg = "No se ha encontrado ningun domicilio existente.";
			        } else if(status == "OVER_QUERY_LIMIT"){
			            msg = "Se ha excedido el limite de consulta de peticiones, intente de nuevo mas tarde.";
			        } else if(status == "INVALID_REQUEST"){
			            msg = "Peticion invalida, intente de nuevo.";
			        } 
			        Ext.Msg.alert("Aviso",msg);
			        //DirectorioModule.SubmodEditDomicilio.searchInMap(1); 
			        var location = bnds.getCenter();
		         	arrMarks[0].setPosition( location );  
		         	map.fitBounds(bnds);       
			    }

			}

			// Hacemos la petición indicando la dirección e invocamos la función
		    // geocodeResult enviando todo el resultado obtenido
		    //console.log(address);
		    geocoder.geocode({'address': address, 'country': 'mx', 'bounds': bnds }, geocodeResult);
		}
		// retira un marcador
		this.removeMark = function( idx ){

			idx = idx ? idx : 0;
			//console.log(arrShapes);
			if( arrMarks[idx] ){
				//console.log(arrShapes[idx]);
				arrMarks[idx].setMap(null);
				delete arrMarks[idx];
			}
			
		}
		//callback de busqueda de direccion
		
		this.clearAllShapes = function(){
			//console.log(Object.keys(arrShapes).length);
			for (var idx in arrShapes)
			  {
			  	//console.log(idx);
			  	this.removeShape(idx);
			  }
		}

		this.clearAllMarks = function(){
			//console.log(Object.keys(arrMarks).length);
			for (var idx in arrMarks)
			  {
			  	this.removeMark(idx);
			  }

		}

		this.clearAllLines = function(){

			for (var idx in arrLines)
			  {
			  	this.removeLine(idx);
			  }

		}

		this.fitBoundsShape = function(idx){
			//console.log(idx);
			idx = idx? idx : 0;

			if( arrShapes[idx] ){
				map.fitBounds( arrShapes[idx].bounds );
				return true;
			}else{
				return false;
			}
		}

		this.fitAllBounds = function(){
			//console.log(idx);
			map.fitBounds( shapesBounds );
		}

		this.fitEstadoBounds = function(){
			//console.log(idx);
			map.fitBounds( estadoBounds );
		}

		// agrega un poligono
		this.addShape = function( idx, shape, bounds ){

			this.removeShape(idx);
			var polygonJson = Ext.util.JSON.decode( shape );
			var boundsJson = Ext.util.JSON.decode( bounds );
			//console.log(shape);

			//console.log(polygonJson);
			//console.log(boundsJson);

			if( polygonJson && boundsJson ){
				var item = {
					shape: createShape(polygonJson, null, null, idx),
					bounds : createBounds(boundsJson),
				};
				if( idx ){
					arrShapes[idx] = item;
				}else{
					arrShapes[0] = item;
				}
				shapesBounds.union(item.bounds);
				//console.log(Object.keys(arrShapes).length);
				//map.fitBounds( item.bounds );
				

				return item;
			}else{
				//console.log(Object.keys(arrShapes).length);
				return null;
			}
			
		}

		// agrega un poligono
		this.addCircle = function( idx, lat, lng, config ){
			//console.log(idx);
			this.removeShape(idx);
			//console.log(shape);

			//console.log(polygonJson);
			//console.log(boundsJson);
			var circleConfig = {};
			var center, item;
			//si hay configuracion la cambia
			if(config){
				circleConfig = config;
			}
			// solo pone marcador si lat y lng son mayor a cero
			if( (lat.length > 0 && lng.length > 0) || (lat != 0 && lng != 0) ){
		        	
	        	center = new google.maps.LatLng( lat, lng );
		          
	          	circleConfig.map = map;
				circleConfig.center = center;
				circleConfig.radius = 400;
				circleConfig.strokeColor = strokeColor;
				circleConfig.strokeOpacity = 1;
				circleConfig.strokeWeight = 1;
				circleConfig.fillColor = fillColor;
				circleConfig.fillOpacity = .2;
				//console.log(markConfig);
				var circle = new google.maps.Circle(circleConfig);
				
				item = {
					shape: circle,
					//bounds : [center],
				};
				if( idx ){
					arrShapes[idx] = item;
				}else{
					arrShapes[0] = item;
				}

				if( doInfoWindow ){
					google.maps.event.addListener(circle, 'click', function() {
						
						console.log(center.toString());
						infoWindow.setContent('<div id="content">'+ center.toString() +'</div>');
						infoWindow.setPosition(center);
						infoWindow.open(map, circle);
					});
				}

				//shapesBounds.union(item.bounds);
				//console.log(Object.keys(arrShapes).length);
	        	return item;            
		    }else{
		    	//console.log(Object.keys(arrShapes).length);
		        return null;
		    }

			
		}


		// retira un poligono
		this.removeShape = function( idx ){

			idx = idx ? idx : 0;
			//console.log(arrShapes);
			if( arrShapes[idx] ){
				//console.log(arrShapes[idx]);
				arrShapes[idx].shape.setMap(null);
				delete arrShapes[idx];
			}
			
		}

		// crea el shape
		var createShape = function( polygonJson, pStrokeColor, pFillColor, idx ){	

			if( pStrokeColor ){
				strokeColor = pStrokeColor;
				//map = null;
			}
			if( pFillColor ){
				//map = null;
				fillColor = pFillColor;
			}
			var arrLatLng = Array();
				Ext.each( polygonJson , function( pItem, pIdx, pItems ){
					//console.log(pItem);
					var objlatlng = new google.maps.LatLng( pItem.lat, pItem.lng );
					arrLatLng.push( objlatlng );

				});
				//console.log(arrLatLng[0].getLan()+" "+arrLatLng[0].getLn() );
				var poli = new google.maps.Polygon({
					map : map,
					paths : arrLatLng,
					strokeColor: strokeColor,
					strokeOpacity: 1,
					strokeWeight: 1,
					//clickable : false,
					fillColor: fillColor,
					fillOpacity: .2
				});

				if( doInfoWindow ){

					google.maps.event.addListener(poli, 'click', function() {
						//infowindow.open(map,p);
						
						infoWindow.setContent('<div id="content">'+ arrLatLng[0].toString() +'</div>');
						infoWindow.setPosition(arrLatLng[0]);
						infoWindow.open(map, poli);
					});
				}
			
				return poli;
		}

		// crea los limites
		var createBounds = function( boundsJson ){
			var bounds = new google.maps.LatLngBounds();
			//console.log(arrPoligon);

			var objlatlng = new google.maps.LatLng( boundsJson[0].lat, boundsJson[0].lng )
			bounds.extend( objlatlng );
			objlatlng = new google.maps.LatLng( boundsJson[1].lat, boundsJson[1].lng )
			bounds.extend( objlatlng );

			return bounds;
		}

		// agrega una linea
		this.addLine = function( idx, arrLatLng ){
			//elimina una linea en idx
			this.removeLine(idx);

		  	var lineCoordinates = [];

		  	for (var i=0,len=arrLatLng.length; i<len; i++)
			{
				lineCoordinates.push( new google.maps.LatLng(arrLatLng[i].lat, arrLatLng[i].lng) );
			}

			//console.log(lineCoordinates);

		  	var line = new google.maps.Polyline({
			    path: lineCoordinates,
			    geodesic: true,
			    strokeColor: '#106c6f',
			    strokeOpacity: 1.0,
			    strokeWeight: 2
		  	});

		  	line.setMap(map);

		  	if( idx ){
				arrLines[idx] = line;
			}else{
				arrLines[0] = line;
			} 

		  	return line;
			
		}

		this.removeLine = function( idx ){

			idx = idx ? idx : 0;
			//console.log(arrShapes);
			if( arrLines[idx] ){
				//console.log(arrShapes[idx]);
				arrLines[idx].setMap(null);
				delete arrLines[idx];
			}
			
		}

		this.removePolyline = function( idx ){

			idx = idx ? idx : 0;
			//console.log(arrShapes);
			if( arrPolylines[idx] ){
				//console.log(arrShapes[idx]);
				arrPolylines[idx].setMap(null);
				delete arrPolylines[idx];
			}
			
		}

		// pone los parametros de setup
		setSettings(pSettings);
	};


var Figura = function() {
    this.tipo = "";
};

Figura.prototype = {

    setStrategy: function(tipo) {
        this.tipo = tipo;
    },
    draw: function(map, params) {
        return this.tipo.draw(map, params);
    }
};

var Localidad = function() {
    this.draw = function(map, params) {

        // calculations...
        //console.log('localidad');
        
    }
};

var AreaInfluencia = function() {
    this.draw = function(map, params) {

        // calculations...
        //console.log('area de influencia');
       
    }
};

	
