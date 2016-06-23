var GLOBAL_IP = '192.168.1.105';
// var GLOBAL_HOST = 'http://192.168.1.108:3000';
var GLOBAL_HOST = 'https://rocky-citadel-16422.herokuapp.com';

angular.module('lavadoApp.controllers', [])

.directive("limitTo", [function() {
    return {
        restrict: "A",
        link: function(scope, elem, attrs) {
            var limit = parseInt(attrs.limitTo);
            angular.element(elem).on("keypress", function(e) {
                if (this.value.length == limit) e.preventDefault();
            });
        }
    }
}])

.controller('LoginCtrl', function($ionicPlatform, $scope, $cordovaOauth, $http, $ionicPopup, $state, $cordovaNativeStorage, $ionicLoading) {
    document.addEventListener("backbutton", onBackKeyDown, false);
    function onBackKeyDown(e) {
        e.preventDefault();
    }
    $ionicPlatform.ready(function() {
        $scope.login = {};
        $scope.login.sesion_iniciada = false;
        // $cordovaNativeStorage.setItem("facebook-id", '123').then(function (value) {
        //   console.log('facebook-id guardada');
        // }, function (error) {
        //   console.log('error: facebook-id');
        // });

        $cordovaNativeStorage.getItem('facebook-id').then(function (value) {
          $scope.login.sesion_iniciada = true;
        }, function (error) {
          $scope.login.sesion_iniciada = false;
          console.log('error');
          console.log(error);
        });

        $scope.facebookLogin = function() {
            $cordovaOauth.facebook("925550167564100", ["email", "public_profile"], {redirect_uri : 'http://localhost:8100/callback'}).then(function(result){
                $scope.checkData(result.access_token);
            },  function(error){
                    alert("Error: " + error);
            });

        }

        $scope.checkData = function(access_token) {
            $ionicLoading.show({
                template: 'Iniciando Sesión...'
            });
            $http.get("https://graph.facebook.com/v2.2/me", {params: {access_token: access_token, fields: "id, email, name,gender,location,picture", format: "json" }}).then(function(result) {
                var objParams = {
                    uid         :   result.data.id,
                    nombre      :   result.data.name,
                    gender      :   result.data.gender,
                    picture     :   result.data.picture,
                    picture_url :   result.data.picture.data.url,
                    mail        :   result.data.email ? result.data.email : result.data.id + '@eonopenpay.mx'
                }
                

                $http.post(GLOBAL_HOST + '/usuarios/authenticate', {conditions : objParams} ).success(function(response) {

                    if (response.success) {

                        $cordovaNativeStorage.setItem("facebook-id", objParams.uid).then(function (value) {

                            $cordovaNativeStorage.setItem("facebook-nombre", objParams.nombre).then(function (value) {

                                $cordovaNativeStorage.setItem("picture_url", objParams.picture_url).then(function (value) {

                                    $cordovaNativeStorage.setItem("openpay_customerId", response.customer_id).then(function (value) {
                                            
                                        $cordovaNativeStorage.setItem("user_id", response.user_id).then(function (value) {
                                            $ionicLoading.hide();
                                            $scope.login.sesion_iniciada = true;
                                            $scope.go_inicio();
                                        }, function (error) {
                                            alert('Error al autentificar: user_id');
                                        });

                                    }, function (error) {
                                        alert('Error al autentificar: openpay_customerId');
                                    });

                                }, function (error) {
                                    alert('Error al autentificar: picture_url');
                                });
                                
                            }, function (error) {
                                alert('Error al autentificar: facebook-nombre');
                            });
                        }, function (error) {
                            alert('Error al autentificar: facebook-id');
                        });

                    } else {
                        $ionicLoading.hide();
                        $ionicPopup.alert({
                            title: 'Error de autentificación',
                            content: 'Intente de nuevo porfavor'
                        });

                    }
                });

            }, function(error) {
                alert("Error: " + error);
            });
        }

        $scope.go_inicio = function() {
            $state.go('inicio');
        }

    })

})

