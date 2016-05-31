'use strict';

 angular
  .module('app')
  .controller('AddStoreController', ['$scope', 'Store',
      '$state', function($scope, Store, $state) {
    $scope.action = 'Add';
    $scope.store = {};

    $scope.submitForm = function() {
      Store
        .create({
          name: $scope.storename
        })
        .$promise
        .then(function() {
          $state.go('Stores');
        });
    };
  }])  
  .controller('AllStoresController', [
  	'$scope', 'Store', function($scope, Store) {
	    $scope.stores = Store.find();
  }])
  .controller('EditStoreController', ['$scope', 'Store', '$stateParams', '$state', 
      function($scope, Store, $stateParams, $state) {
		    $scope.action = 'Edit';

        Store.findById({ id: $stateParams.id }).$promise
        .then(function(store){
          $scope.storename = store.name;
        });  

		    $scope.submitForm = function() {				
          Store.prototype$updateAttributes(
              { id:$stateParams.id }, { name: $scope.storename }
          )
          .$promise
          .then(function(){
            $state.go('Stores');
          });
		    };
  }])
  .controller('DeleteStoreController', ['$scope', 'Store', '$state',
      '$stateParams', function($scope, Store, $state, $stateParams) {
    Store
      .deleteById({ id: $stateParams.id })
      .$promise
      .then(function() {
        $state.go('Stores');
      });
  }]);