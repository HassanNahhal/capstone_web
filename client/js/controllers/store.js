'use strict';

 angular
  .module('app')
  .controller('AddStoreController', ['$scope', 'Store', 'Category', 
    '$state', 'StoreCategory', '$rootScope', '$stateParams', 
    function($scope, Store, Category, $state, StoreCategory, $rootScope, $stateParams) {

    $scope.action = 'Add';
    $scope.categories = [];
    $scope.selectedCategory=[];
    $scope.selCategoryCount;
    $scope.store = {};  

    $scope.groupName = $stateParams.groupName;   

    var userId, groupId;
    if($stateParams.groupId == undefined){
      userId = $rootScope.currentUser.id;
      groupId = "";
    }else{
      userId = $stateParams.ownerId;
      groupId = $stateParams.groupId;
    }  

    Category
      .find({
        filter: {
          order: 'name ASC',
          where: {and: [
            {customerId: userId},
            {groupId: groupId}
          ]}
        }
      })
      .$promise
      .then(function(categories){
        $scope.categories = categories;
    });

    $scope.Stores = function(){
      if($stateParams.groupId == undefined){
        $state.go('Stores');
      }else{
         $state.go(
          'groupStores', 
          {
            'groupId':    $stateParams.groupId, 
            'groupName':  $stateParams.groupName,
            'ownerId':    $stateParams.ownerId
          }
        );
      }      
    }      

    $scope.countSelectedCategory = function(){
      $scope.selCategoryCount=$scope.selectedCategory.length + " selected";
    } 

    $scope.submitForm = function() {
      Store
        .create({
          name: $scope.store.name,
          customerId: userId,
          groupId: groupId
        }, function(store) {
          for(var i = 0 ; i < $scope.selectedCategory.length ; i++){
            StoreCategory
              .create({
                storeId: store.id,
                categoryId: $scope.selectedCategory[i].id
              }).$promise;              
          }
          $scope.Stores();
        });
    };
  }])  
  .controller('EditStoreController', ['$scope', 'Store', 'Category', 
      '$stateParams', '$state', 'StoreCategory', '$location', '$rootScope', 
      function($scope, Store, Category, $stateParams, $state, StoreCategory, $location, $rootScope) {

    $scope.action = 'Edit';
    $scope.categories = [];
    $scope.options2=[];
    $scope.selectedCategory=[];
    $scope.selCategoryCount;
    $scope.store = {}; 

    var userId, groupId;
    if($stateParams.groupId == undefined){
      userId = $rootScope.currentUser.id;
      groupId = "";
    }else{
      userId = $stateParams.ownerId;
      groupId = $stateParams.groupId;
    }  

    Category
      .find({
        filter: {
          order: 'name ASC',
          where: {and: [
            {customerId: userId},
            {groupId: groupId}
          ]}
        }
      })
      .$promise
      .then(function(categories){
          var categories = $scope.categories = categories;
          Store.findById({ 
            id: $stateParams.id,
            filter: {
              include: {
                relation: 'categories',
                scope:{
                  fields: ['id', 'name', 'customerId', 'groupId'],
                  where: {and: [
                    {customerId: userId},
                    {groupId: groupId}
                  ]}                 
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

      var groupParameters;
      if($stateParams.groupId != undefined){
        groupParameters = {
              'groupId': $stateParams.groupId, 
              'groupName': $stateParams.groupName, 
              'ownerId': $stateParams.ownerId
            };
      }       

      $scope.Stores = function(){
        if($stateParams.groupId == undefined){
          $state.go('Stores');
        }else{
           $state.go('groupStores', groupParameters);
        }      
      }

      $scope.deleteStore = function(){
        if(confirm("Are you sure?")){
          if($stateParams.groupId == undefined){
             $state.go(
              'deleteStore', 
              {
                'id': $stateParams.id
              }
            );
          }else{
            groupParameters['id'] = $stateParams.id;
            $state.go('groupDeleteStore', groupParameters);
          } 
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
                $scope.Stores(); 
              });
          });          
	    };
  }])
  .controller('AllStoresController', [
    '$stateParams', '$scope', 'Store', '$rootScope', '$state',  
    function($stateParams, $scope, Store, $rootScope, $state) {

      $scope.groupName = $stateParams.groupName;

      var userId, groupId;
      if($stateParams.groupId == undefined){
        userId = $rootScope.currentUser.id;
        groupId = "";
      }else{
        userId = $stateParams.ownerId;
        groupId = $stateParams.groupId;
      }

      $scope.stores = Store     
            .find({
              filter: {
                order: 'name ASC',
                where: {and: [
                  {customerId: userId},
                  {groupId: groupId}
                ]}
              }
            });

      $scope.viewGroup = function(){
        if($stateParams.groupId != undefined){
             $state.go('viewGroup', {'id': $stateParams.groupId});
        }        
      }
 
      $scope.editStore = function(storeId){
        $scope.actionStore('editStore', 'groupEditStore', storeId);  
      }

      $scope.deleteStore = function(storeId){
        if(confirm("Are you sure?")){
          $scope.actionStore('deleteStore', 'groupDeleteStore', storeId);  
        }         
      } 

      $scope.actionStore = function(action, groupAction, storeId){
        if($stateParams.groupId == undefined){
           $state.go(
            action, 
            {
              'id': storeId
            }
          );
        }else{
           $state.go(
            groupAction, 
            {
              'id': storeId, 
              'groupId': $stateParams.groupId, 
              'groupName':  $stateParams.groupName,
              'ownerId': $stateParams.ownerId
            }
          );  
        } 
      }          

      $scope.addStore = function(){
        if($stateParams.groupId == undefined){
          $state.go('addStore');
        }else{
             $state.go(
              'groupAddStore', 
              {
                'groupId':    $stateParams.groupId, 
                'groupName':  $stateParams.groupName,
                'ownerId':    $stateParams.ownerId
              }
            );
        }
      }

  }])
  .controller('DeleteStoreController', ['$scope', 'Store', '$state', '$stateParams', 
      function($scope, Store, $state, $stateParams) {

    $scope.submitForm = function(){
     Store.categories.destroyAll(
      {id: $stateParams.id},
      function(res){
        Store
          .destroyById({ id: $stateParams.id })
          .$promise
          .then(function(){
            if($stateParams.groupId == undefined){
              $state.go('Stores');
            }else{
               $state.go(
                'groupStores', 
                {
                  'groupId': $stateParams.groupId, 
                  'groupName': $stateParams.groupName, 
                  'ownerId': $stateParams.ownerId
                }
              );
            } 
          });          
      });      
    }        

    $scope.submitForm();

  }]);