'use strict';

 angular
  .module('app')
  .controller('AddCategoryController', ['$scope', 'Category',
      '$state', '$rootScope', 
      function($scope, Category, $state, $rootScope) {
    $scope.action = 'Add';
    $scope.category = {};

    $scope.submitForm = function() {
      Category
        .create({
          name: $scope.categoryname,
          customerId: $rootScope.currentUser.id
        })
        .$promise
        .then(function() {
          $state.go('Categories');
        });
    };
  }])  
  .controller('AllCategoriesController', [
  	'$scope', 'Category', '$rootScope', function($scope, Category, $rootScope) {
	    $scope.categorys = Category
                    .find({
                      filter: {
                        order: 'name ASC',
                        where: {customerId: $rootScope.currentUser.id}
                      }
                    });
  }])
  .controller('EditCategoryController', ['$scope', 'Category', '$stateParams', '$state', '$location',  
      function($scope, Category, $stateParams, $state, $location) {
		    $scope.action = 'Edit';
        $scope.category = {};

        Category.findById({ id: $stateParams.id }).$promise
        .then(function(category){
          $scope.categoryname = category.name;
          $scope.category = category;
        });  

        $scope.deleteCategory = function(){
          if(confirm("Are you sure?")){
               $location.path('/deleteCategory/' + $scope.category.id);    
          }         
        }        

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