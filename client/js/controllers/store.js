'use strict';

 angular
  .module('app')
  .controller('AddStoreController', ['$scope', 'Store', 'Category', 
    '$state', 'StoreCategory', 
    function($scope, Store, Category, $state, StoreCategory) {

    $scope.action = 'Add';
    $scope.categories = [];
    $scope.selectedCategory=[];
    $scope.selCategoryCount;
    $scope.store = {};     

    Category
      .find()
      .$promise
      .then(function(categories){
        $scope.categories = categories;
    });

    $scope.countSelectedCategory = function(){
      $scope.selCategoryCount=$scope.selectedCategory.length + " selected";
    } 

    $scope.submitForm = function() {
      Store
        .create({
          name: $scope.store.name
        }, function(store) {
          for(var i = 0 ; i < $scope.selectedCategory.length ; i++){
            StoreCategory
              .create({
                storeId: store.id,
                categoryId: $scope.selectedCategory[i].id
              }).$promise;              
          }
          $state.go('Stores');
        });
    };
  }])  
  .controller('EditStoreController', ['$scope', 'Store', 'Category', 
      '$stateParams', '$state', 'StoreCategory', '$rootScope', '$location',  
      function($scope, Store, Category, $stateParams, $state, StoreCategory, $rootScope, $location) {

	    $scope.action = 'Edit';
      $scope.categories = [];
      $scope.options2=[];
      $scope.selectedCategory=[];
      $scope.selCategoryCount;
      $scope.store = {};        

      Category.find()
      .$promise
      .then(function(categories){
          var categories = $scope.categories = categories;
          Store.findById({ 
            id: $stateParams.id,
            filter: {
              include: {
                relation: 'categories',
                scope:{
                  fields: ['id', 'name']
                }
              }
            }
          })
          .$promise
          .then(function(store){
            console.log("store.categories: ", store.categories);
            $scope.store = store;
            $scope.store.name = store.name;
            if(store.categories.length > 0){
              for(var i=0 ; i < store.categories.length ; i++){
                var selectedCategoryIndex = categories.map(function(category){ 
                  return category.id;
                }).indexOf(store.categories[i].id);
                $scope.selectedCategory.push(categories[selectedCategoryIndex]);
              }
              $scope.selCategoryCount=store.categories.length + " selected";
            }
          });
      });

      $scope.countSelectedCategory = function(){
        $scope.selCategoryCount=$scope.selectedCategory.length + " selected";
      }

      $scope.deleteStore = function(){
        if(confirm("Are you sure?")){
             $location.path('/deleteStore/' + $scope.store.id);    
        }         
      }  

	    $scope.submitForm = function() {
        $scope.store
          .$save()
          .then(function(){
            Store.categories.destroyAll(
              {id: $stateParams.id},
              function(res){
                for(var i = 0 ; i < $scope.selectedCategory.length ; i++){
                  StoreCategory
                    .create({
                      storeId: $scope.store.id,
                      categoryId: $scope.selectedCategory[i].id
                    })
                    .$promise;                  
                }
                $state.go('Stores'); 
              });
          });          
	    };
  }])
  .controller('AllStoresController', [
    '$scope', 'Store', function($scope, Store) {
      $scope.stores = Store.find({filter: {order: 'name ASC'}});
  }])
  .controller('DeleteStoreController', ['$scope', 'Store', '$state',
      '$stateParams', '$rootScope', function($scope, Store, $state, $stateParams, $rootScope) {

    $rootScope.$on("CallThisMethod", function(event, data){
      $scope.submitForm();
    }); 

    $scope.submitForm = function(){
     Store.categories.destroyAll(
      {id: $stateParams.id},
      function(res){
        Store
          .destroyById({id: $stateParams.id})
          .$promise
          .then(function(){
            $state.go('Stores'); 
          });          
      });      
    }        

    $scope.submitForm();

  }]);