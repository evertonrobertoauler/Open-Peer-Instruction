(function () {
  'use strict';

  angular
    .module('openpiApp.classrooms')
    .controller('ClassroomsController', ClassroomsController);

  /** @ngInject */
  function ClassroomsController($scope, $stateParams, $state, Classrooms) {

    if ($stateParams._id) {
      $scope.classroom = Classrooms.get({id: $stateParams._id});
    } else {
      $scope.classroom = new Classrooms();
    }

    $scope.save = function () {
      var error = function (e) {
        $scope.iForm.setErrors(e.data);
      };
      var success = function (c) {
        $state.transitionTo('classrooms.detail', c);
      };

      if (!$scope.classroom._id) {
        $scope.classroom.$insert(success, error);
      } else {
        $scope.classroom.$update(success, error);
      }
    };
  }
})();
