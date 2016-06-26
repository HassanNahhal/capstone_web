'use strict';

 angular
  .module('app')
  .controller('AllItemsController', ['$scope', 'Item', '$rootScope', 
    function($scope, Item, $rootScope) {

	    $scope.items = Item.find({
              filter: {
                order: 'updatedAt DESC',
                where: {customerId: $rootScope.currentUser.id}
              }
            });
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
  .controller('EditItemController', ['$scope', 'Item', '$stateParams', '$state', '$location', 
    function($scope, Item, $stateParams, $state, $location) {
      $scope.action = 'Edit';
      $scope.item = {};

      Item.findById({ id: $stateParams.id }).$promise
      .then(function(item){
        console.log(item);
        $scope.item = item;
        $scope.name = item.name;
        $scope.price = item.price;
      });

      $scope.deleteItem = function(){
        if(confirm("Are you sure?")){
             $location.path('/deleteItem/' + $scope.item.id);    
        }         
      }        

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