.controller('MapMenuCtrl', function($scope, $cordovaGeolocation, $ionicPopup, $ionicLoading, $state, Pago, $rootScope) {

  var directionsService = new google.maps.DirectionsService();
  var directionsDisplay = new google.maps.DirectionsRenderer();
  $scope.init = function() {
      
      $scope.s = {};
      $scope.s.reload = Pago.realod;
      $scope.s.address = '';
      $scope.s.marker = false;
      $scope.map = {};

      var options = {timeout: 10000, enableHighAccuracy: true};

      $scope.map = new GeolocMapa({ mapPanel : "map", editable: true, doInfoWindow : false, clickable:true});
      $scope.map.init();
      $scope.map.addMark(1, 24.029357, -104.653253, {icon : 'http://www.tourismcanmore.com/site/images/map-icons/accommodations-pin.png'});
      $scope.map.centerMark(1);
      $scope.map.setZoom(13);

      var end = new google.maps.LatLng(24.029357, -104.653253);
      var start;


      google.maps.event.addListener( $scope.map.getDrawingManager(), 'markercomplete', function (mark) {

          $scope.map.centerMark(0);
          $scope.map.setZoom(13);
          $scope.s.marker = true;

          start = new google.maps.LatLng(mark.position.lat(), mark.position.lng());

          directionsDisplay.setMap($scope.map.getMap());
          $scope.direction_service(start, end);
      });


      document.addEventListener("deviceready", function () {
          $cordovaGeolocation.getCurrentPosition(options).then(function(position){

              $scope.map.addMark(0, position.coords.latitude, position.coords.longitude);
              $scope.map.centerMark(0);
              $scope.map.setZoom(13);
              $scope.s.marker = true;
              start = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

              directionsDisplay.setMap($scope.map.getMap());

              $scope.direction_service(start, end);          
          }, function(error){
            console.log("Could not get location", error);
          });
      });
  }


  $scope.init();

  $rootScope.$on('$stateChangeSuccess', function(e, toState, toParams, fromState, fromParams) {

      console.log('joge', toState);

      var state = toState.name;

      if (toState.name == 'mapa_menu') {
          console.log('mapa menu');
          if (Pago.reload) {
              console.log('reload');
              google.maps.event.trigger($scope.map,'resize')
              Pago.reload = false;
              // $scope.init();
          }else {
              console.log('no reload');
              Pago.reload = true;
          }
      };
  });
 

  $scope.busca_direccion = function(){

    if ($scope.s.address != '') {
      $ionicLoading.show({
        template: 'Buscando...'
      });

      $scope.map.searchMark($scope.s.address, function(location) {
          $scope.map.centerMark(0);
          $scope.map.setZoom(13);
          $scope.s.marker = true;

          directionsDisplay.setMap($scope.map.getMap());
          start = new google.maps.LatLng(location.lat(), location.lng());

          $scope.direction_service(start, end); 
          

          $ionicLoading.hide();
        
      });
          $ionicLoading.hide();

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

  $scope.direction_service = function(start, end) {
      directionsService.route({
          origin: start,
          destination: end,
          travelMode: google.maps.TravelMode.DRIVING
      }, function(response, status) {
          if (status === google.maps.DirectionsStatus.OK) {
              directionsDisplay.setDirections(response);
          } else {
              alert('Fallo al buscar ruta: ' + status);
          }
      });
  }

  $scope.getListado = function(tipo){

      if ($scope.s.marker) {

          var arrMark = $scope.map.getMark(0);
          Pago.direccion = { lat: arrMark.position.lat(), lng: arrMark.position.lng()}
          
          if (tipo == 'servicios') {
            $state.go('servicios', {}, {reload:true, inherit: false, notify: true});
          }else if (tipo == 'paquetes') {
            $state.go('paquetes', {}, {reload:true, inherit: false, notify: true});
          }
      }else{
          $ionicPopup.alert({
            title: 'Error',
            content: 'Seleccione una dirección en el mapa para continuar'
          });
      }
  }

 
})




.controller('ServiciosCtrl', function($scope, $http, $ionicLoading, lodash, Pago, $state) {

  var _ = lodash;
  $scope.ser = {};
  $scope.ser.subtotal = 0;
  $scope.servicios = [];
  $scope.ser.a_pagar = [];

  $ionicLoading.show({
          template: 'Cargando servicios...'
        });

  $http.post(GLOBAL_HOST + '/servicios/get_active', {} ).success(function(response) {
      $scope.servicios = response.items;
      $ionicLoading.hide();
  });

  $scope.suma_precios = function(serv){
      if (serv.checked) {
          $scope.ser.subtotal += serv.precio;
          $scope.maneja_arreglos(serv, true);
      }else{
          $scope.ser.subtotal -= serv.precio;
          $scope.maneja_arreglos(serv, false);
      }
  }

  $scope.maneja_arreglos = function(serv, agregar) {

    if (agregar) {
        $scope.ser.a_pagar.push(serv);
    }else{
        var evens = _.remove($scope.ser.a_pagar, function(n) {
            return n._id == serv._id;
        });
    }
    
  }

  $scope.pagar_servicios = function(){
      Pago.tipo_compra = 'servicio';
      Pago.a_pagar = $scope.ser.a_pagar;
      $state.go('confirma_pago', {}, {reload:true, inherit: false, notify: true});
  }


})
.controller('PaquetesCtrl', function($scope, $ionicLoading, $http, Pago, $state) {

    $scope.paq = {};
    $scope.paquetes = [];
    $scope.paq.a_pagar = [];

    $ionicLoading.show({
      template: 'Cargando paquetes...'
    });


    $http.post(GLOBAL_HOST + '/paquetes/get_list', {} ).success(function(response) {
        console.log(response.items);
        $scope.paquetes = response.items;
        $ionicLoading.hide();
    });



    $scope.maneja_arreglos = function(paqu, agregar) {

      if (agregar) {
          $scope.paq.a_pagar.push(paqu);
      }else{
          var evens = _.remove($scope.paq.a_pagar, function(n) {
              return n._id == paqu._id;
          });
      }
      
    }

    $scope.pagar_paquetes = function(paqu){
        $scope.paq.a_pagar.push(paqu);
        Pago.a_pagar = $scope.paq.a_pagar;
        Pago.tipo_compra = 'paquete';
        $state.go('confirma_pago', {}, {reload:true, inherit: false, notify: true});
    }
})




.controller('IncioCtrl', function($scope, $ionicPopup, $state, $cordovaCamera, $ionicPlatform) {
    $ionicPopup.alert({
        title: '¡Bienvenido!',
        content: 'Desde nuestra aplicación podrás solicitar cualquiera de nuestros servicios, así como ver un historial de tus solicitudes.'
    });

    $scope.start_navigation = function(tipo){
      console.log('entro');
        if (tipo == 'historial') {
            $state.go('historial', {}, {reload:true, inherit: false, notify: true});
        }else if (tipo == 'solicitud') {
            console.log('solicitud');
            $state.go('mapa_menu', {}, {reload : true, inherit: false, notify: true});
        }else if (tipo == 'comentarios') {
            console.log('comentarios');
            $state.go('comentarios', {}, {reload : true, inherit: false, notify: true});
        }
    }

})

.controller('HistorialCtrl', function($scope, $ionicLoading, $cordovaNativeStorage, $http, $ionicModal, $ionicPopup, $cordovaCamera) {

    $scope.hs = {};
    $scope.hs.historial = [];
    $scope.hs.antes = '';
    $scope.hs.despues = '';
    $scope.hs.image_src = '';
    $scope.hs.despues_src = '';
    $scope.hs.image = '';
    $scope.hs.user_id = '';
    $scope.hs.venta_id = '';

    $ionicLoading.show({
        template : 'Cargando historial...'
    });

    $scope.getList = function() {
        $http.post(GLOBAL_HOST + '/ventas/user_sales', {conditions : { usuario_id : $scope.hs.user_id, date : 0}}).success(function(response){
            $ionicLoading.hide();
            $scope.hs.historial = response.items;
        }); 
    }

    $cordovaNativeStorage.getItem("user_id").then(function (value) {
        // $scope.hs.user_id = '576ab8bebc78d44b08e81976';
        $scope.hs.user_id = value;
        $scope.getList();
    }, function (error) {
        $ionicLoading.hide();
        alert('No tienes sesión iniciada: user_id');
    });


    $scope.handling_image = function(venta_id, despues) {
        $ionicLoading.show({
            template : 'Espere por favor...'
        });
        if (despues == undefined) {
            $scope.hs.venta_id = venta_id;
            $scope.tomar_foto();
        }else {
            $ionicPopup.alert({
                title : 'Error',
                content : 'El tiempo para subir la imagen y obtener el descuento correspondiente ha expirado.'
            });
        }
    }

    $scope.tomar_foto = function() {
        var options = {
          quality: 80,
          destinationType: Camera.DestinationType.DATA_URL, // DATA_URL // FILE_URI
          sourceType: Camera.PictureSourceType.CAMERA,
          allowEdit: true,
          encodingType: Camera.EncodingType.JPEG,
          targetWidth: 300,
          targetHeight: 300,
          popoverOptions: CameraPopoverOptions,
          saveToPhotoAlbum: true,
        correctOrientation:true
        };
        $ionicLoading.hide();
        $cordovaCamera.getPicture(options).then(function(imageData) {
          var image = document.getElementById('myImage');
          var image_clean = imageData.replace(/\"/g, '');
          $scope.hs.despues_src = "data:image/jpeg;base64," + imageData;
          $scope.hs.image = imageData;

          $scope.subir_imagen();
        }, function(err) {
            $ionicPopup.alert({
                title: 'Error al subir la imagen'
            });
        });
    }

    $scope.subir_imagen = function() {
        $ionicLoading.show({
            template : 'Guardando Imagen...'
        });

        $cordovaNativeStorage.getItem('facebook-id').then(function (value) {
            var timestamp = new Date().getTime();
            var objSend = {
                conditions : {
                    key : 'a_' + value + '_' + timestamp,
                    base : $scope.hs.image
                }
            };

            $cordovaNativeStorage.getItem('user_id').then(function (val) {

                $http.post(GLOBAL_HOST + '/imagenes/guardar_imagen', objSend).success(function(response){

                    if (response.success) {
                        $scope.update_despues(val, response.url);

                    } else {
                        $ionicLoading.hide();
                        alert('Error al subir la imagen: ' + response.error);
                    }

                }).failure(function(err){
                    $ionicLoading.hide();
                    alert('Error al subir imagen' + err);
                });

            }, function (error) {
                $ionicLoading.hide();
                alert('No tienes Sesión iniciada');
            });
            
        }, function (error) {
            $ionicLoading.hide();
            alert('No tienes Sesión iniciada');
        });
    }

    $scope.update_despues = function(user_id, despues_url) {
        var objSend = {
            conditions : {
                id : $scope.hs.venta_id,
                despues : despues_url,
                user_id : user_id
            }
        };

        $http.post(GLOBAL_HOST + '/ventas/update_despues', objSend).success(function(response){
            $ionicLoading.hide();
            if (response.success) {
                $ionicLoading.show({
                    template : 'Cargando historial...'
                });
                $scope.getList();

            } else {
                $ionicLoading.hide();
                alert('Error al subir la imagen(DESPUES): ' + (response.error));
            }

        }).failure(function(err){
            $ionicLoading.hide();
            alert('Error al actualizar imagen' + err);
        });
    }

    // ******************************************************
    // ******************************************************
    // ******************************************************

    $ionicModal.fromTemplateUrl('image-modal.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
      console.log('entro');
        $scope.hs.modal = modal;
    });

    $scope.openModal = function() {
      $scope.hs.modal.show();
    };

    $scope.closeModal = function() {
      $scope.hs.modal.hide();
    };

    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
      $scope.hs.modal.remove();
    });
    // Execute action on hide modal
    $scope.$on('modal.hide', function() {
      // Execute action
    });
    // Execute action on remove modal
    $scope.$on('modal.removed', function() {
      // Execute action
    });
    $scope.$on('modal.shown', function() {
      console.log('Modal is shown!');
    });

    $scope.show_picture = function(image_src) {
      $scope.hs.image_src = image_src;
      $scope.openModal();
    }

})

