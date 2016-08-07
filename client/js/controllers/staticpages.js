angular
  .module('app')
  .controller('StaticPagesController', ['$scope', '$state',  function($scope, $state) {
    $scope.relocateFooter = function(){
      if(window.innerHeight < 860){
        $('pagefooter').removeAttr('style');
      }else{
        $('pagefooter.myfooter').css('position', 'absolute').css('bottom',0);
      }         
    }
    $scope.relocateFooter(); 
    $(window).resize(function(){
      $scope.relocateFooter();
    });     
  }]);