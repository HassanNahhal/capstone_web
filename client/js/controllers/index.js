'use strict';

 angular
  .module('app')
  .controller('IndexController', ['$scope', '$state', 'IntroHeaderService',
   function($scope, $state, IntroHeaderService) {
      IntroHeaderService.isIntroHeaderVisible(true);
  }]);