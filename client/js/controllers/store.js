'use strict';

 angular
  .module('app')
  .controller('AddStoreController', ['$scope', 'Store', 'Category', 
    '$state', 'StoreCategory', '$rootScope', '$stateParams', 'ReceiptService', 
    function($scope, Store, Category, $state, StoreCategory, $rootScope, $stateParams, ReceiptService) {      

    $scope.relocateFooter = function(){
      if(window.innerWidth < 768 || window.innerHeight < 860){
        $('pagefooter').removeAttr('style');
      }else{
        $('pagefooter.myfooter').css('position', 'absolute').css('bottom',0);
      }       
    }
    $scope.relocateFooter();     
    $(window).resize(function(){
      $scope.relocateFooter(); 
    }); 
        
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

    $scope.storesName = Store.find({
      filter: {
        fields: { "id": true, "name": true},
        order: 'name ASC',
          where: {and: [
            {customerId: userId},
            {groupId: groupId}
          ]}
      }
    });   

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

    $scope.backToPage = function(){
      window.history.back();
    }
    
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

    $scope.checkValues = function(){

      if($scope.selectedCategory.length < 1){
        ReceiptService.publicShowMessage('#invalidCategoryMessage'); 
        return false;        
      }
      return true;            
    } //$scope.checkValues = function(){     

    $scope.showMessage = function(flashMessage){
      $(flashMessage).addClass("in"); 
      window.setTimeout(function(){
        $(flashMessage).removeClass("in"); 
      }, 3000);        
    }

    $scope.submitForm = function() {
      if($scope.checkValues()){
        var newStoreName = (($scope.store.name).trim()).toLowerCase();
        var storeName;
        var isNewStoreName = false;
        if($scope.storesName.length > 0){
          var isExist = false;
          for(var i = 0 ; i < $scope.storesName.length ; i++){
            storeName = (($scope.storesName[i].name).trim()).toLowerCase();
            if(storeName == newStoreName){
              ReceiptService.publicShowMessage('#addStoreErrorMessage');
              isExist = true;
              break;
            }
          } // for(var i = 0 ; i < $scope.tags.length ; i++){
          isNewStoreName = !isExist;
        }else{
          isNewStoreName = true;
        } // if($scope.tags.length > 0){
        if(isNewStoreName){
          Store
            .create({
              name: ($scope.store.name).trim(),
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
        } // if(isNewStoreName){
      } // if($scope.checkValues()){
    };  // $scope.submitForm = function() {
  }])  
  .controller('EditStoreController', ['$scope', 'Store', 'Category', 
      '$stateParams', '$state', 'StoreCategory', '$location', '$rootScope', 'ReceiptService',   
      function($scope, Store, Category, $stateParams, $state, StoreCategory, $location, $rootScope, ReceiptService) {      

    $scope.relocateFooter = function(){
      if(window.innerWidth < 768 || window.innerHeight < 860){
        $('pagefooter').removeAttr('style');
      }else{
        $('pagefooter.myfooter').css('position', 'absolute').css('bottom',0);
      }       
    }
    $scope.relocateFooter();     
    $(window).resize(function(){
      $scope.relocateFooter(); 
    }); 
        
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

      $scope.backToPage = function(){
        window.history.back();
      }
      
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

      $scope.disableDelete = true;
      $scope.delTooltip = '';
      $scope.isAllowedToDelete = function(){
        Store.findById({
          id: $stateParams.id,
          filter: {   
            fields: {
              id: true
            },          
            include:{
              relation: 'receipts',
              scope: {
                fields: {
                  id: true
                },
              }
            }
          }
        })
        .$promise
        .then(function(store){
          if(store.receipts.length > 0){
            $scope.disableDelete = true;
            $scope.delTooltip = 'Store has been used by receipt(s)';
          }else{
            $scope.disableDelete = false;
            $scope.delTooltip = '';
          } //if(store.receipts.length > 0){
        }); // Store.findById({     
      }    
      $scope.isAllowedToDelete();  

      $scope.deleteStore = function(){
        if(confirm("Are you sure?")){
            Store.findById({
              id: $stateParams.id,
              filter: {   
                fields: {
                  id: true
                },          
                include:{
                  relation: 'receipts',
                  scope: {
                    fields: {
                      id: true
                    },
                  }
                }
              }
            })
            .$promise
            .then(function(store){
              if(store.receipts.length > 0){
                ReceiptService.publicShowMessage('#deleteStoreErrorMessage');
              }else if(store.receipts.length === 0){
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
                } // if($stateParams.groupId == undefined){
              } //else if(tag.receipts.length === 0){
            }); // Tag.findById({
        } // if(confirm("Are you sure?")){    
      }  // $scope.deleteStore = function(){

      $scope.checkValues = function(){

        if($scope.selectedCategory.length < 1){
          $scope.showMessage('#invalidCategoryMessage'); 
          return false;        
        }
        return true;            
      } //$scope.checkValues = function(){     

      $scope.showMessage = function(flashMessage){
        $(flashMessage).addClass("in"); 
        window.setTimeout(function(){
          $(flashMessage).removeClass("in"); 
        }, 3000);        
      }

	    $scope.submitForm = function() {
        if($scope.checkValues()){          
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
        } // if($scope.checkValues()){ 
	    };
  }])
  .filter('startFrom', function() {
      return function(input, start) {
          start = +start; //parse to int
          return input.slice(start);
      }
  })
  .filter('storeFilter', function(){
    return function(dataArray, searchTerm) {
        // If no array is given, exit.
        if (!dataArray) {
            return;
        }
        // If no search term exists, return the array unfiltered.
        else if (!searchTerm) {
            return dataArray;
        }
        // Otherwise, continue.
        else {
             // Convert filter text to lower case.
             var term = searchTerm.toLowerCase();
             // Return the array and filter it by looking for any occurrences of the search term in each items id or name. 
             return dataArray.filter(function(store){
                var name = store.name;
                var storeName = name.toLowerCase().indexOf(term) > -1;
                return storeName;
             });
        } 
    }
  }) 
  .controller('AllStoresController', [
    '$stateParams', '$scope', 'Store', '$rootScope', '$state', 'ReceiptService', '$filter', 
    function($stateParams, $scope, Store, $rootScope, $state, ReceiptService, $filter) { 

      // Pagination
      $scope.pageUnits = [5, 10, 15, 20];
      $scope.pageSize = 10;
      $scope.currentPage = 0;           
      // Pagination

      $scope.groupName = $stateParams.groupName;

      var userId, groupId;
      if($stateParams.groupId == undefined){
        userId = $rootScope.currentUser.id;
        groupId = "";
      }else{
        userId = $stateParams.ownerId;
        groupId = $stateParams.groupId;
      }

      $scope.lineNum = -1;
      $(window).resize(function(){
        if($scope.searchText == undefined || $scope.searchText == ''){
          $scope.changePageRelocateFooter();
        }else{
          if($scope.numberOfPages() == 0){
            $scope.relocateFooter(3);
          }else{
            $scope.relocateFooterAfterFilter($scope.filterNum, $scope.searchText);  
          }          
        }          
      });

      $scope.relocateFooter = function(lineNum){
        if(window.innerHeight < 860){
          $('pagefooter').removeAttr('style');
        }else{
          if( window.innerHeight == screen.height) {
            if(lineNum < 8){
              $('pagefooter.myfooter').css('position', 'absolute').css('bottom',0);
            }else{
              $('pagefooter').removeAttr('style'); 
            } 
          }else{
            if(lineNum < 4){
              $('pagefooter.myfooter').css('position', 'absolute').css('bottom',0);
            }else{
              $('pagefooter').removeAttr('style'); 
            }          
          }
        }        
      }

      $scope.stores = [];
      Store.find({
          filter: {
            order: 'name ASC',
            where: {and: [
              {customerId: userId},
              {groupId: groupId}
            ]}
          }
        })
      .$promise
      .then(function(stores){
        $scope.stores = stores;
        $scope.changePageRelocateFooter();
        $scope.lineNum = stores.length;
      });

      //Pagination - angular
      $scope.getData = function(){
        //return $filter('filter')($scope.stores);
        if($scope.searchText == undefined || $scope.searchText == ''){
          return $filter('filter')($scope.stores);
        }else{
          return $filter('storeFilter')($scope.stores, $scope.searchText);
        }         
      }

      $scope.numberOfPages=function(){
          return Math.ceil($scope.getData().length/$scope.pageSize);                
      }

      $scope.totalPages;
      $scope.calNumberOfPages = function(){
          $scope.totalPages = ($scope.currentPage+1) + "/";
          var numPage = $scope.numberOfPages();
          if(numPage == 0){
            $scope.totalPages += '1';
            $scope.NextDisabled = true;
            $scope.relocateFooter(3);
          }else{
            $scope.totalPages += numPage;
          }
          return $scope.totalPages;     
      } 

      $scope.getNumber = function(num) {
          return new Array(num);   
      }
      $scope.changePageSize = function(){
        $scope.currentPage = 0;
        if($scope.pageSize == 5){
          $scope.changePageRelocateFooter();
        }else{
          $scope.relocateFooter($scope.pageSize);
        }     
      }    

      $scope.changePageNumber = function(num){
        $scope.currentPage = $scope.currentPage + num;
        $scope.changePageRelocateFooter();
      } 

      $scope.changePageRelocateFooter = function(){
        if($scope.currentPage >= $scope.getData().length/$scope.pageSize - 1){
          $scope.NextDisabled = true;
          var restLineNum = ($scope.getData().length)%$scope.pageSize;
          if(window.innerHeight < 860){
            $('pagefooter').removeAttr('style');
          }else{
            if(restLineNum < 8){
              if(restLineNum == 0){
                if($scope.getData().length == 0){
                  $('pagefooter.myfooter').css('position', 'absolute').css('bottom',0);
                }else{
                  if(window.innerHeight == screen.height && $scope.pageSize == 5){
                    $('pagefooter.myfooter').css('position', 'absolute').css('bottom',0);
                  }else{
                    $('pagefooter').removeAttr('style');                
                  }                 
                }
              }else{
                if(window.innerHeight == screen.height){
                  $scope.relocateFooter(5);
                }else{
                  if(restLineNum < 4){
                    $('pagefooter.myfooter').css('position', 'absolute').css('bottom',0);
                  }else{
                    $('pagefooter').removeAttr('style'); 
                  }
                }              
              }            
            }else{
              $('pagefooter').removeAttr('style'); 
            }
          } 
        }else{
          $scope.NextDisabled = false;
          $scope.relocateFooter($scope.pageSize);
        }        
      }   
      //Pagination - angular            

      $scope.filterNum = 0;
      $scope.searchText;
      $scope.checkFooter = function(num, searchText){
        $scope.filterNum = num;
        $scope.searchText = searchText;
        $scope.relocateFooterAfterFilter(num, searchText);

        if(num < $scope.pageSize-1){
          $scope.NextDisabled = true;
        }else{          
          if($scope.currentPage >= $scope.getData().length/$scope.pageSize - 1){
            $scope.NextDisabled = true;
          }else{
            $scope.NextDisabled = false;
          }
        }        
      }
  
      $scope.relocateFooterAfterFilter = function(num, searchText){
        if(searchText !=undefined && searchText != ''){  
          $scope.calNumberOfPages();  
          if(window.innerHeight < 860){
            $('pagefooter').removeAttr('style');
          }else{
            if(num < 8){
              if(window.innerHeight == screen.height){
                $scope.relocateFooter(5);
              }else{
                if(num < 4){
                  $('pagefooter.myfooter').css('position', 'absolute').css('bottom',0);
                }else{
                  $scope.relocateFooter(10);
                }
              }
            }else{
              $scope.relocateFooter(10);
            }
          } 
        }else{
          $scope.changePageRelocateFooter();
        }      
      }       

      $scope.viewGroup = function(){
        if($stateParams.groupId != undefined){
             $state.go('viewGroup', {'id': $stateParams.groupId});
        }        
      }
 
      $scope.editStore = function(storeId){
        if($stateParams.groupId == undefined){
           $state.go(
            'editStore', 
            {
              'id': storeId
            }
          );
        }else{
           $state.go(
            'groupEditStore', 
            {
              'id': storeId, 
              'groupId': $stateParams.groupId, 
              'groupName':  $stateParams.groupName,
              'ownerId': $stateParams.ownerId
            }
          );  
        } // if($stateParams.groupId == undefined){         
      }

      $scope.deleteStore = function(storeId){
        if(confirm("Are you sure?")){
          Store.findById({
            id: storeId,
            filter: {   
              fields: {
                id: true
              },          
              include:{
                relation: 'receipts',
                scope: {
                  fields: {
                    id: true
                  },
                }
              }
            }
          })
          .$promise
          .then(function(store){
            //console.log("store: ", store);
            if(store.receipts.length > 0){
              ReceiptService.publicShowMessage('#deleteStoreErrorMessage');
            }else if(store.receipts.length === 0){
              if($stateParams.groupId == undefined){
                 $state.go(
                  'deleteStore', 
                  {
                    'id': storeId
                  }
                );
              }else{
                 $state.go(
                  'groupDeleteStore', 
                  {
                    'id': storeId, 
                    'groupId': $stateParams.groupId, 
                    'groupName':  $stateParams.groupName,
                    'ownerId': $stateParams.ownerId
                  }
                );  
              } // if($stateParams.groupId == undefined){
            } //else if(tag.receipts.length === 0){
          }); // Tag.findById({
          //$scope.actionStore('deleteStore', 'groupDeleteStore', storeId);            
        } // if(confirm("Are you sure?")){      
      } // $scope.deleteStore = function(storeId){

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
        } // if($stateParams.groupId == undefined){ 
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