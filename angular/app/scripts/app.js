'use strict';

angular
  .module('openpiApp', [
    'ngLocale',
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ui.bootstrap',
    'ui.router',
    'googlechart',
  ])
  .config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('main', {
        url: '/',
        templateUrl: '/views/main.html',
        controller: 'MainCtrl'
      })
      .state('login', {
        url: '/login',
        templateUrl: '/views/login.html',
        controller: 'AuthCtrl'
      })
      .state('logout', {
        url: '/logout',
        controller: function($scope, Auth) {
          Auth.logout();
          $scope.updateMenu();
        }
      })
      .state('token', {
        url: '/token/:refresh',
        controller: 'AuthCtrl'
      })
      .state('signup', {
        url: '/signup',
        templateUrl: '/views/signup.html',
        controller: 'SignupCtrl'
      })
      .state('profile', {
        url: '/profile',
        templateUrl: '/views/profile.html',
        controller: 'ProfileCtrl',
      })
      .state('classrooms', {
        abstract: true,
        url: '/classrooms',
        template: '<ui-view/>',
      })
      .state('classrooms.list', {
        url: '',
        controller: 'ClassroomsCtrl',
        templateUrl: '/views/classrooms/list.html',
      })
      .state('classrooms.edit', {
        url: '/form/:id',
        controller: 'ClassroomsCtrl',
        templateUrl: '/views/classrooms/form.html',
      })
      .state('classrooms.create', {
        url: '/form',
        controller: 'ClassroomsCtrl',
        templateUrl: '/views/classrooms/form.html',
      })
      .state('classrooms.detail', {
        url: '/:id',
        controller: 'ClassroomsCtrl',
        templateUrl: '/views/classrooms/detail.html',
      })
      .state('questions', {
        abstract: true,
        url: '/questions',
        template: '<ui-view/>',
      })
      .state('questions.list', {
        url: '',
        controller: 'QuestionsCtrl',
        templateUrl: '/views/questions/list.html',
      })
      .state('questions.edit', {
        url: '/form/:id',
        controller: 'QuestionsCtrl',
        templateUrl: '/views/questions/form.html',
      })
      .state('questions.create', {
        url: '/form',
        controller: 'QuestionsCtrl',
        templateUrl: '/views/questions/form.html',
      })
      .state('questions.detail', {
        url: '/:id',
        controller: 'QuestionsCtrl',
        templateUrl: '/views/questions/detail.html',
      })
      .state('knowledge-tests', {
        abstract: true,
        url: '/knowledge/tests',
        template: '<ui-view/>',
      })
      .state('knowledge-tests.list', {
        url: '',
        controller: 'KnowledgeTestsCtrl',
        templateUrl: '/views/knowledge-tests/list.html',
      })
      .state('knowledge-tests.edit', {
        url: '/form/:id',
        controller: 'KnowledgeTestsCtrl',
        templateUrl: '/views/knowledge-tests/edit.html',
      })
      .state('knowledge-tests.create', {
        url: '/form',
        controller: 'KnowledgeTestsCtrl',
        templateUrl: '/views/knowledge-tests/create.html',
      })
      .state('knowledge-tests.detail', {
        url: '/:id',
        templateUrl: '/views/knowledge-tests/detail.html',
      });
  })
  .value('SOCKET_URL', 'http://127.0.0.1:3001/')
  .value('AUTH_URL', 'http://127.0.0.1:3000/auth/')
  .value('API_URL', 'http://127.0.0.1:3000/api/v1/')
  .config(function($httpProvider) {

    $httpProvider.interceptors.push(function($q, $location, $cookieStore) {
      return {
        responseError: function(rejection) {
          switch (rejection.status) {
            case 401:
              var auth = $cookieStore.get('auth') && JSON.parse($cookieStore.get('auth'));

              if (auth && auth.token.refreshToken) {
                $location.path('/token/' + auth.token.refreshToken);
              } else {
                $cookieStore.remove('auth');
                $location.path('/login');
              }

              break;
          }

          return $q.reject(rejection);
        }
      };
    });
  });