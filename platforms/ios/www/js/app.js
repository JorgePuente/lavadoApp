// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js

angular.module('lavadoApp', ['ionic', 'ionic.rating', 'lavadoApp.controllers', 'lavadoApp.services', 'ngCordova', 'ngCordovaOauth', 'ngCordova.plugins.nativeStorage', 'ngLodash', 'ngRoute'])

.run(function($ionicPlatform, $ionicPopup, $rootScope, Pago, $route) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

  });
})

.config(function($stateProvider, $urlRouterProvider, $cordovaFacebookProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider


  .state('login', {
    url : '/login',
    templateUrl: 'templates/login.html',
    controller: 'LoginCtrl'
      
  })

  .state('inicio', {
    url : '/inicio',
    templateUrl: 'templates/inicio.html',
    controller: 'IncioCtrl'
      
  })

  .state('historial', {
    url : '/historial',
    templateUrl: 'templates/historial.html',
    controller: 'HistorialCtrl'
      
  })

  .state('mapa_menu', {
    url : '/map',
    templateUrl: 'templates/mapa_menu.html',
    controller: 'MapMenuCtrl'
      
  })

  .state('servicios', {
    url : '/servicios',
    templateUrl: 'templates/servicios.html',
    controller: 'ServiciosCtrl'
      
  })

  .state('paquetes', {
    url : '/paquetes',
    templateUrl: 'templates/paquetes.html',
    controller: 'PaquetesCtrl'
      
  })

  .state('confirma_pago', {
    url : '/confirma_pago',
    templateUrl: 'templates/confirma_pago.html',
    controller: 'ConfirmaPagoCtrl'
      
  })

  .state('rating', {
    url : '/rating',
    templateUrl: 'templates/rating.html',
    controller: 'RatingCtrl'
      
  })

  .state('comentarios', {
    url : '/comentarios',
    templateUrl: 'templates/comentarios.html',
    controller: 'ComentariosCtrl'
      
  })


  // setup an abstract state for the tabs directive
    .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html'
  })

  // Each tab has its own nav history stack:

  .state('tab.dash', {
    url: '/dash',
    views: {
      'tab-dash': {
        templateUrl: 'templates/tab-dash.html',
        controller: 'DashCtrl'
      }
    }
  })

  .state('tab.chats', {
      url: '/chats',
      views: {
        'tab-chats': {
          templateUrl: 'templates/tab-chats.html',
          controller: 'ChatsCtrl'
        }
      }
    })
    .state('tab.chat-detail', {
      url: '/chats/:chatId',
      views: {
        'tab-chats': {
          templateUrl: 'templates/chat-detail.html',
          controller: 'ChatDetailCtrl'
        }
      }
    })

  .state('tab.account', {
    url: '/account',
    views: {
      'tab-account': {
        templateUrl: 'templates/tab-account.html',
        controller: 'AccountCtrl'
      }
    }
  });



  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');

});
