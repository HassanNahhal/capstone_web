'use strict';

 angular
  .module('app')
  .controller('AllItemsController', [
  	'$scope', 'Item', function($scope, Item) {
	    $scope.items = Item.find();
  }])
  .controller('DeleteItemController', ['$scope', 'Item', '$state',
      '$stateParams', function($scope, Item, $state, $stateParams) {
    Item
      .deleteById({ id: $stateParams.id })
      .$promise
      .then(function() {
        $state.go('Items');
      });
  }])
  .controller('EditItemController', ['$scope', 'Item', '$stateParams', '$state', 
    function($scope, Item, $stateParams, $state) {
      $scope.action = 'Edit';

      Item.findById({ id: $stateParams.id }).$promise
      .then(function(item){
        console.log(item);
        $scope.name = item.name;
        $scope.price = item.price;
      });  

      $scope.submitForm = function() {        
        Item.prototype$updateAttributes(
            { id:$stateParams.id }, 
            { 
              name: $scope.name,
              price: $scope.price
            }
        )
        .$promise
        .then(function(){
          $state.go('Items');
        });
      };
  }]);  