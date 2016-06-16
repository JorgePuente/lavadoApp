angular.module('lavadoApp.controllers', [])

.controller('LoginCtrl', function($scope) {})

.controller('MapMenuCtrl', function($scope, $cordovaGeolocation, $ionicPopup, $ionicLoading, $state) {
  
  // google.maps.event.addDomListener(window, 'load', function(){


  //   var myLatLng = new google.maps.LatLng(37.3080, -120.4833);

  //   var mapOptions = {
  //     center : myLatLng,
  //     zoom : 16,
  //     mapTypeId : google.maps.MapTypeId.ROADMAP
  //   };

  //   var map = new google.maps.Map(document.getElementById('map'), mapOptions);

  //   $scope.map = map;

  // });

  $scope.s = {};
  $scope.s.address = '';
  $scope.s.marker = false;
  $scope.map = {};

  var options = {timeout: 10000, enableHighAccuracy: true};
 
  $cordovaGeolocation.getCurrentPosition(options).then(function(position){

    $scope.map = new GeolocMapa({ mapPanel : "map", editable: true, doInfoWindow : false});
    $scope.map.init();

    $scope.map.addMark(0, position.coords.latitude, position.coords.longitude);
    $scope.map.centerMark(0);
    $scope.map.setZoom(15);
    $scope.s.marker = true;

  }, function(error){
    console.log("Could not get location");
  });

  $scope.busca_direccion = function(){

    if ($scope.s.address != '') {
      $ionicLoading.show({
        template: 'Buscando...'
      });
    }else {
      $ionicPopup.alert({
        title: 'Error',
        content: 'Agregue una dirección para buscar'
      });

      // $ionicLoading.hide().then(function(){
      //     console.log("The loading indicator is now hidden");
      // });
    }
  }

  $scope.getListado = function(tipo){
    
    if ($scope.s.marker) {
        // $ionicLoading.show({
        //   template: 'Cargando ' + tipo + '...'
        // });

        // setTimeout(function(){
        //   $ionicLoading.hide();
        // }, 400);

        if (tipo == 'servicios') {
          $state.go('servicios');
        }else if (tipo == 'paquetes') {
          $state.go('paquetes');
        }
    }else{
        $ionicPopup.alert({
          title: 'Error',
          content: 'Seleccione una dirección en el mapa para continuar'
        });
    }
  }

 
})




.controller('ServiciosCtrl', function($scope) {

  $scope.ser = {};
  $scope.ser.subtotal = 0;
  $scope.servicios = [
      {
          id : 1,
          nombre : 'Lavado de Carrocería',
          precio : 5,
          checked : false
      },
      {
          id : 2,
          nombre : 'Pulido',
          precio : 7,
          checked : false
      },
      {
          id : 3,
          nombre : 'Encerado',
          precio : 2,
          checked : false
      },
      {
          id : 4,
          nombre : 'Aspirado de interiores',
          precio : 9,
          checked : false
      },
      {
          id : 5,
          nombre : 'Lavado de Carrocería',
          precio : 5,
          checked : false
      },
      {
          id : 6,
          nombre : 'Pulido',
          precio : 7,
          checked : false
      },
      {
          id : 7,
          nombre : 'Encerado',
          precio : 2,
          checked : false
      },
      {
          id : 8,
          nombre : 'Aspirado de interiores',
          precio : 9,
          checked : false
      }
  ];

  $scope.suma_precios = function(checked, precio){
      if (checked) {
          $scope.ser.subtotal += precio;
      }else{
          $scope.ser.subtotal -= precio;
      }
  }

})
.controller('PaquetesCtrl', function($scope) {

    $scope.paq = {};
    $scope.paquetes = [
        {
            id : 1,
            nombre : 'Paquete 1',
            precio : 15,
            checked : false,
            servicios : [
                          {nombre : 'Lavado de carrocería'},
                          {nombre : 'Aspirado de interiores'},
                        ]
        },
        {
            id : 2,
            nombre : 'Paquete 2',
            precio : 18,
            checked : false,
            servicios : [
                          {nombre : 'Lavado de carrocería'},
                          {nombre : 'Aspirado de interiores'},
                          {nombre : 'Pulido'},
                        ]
        },
        {
            id : 3,
            nombre : 'Paquete 3',
            precio : 20,
            checked : false,
            servicios : [
                          {nombre : 'Lavado de carrocería'},
                          {nombre : 'Aspirado de interiores'},
                          {nombre : 'Pulido'},
                          {nombre : 'Encerado'},
                        ]
        }
    ];
})




.controller('IncioCtrl', function($scope, $ionicPopup, $state) {
    // $ionicPopup.alert({
    //     title: '¡Bienvenido!',
    //     content: 'Desde nuestra aplicación podrás solicitar cualquiera de nuestros servicios, así como ver un historial de tus solicitudes.'
    // });

    $scope.start_navigation = function(tipo){
      console.log('entro');
        if (tipo == 'historial') {
            $state.go('historial');
        }else if (tipo == 'solicitud') {
            console.log('solicitud');
            $state.go('mapa_menu');
        }
    }
})

.controller('DashCtrl', function($scope) {})

.controller('ChatsCtrl', function($scope, Chats) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.chats = Chats.all();
  $scope.remove = function(chat) {
    Chats.remove(chat);
  };
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});

 // // esto es un ejemplo

  // document.addEventListener("deviceready", function () {

  //   console.log('device ready');

  //     var options = {
  //       quality: 50,
  //       destinationType: Camera.DestinationType.DATA_URL,
  //       sourceType: Camera.PictureSourceType.CAMERA,
  //       allowEdit: true,
  //       encodingType: Camera.EncodingType.JPEG,
  //       targetWidth: 100,
  //       targetHeight: 100,
  //       popoverOptions: CameraPopoverOptions,
  //       saveToPhotoAlbum: false,
  //     correctOrientation:true
  //     };

  //     $cordovaCamera.getPicture(options).then(function(imageData) {
  //       var image = document.getElementById('myImage');
  //       image.src = "data:image/jpeg;base64," + imageData;
  //     }, function(err) {
  //       // error
  //     });

  //   }, false);
