'use strict';

 angular
  .module('app')
  .controller('AddCategoryController', ['$scope', 'Category',
      '$state', function($scope, Category, $state) {
    $scope.action = 'Add';
    $scope.category = {};

    $scope.submitForm = function() {
      Category
        .create({
          name: $scope.categoryname
        })
        .$promise
        .then(function() {
          $state.go('Categories');
        });
    };
  }])  
  .controller('AllCategoriesController', [
  	'$scope', 'Category', function($scope, Category) {
	    $scope.categorys = Category.find({filter: {order: 'name ASC'}});
  }])
  .controller('EditCategoryController', ['$scope', 'Category', '$stateParams', '$state', 
      function($scope, Category, $stateParams, $state) {
		    $scope.action = 'Edit';

        Category.findById({ id: $stateParams.id }).$promise
        .then(function(category){
          $scope.categoryname = category.name;
        });  

		    $scope.submitForm = function() {				
          Category.prototype$updateAttributes(
              { id:$stateParams.id }, { name: $scope.categoryname }
          )
          .$promise
          .then(function(){
            $state.go('Categories');
          });
		    };
  }])
  .controller('DeleteCategoryController', ['$scope', 'Category', '$state',
      '$stateParams', function($scope, Category, $state, $stateParams) {
    Category
      .deleteById({ id: $stateParams.id })
      .$promise
      .then(function() {
        $state.go('Categories');
      });
  }]);