.controller('ConfirmaPagoCtrl', function($scope, Pago, $timeout, $cordovaNativeStorage, $http, $cordovaCamera, $ionicLoading, $ionicPopup, lodash, $state) {
    
    var _ = lodash;
    $scope.pago = {};
    $scope.pago.tarjetas = [];
    $scope.pago.discount = false;
    $scope.pago.tipo_pago = 'tarjeta';
    $scope.pago.a_pagar = Pago.a_pagar;
    $scope.pago.total = 0;
    $scope.data = {};
    $scope.data.cliente_id = '';
    $scope.data.usuario = '';
    $scope.data.card = '';
    $scope.data.exp_y = '';
    $scope.data.exp_m = '';
    $scope.data.ccv = '';
    $scope.data.deviceSessionId = '';
    $scope.data.tokenId = '';
    $scope.data.tipo_compra = Pago.tipo_compra;
    $scope.data.phone = '';
    $scope.pago.image_src = '';
    $scope.pago.image = '';
    $scope.data.antes = '';
    $scope.data.descuento = false;

    $ionicLoading.show({
        template : 'Cargando...'
    });

    $cordovaNativeStorage.getItem('openpay_customerId').then(function (value) {
        // $ionicLoading.show({
        //     template: 'Cargando tarjetas registradas...'
        // });

        // función para traer el listado de tarjetas y si tiene o no descuento el usuario
        $http.post(GLOBAL_HOST + '/ventas/get_cards', {conditions : { cliente_id : value}}).success(function(response){
            $ionicLoading.hide();
            $scope.pago.tarjetas = response.items;
        }); 

    }, function (error) {
        // $ionicLoading.hide();
        alert('No tienes tu sesión iniciada');
    });

    $cordovaNativeStorage.getItem('user_id').then(function (value) {

        // función para traer el listado de tarjetas y si tiene o no descuento el usuario
        $http.post(GLOBAL_HOST + '/ventas/descuento', {conditions : { usuario_id : value}}).success(function(response){
            $scope.data.descuento = response.items;
            $ionicLoading.hide();
        }); 

    }, function (error) {
        $ionicLoading.hide();
        alert('No tienes tu sesión iniciada');
    });


    $timeout(function(){
        $scope.data.deviceSessionId = OpenPay.deviceData.setup("payment-form", "deviceIdHiddenFieldName");

        OpenPay.setId('moeuamt4tauwynsihn1u');
        OpenPay.setApiKey('pk_58791231436b4af7b317204cd662defa');
        OpenPay.setSandboxMode(true);
    });

    $scope.pago.procesar_pago = function(e) {
        e.preventDefault();

        $ionicPopup.confirm({
           title: '¿Deseas continuar?',
           template: 'Verifica que tus datos sean los correctos'
        }).then(function(res) {
            if(res) {
                if ($scope.data.phone == '') {
                    $ionicPopup.alert({
                        title: 'El campo de telefono no puede ir vacio'
                    });
                }else{

                    $ionicLoading.show({
                        template: 'Registrando Pago...'
                    });

                    var objVerifica = $scope.verifica_descuento();

                    if (!objVerifica.pass) {
                        $ionicLoading.hide();
                        $ionicPopup.alert({
                            title: 'No ha subido ninguna imagen',
                            content: 'Si desea continuar sin subir imagen, favor de desmarcar el campo de descuento.'
                        });
                    }else {
                        $("#pay-button").prop( "disabled", true);

                        if (objVerifica.img) {
                            $scope.subir_imagen();
                        } else {
                            OpenPay.token.extractFormAndCreate('payment-form', $scope.success_callbak, $scope.error_callbak);
                        }
                    }
                }

            } else {
                console.log('You are not sure');
            }
        });

    }

    $scope.verifica_descuento = function() {
        console.log($scope.pago.discount);
        if ($scope.pago.discount) {
            if ($scope.pago.image_src != '') {
                return { pass : true, img : true};
            }else {
                return { pass : false};
            }
        }else {
            return { pass : true, img : false};
        }
    }

    $scope.subir_imagen = function(id) {

        $cordovaNativeStorage.getItem('facebook-id').then(function (value) {
            var timestamp = new Date().getTime();
            var objSend = {
                conditions : {
                    key : 'a_' + value + '_' + timestamp,
                    base : $scope.pago.image
                }
            };
            $http.post(GLOBAL_HOST + '/imagenes/guardar_imagen', objSend).success(function(response){

                if (response.success) {
                    $scope.data.antes = response.url;

                    if ($scope.pago.tipo_pago == 'tarjeta') {
                        if (id == undefined) { // es que es registro de nueva tarjeta
                            OpenPay.token.extractFormAndCreate('payment-form', $scope.success_callbak, $scope.error_callbak);
                        }else { // es con tarjeta existente
                            $scope.submit(id);
                        }
                    }else if ($scope.pago.tipo_pago == 'efectivo') {
                        $scope.submit();
                    }

                } else {
                    $ionicLoading.hide();
                    alert('Error al subir la imagen: ' + response.error);
                }

            }).failure(function(err){
                $ionicLoading.hide();
                alert('Error al subir imagen' + err);
            });
            
        }, function (error) {
            alert('No tienes Sesión iniciada')
        });
    }

    $scope.pago.procesar_existente = function(id, card_number) {

        $ionicPopup.confirm({
           title: '¿Deseas continuar?',
           template: '¿Deseas pagar con tu trajeta ' + card_number + '?'
        }).then(function(res) {
            if(res) {
                if ($scope.data.phone == '') {
                    $ionicPopup.alert({
                        title: 'El campo de telefono no puede ir vacio'
                    });
                }else{
                    
                    $ionicLoading.show({
                        template: 'Registrando Pago...'
                    });

                    var objVerifica = $scope.verifica_descuento();

                    if (!objVerifica.pass) {
                        $ionicLoading.hide();
                        $ionicPopup.alert({
                            title: 'No ha subido ninguna imagen',
                            content: 'Si desea continuar sin subir imagen, favor de desmarcar el campo de descuento.'
                        });
                    }else {

                        if (objVerifica.img) {
                            $scope.subir_imagen(id);
                        } else {
                            $scope.submit(id);
                        }
                    }
                }
            } else {
                console.log('You are not sure');
            }
        });

    }

    $scope.success_callbak = function(response) {
        var token_id = response.data.id;
        $scope.data.tokenId = token_id;
        $scope.data.total = $scope.pago.total;
        console.log(token_id);
        $('#token_id').val(token_id);
        $scope.submit();
    };

    $scope.error_callbak = function(response) {
        $ionicLoading.hide();
        var desc = response.data.description != undefined ?
        response.data.description : response.message;
        alert("ERROR [" + response.status + "] " + desc);
        $("#pay-button").prop("disabled", false);
    };

    $scope.submit = function(id) {

        // console.log($scope.data);
        if ($scope.pago.tipo_pago == 'tarjeta') {

            $cordovaNativeStorage.getItem('user_id').then(function (val) {

                var user_id = val;

                $cordovaNativeStorage.getItem('openpay_customerId').then(function (value) {
                    $scope.data.cliente_id = value;
                    var objData = $scope.process_list($scope.pago.a_pagar);
                    var objConditions = {
                        conditions : {
                            tipo : 'tarjeta',
                            tarjeta : {
                                id : '',
                                device_session : $scope.data.deviceSessionId
                            },
                            cargo : $scope.pago.total,
                            cliente : $scope.data.cliente_id,
                            tipo_compra : $scope.data.tipo_compra,
                            compra : objData.compra_ids,
                            descripcion : objData.descripcion_nombre,
                            antes : $scope.data.antes,
                            direccion : Pago.direccion,
                            user_id : user_id,
                            telefono : $scope.data.phone,
                            descuento : $scope.data.descuento
                        }
                    }

                    if (id == undefined) {
                        $http.post(GLOBAL_HOST + '/ventas/new_card', {conditions:$scope.data}).success(function(response){

                            objConditions.conditions.tarjeta.id = response.card_id;

                            $scope.charge(objConditions);

                        }).failure(function(err){
                            $ionicLoading.hide();
                            alert('Error al generar el cargo(CARD)' + err);
                        });

                    } else {
                        objConditions.conditions.tarjeta.id = id;
                        $scope.charge(objConditions);
                    }
                    
                    
                }, function (error) {
                  $ionicLoading.hide();
                  alert('No tienes tu sesión iniciada');
                });

            }, function (error) {
                $ionicLoading.hide();
                alert('No tienes tu sesión iniciada');
            });
        }else if ($scope.pago.tipo_pago == 'efectivo') {

            $cordovaNativeStorage.getItem('user_id').then(function (value) {

                var user_id = value;
                var objData = $scope.process_list($scope.pago.a_pagar);


                var objConditions = {
                    conditions : {
                        tipo : 'efectivo',
                        cargo : $scope.pago.total,
                        tipo_compra : $scope.data.tipo_compra,
                        compra : objData.compra_ids,
                        descripcion : objData.descripcion_nombre,
                        antes : $scope.data.antes,
                        user_id : user_id,
                        direccion : Pago.direccion,
                        telefono : $scope.data.phone,
                        descuento : $scope.data.descuento
                    }
                }


                $scope.charge(objConditions);
            
            }, function (error) {
                $ionicLoading.hide();
                alert('No tienes tu sesión iniciada');
            });
        }

    }

    $scope.pago_efectivo  = function() {

        $ionicPopup.confirm({
           title: '¿Deseas continuar?',
           template: 'Verifica que tus datos sean los correctos'
        }).then(function(res) {
            if(res) {
                if ($scope.data.phone == '') {
                    $ionicPopup.alert({
                        title: 'El campo de telefono no puede ir vacio'
                    });
                }else{
                
                    $ionicLoading.show({
                        template: 'Registrando Pago...'
                    });

                    var objVerifica = $scope.verifica_descuento();

                    if (!objVerifica.pass) {
                        $ionicLoading.hide();
                        $ionicPopup.alert({
                            title: 'No ha subido ninguna imagen',
                            content: 'Si desea continuar sin subir imagen, favor de desmarcar el campo de descuento.'
                        });
                    }else {

                        if (objVerifica.img) {
                            $scope.subir_imagen();
                        } else {
                            $scope.submit();
                        }
                    }
                }
            } else {
                console.log('You are not sure');
            }
        });
    }

    $scope.process_list = function(a_pagar) {

        var objReturn = {};
        objReturn.compra_ids = [];
        objReturn.descripcion_nombre = '';

        if (a_pagar.length > 0) {
            _(a_pagar).forEach(function(value) {
                objReturn.compra_ids.push(value._id);
                if (objReturn.descripcion_nombre == '') {
                    objReturn.descripcion_nombre = value.nombre;
                }else {
                    objReturn.descripcion_nombre = objReturn.descripcion_nombre + ' | ' + value.nombre;
                }
            });

            return objReturn;
        }else {
            return objReturn;
        }
    }

    $scope.charge = function(objConditions) {
        $http.post(GLOBAL_HOST + '/ventas/charge', objConditions).success(function(response){
          $ionicLoading.hide();

          if (response.success) {
              $ionicPopup.alert({
                  title: '¡Éxito!',
                  content: 'Registro generado correctamente'
              });

              Pago.venta_id = response.venta_id;
              $state.go('rating', {}, {reload:true, inherit: false, notify: true});
          }else {
              $ionicPopup.alert({
                  title: 'Error',
                  content: 'Error al generar cargo'
              });

              $("#pay-button").prop( "disabled", false);
          }


        }).failure(function(err){
          $ionicLoading.hide();
          $("#pay-button").prop( "disabled", false);
          alert('Error al generar el cargo(CHARGE)' + err);
        }); 
    }

    $scope.tomar_foto = function() {
        var options = {
          quality: 80,
          destinationType: Camera.DestinationType.DATA_URL, // DATA_URL // FILE_URI
          sourceType: Camera.PictureSourceType.CAMERA,
          allowEdit: true,
          encodingType: Camera.EncodingType.JPEG,
          targetWidth: 300,
          targetHeight: 300,
          popoverOptions: CameraPopoverOptions,
          saveToPhotoAlbum: true,
        correctOrientation:true
        };

        $cordovaCamera.getPicture(options).then(function(imageData) {
          var image = document.getElementById('myImage');
          var image_clean = imageData.replace(/\"/g, '');
          $scope.pago.image_src = "data:image/jpeg;base64," + imageData;
          $scope.pago.image = imageData;
        }, function(err) {
            $ionicPopup.alert({
                title: 'Error al subir la imagen'
            });
        });
    }

})

.controller('RatingCtrl', function($scope, $http, $ionicLoading, $ionicPopup, Pago, $state) {

    $scope.rat = {};
    $scope.rat.rating = 1;
    $scope.rat.max = 5;
    $scope.rat.comment = '';
    $scope.rat.venta_id = Pago.venta_id;
    

    $scope.omitir = function() {
        $state.go('inicio');
    }

    $scope.comentar = function() {
        
        if ($scope.rat.comment != '') {

            $ionicLoading.show({
                template : 'Registrando Comentario'
            });

            var objSend = {
                conditions : {
                    id : $scope.rat.venta_id,
                    comentario : $scope.rat.comment,
                    calificacion : $scope.rat.rating
                }
            };

            $http.post(GLOBAL_HOST + '/ventas/registrar_comentario', objSend).success(function(response){
                $ionicLoading.hide();

                if (response.success) {
                    $ionicPopup.alert({
                        title: 'Éxito',
                        content: '¡Gracias por tus comentarios!'
                    });

                    $scope.rat.rating = 1;
                    $scope.rat.comment = '';
                    Pago.venta_id = '';

                    $state.go('inicio');
                }else {
                    $ionicPopup.alert({
                        title: 'Error',
                        content: 'Error al generar comentario'
                    });

                }

            }).failure(function(err){
                $ionicLoading.hide();
                alert('Error al registrar_comentario' + err);
            });

        } else {
            $ionicPopup.alert({
                title: 'Aviso',
                content: 'Debe llenar el campo de comentario para poder continuar'
            });
        }
    }
})

.controller('ComentariosCtrl', function($scope, $http, $ionicLoading, $ionicPopup) {
    
    $scope.com = {};
    $scope.com.items = [];

    $ionicLoading.show({
        template : 'Cargando comentarios'
    });

    $http.post(GLOBAL_HOST + '/ventas/user_sales', { conditions : {}}).success(function(response){
        $ionicLoading.hide();

        if (response.success) {
            $scope.com.items = response.items;
        }else {
            $ionicPopup.alert({
                title: 'Error',
                content: 'Error al traer comentarios'
            });

        }

    });
})





.controller('DashCtrl', function($scope) {})

.controller('ChatsCtrl', function($scope, Chats) {
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
