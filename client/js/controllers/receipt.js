'use strict';

 angular
  .module('app')
  .controller('AllReceiptsController', [
  	'$scope', 'Receipt', '$rootScope', '$stateParams', '$state', 
     function($scope, Receipt, $rootScope, $stateParams, $state) {

      $scope.ownerId = $stateParams.ownerId;
      $scope.groupId = $stateParams.groupId;
      $scope.groupName = $stateParams.groupName;

      var userId, groupId;
      if($stateParams.groupId == undefined){
        userId = $rootScope.currentUser.id;
        groupId = "";
      }else{
        userId = $stateParams.ownerId;
        groupId = $stateParams.groupId;
      }

      $scope.receipts = Receipt.find({
        filter: {
          order: 'date DESC', 
          include: ['store', 'customer'],
          where: {and: [
            {customerId: userId},
            {groupId: groupId},
          ]}
        }
      });  

      $scope.viewGroup = function(){
        if($stateParams.groupId != undefined){
             $state.go('viewGroup', {'id': $stateParams.groupId});
        }        
      }

      var groupParameters;
      if($stateParams.groupId != undefined){
        groupParameters = {
              'groupId': $stateParams.groupId, 
              'groupName': $stateParams.groupName, 
              'ownerId': $stateParams.ownerId
            };
      } 
  
      $scope.groupAddFile = function(){
        if($stateParams.groupId != undefined){
             $state.go('groupAddFile', groupParameters);
        }        
      }
 
      $scope.groupChart = function(){
        if($stateParams.groupId != undefined){
             $state.go('groupChart', groupParameters);
        }        
      }            

      $scope.addReceipt = function(){
        if($stateParams.groupId == undefined){
          $state.go('addReceipt');
        }else{
             $state.go(
              'groupAddReceipt', groupParameters);
        }
      }       

      $scope.viewReceipt = function(receiptId){
        if($stateParams.groupId == undefined){
          $state.go('viewReceipt', {'id': receiptId});
        }else{
             $state.go(
              'groupViewReceipt', 
              {
                'id':         receiptId, 
                'groupId':    $stateParams.groupId, 
                'groupName':  $stateParams.groupName,
                'ownerId':    $stateParams.ownerId
              }
            );
        }        
      }

      $scope.actionReceipt = function(action, groupAction, receiptId){
        if($stateParams.groupId == undefined){
           $state.go(
            action, 
            {
              'id': receiptId
            }
          );
        }else{
           $state.go(
            groupAction, 
            {
              'id': receiptId, 
              'groupId': $stateParams.groupId, 
              'groupName':  $stateParams.groupName,
              'ownerId': $stateParams.ownerId
            }
          );  
        } 
      }
 
      $scope.editCategory = function(receiptId){
        $scope.actionReceipt('editReceipt', 'groupEditReceipt', receiptId);  
      }

      $scope.deleteCategory = function(receiptId){
        if(confirm("Are you sure?")){
          $scope.actionReceipt('deleteReceipt', 'groupDeleteReceipt', receiptId);  
        }         
      }

  }])
  .controller('DeleteReceiptController', ['$scope', 'Receipt', '$state',
      '$stateParams',  
      function($scope, Receipt, $state, $stateParams) {

    Receipt.items.destroyAll(
      {id: $stateParams.id}, 
      function(){
        Receipt.tags.destroyAll({
          id: $stateParams.id
        })
        .$promise
        .then(function(){
          Receipt
            .destroyById({ id: $stateParams.id })
            .$promise
            .then(function() {
              //$state.go('Receipts'); 
              if($stateParams.groupId == undefined){
                $state.go('Receipts');
              }else{
                $state.go(
                  'groupReceipts', 
                  {
                    'groupId':    $stateParams.groupId, 
                    'groupName':  $stateParams.groupName,
                    'ownerId':    $stateParams.ownerId
                  }
                );
              }
            });          
        });
    });

  }])
  .controller('ViewReceiptController', ['$scope', 'Receipt', '$state',
      '$stateParams', 'Store', 'Item', 'ReceiptItem', 'Category', 
      'Tag', 'ReceiptTag', '$location', '$rootScope', 
      function($scope, Receipt, $state, $stateParams, Store, 
        Item, ReceiptItem, Category, Tag, ReceiptTag, $location, $rootScope) {

    $scope.stores = [];
    $scope.selectedStore;
    $scope.selectedCategory;
    $scope.receipt = {};
    $scope.tags = [];  
    $scope.selectedTags=[];
    $scope.selTagCount;  

    var groupName = $stateParams.groupName; 

    var userId, groupId;
    if($stateParams.groupId == undefined){
      userId = $rootScope.currentUser.id;
      groupId = "";
    }else{
      userId = $stateParams.ownerId;
      groupId = $stateParams.groupId;
    }  

    Store
      .find({
        fields: {
          id: true,
          name: true,
          customerId: true
        },
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
        var stores = $scope.stores = stores;
        Receipt.findById({
         id: $stateParams.id, 
         filter: { 
            include: [
              {
                relation: 'items',
                scope:{
                  where: {and: [
                    {customerId: userId},
                    {groupId: groupId}
                  ]}                 
                }
              },
              {
                relation: 'tags',
                scope:{
                  where: {and: [
                    {customerId: userId},
                    {groupId: groupId}
                  ]}                
                }
              }              
            ]
          }
        })
        .$promise
        .then(function(receipt){ 
          console.log("receipt: ", receipt);   
          // Set Items related to Receipt       
          $scope.receipt = receipt; 
          $scope.items = receipt.items;
 
          // Set selected Store
          var selectedStoreIndex = stores.map(function(store){ 
            return store.id;
          }).indexOf($scope.receipt.storeId);
          $scope.selectedStore = stores[selectedStoreIndex];   
          // Call to get the categories from selected store
          $scope.getStoreCategories($scope.selectedStore.id, $scope.receipt.categoryId);

          // Get categories by selected store using Service named 'ReceiptService'
          //ReceiptService.getCategoriesBySelectedStore($scope.selectedStore.id, $scope.receipt.categoryId);                  

          // Set Tag related to Receipt
          Tag.find({
              filter: {
                order: 'name ASC',
                where: {and: [
                  {customerId: userId},
                  {groupId: groupId}
                ]}
              }
            })
            .$promise
            .then(function(tags){
              $scope.tags = tags;
              if(receipt.tags.length > 0){
                for(var i=0 ; i < receipt.tags.length ; i++){
                  var selectedTagIndex = tags.map(function(tag){ 
                    return tag.id;
                  }).indexOf(receipt.tags[i].id);
                  $scope.selectedTags.push(tags[selectedTagIndex]);
                }
                $scope.selTagCount=receipt.tags.length + " selected";
              }
            });

        });
    });
 
    /*
    // Get categories by selected store using Service named 'ReceiptService'
    $scope.changeStore = function(){
      console.log("changeStore: ", $scope.selectedStore.name);
      ReceiptService.getCategoriesBySelectedStore($scope.selectedStore.id, null);
    } 
    */
    $scope.Receipts = function(){
      if($stateParams.groupId == undefined){
        $state.go('Receipts');
      }else{
           $state.go(
            'groupReceipts', 
            {
              'groupId':    $stateParams.groupId, 
              'groupName':  $stateParams.groupName,
              'ownerId':    $stateParams.ownerId
            }
          );
      }        
    } 

    $scope.editReceipt = function(){
      if($stateParams.groupId == undefined){
        $state.go('editReceipt', {'id': $stateParams.id});
      }else{
         $state.go(
          'groupEditReceipt', 
          {
            'id':         $stateParams.id, 
            'groupId':    $stateParams.groupId, 
            'groupName':  $stateParams.groupName,
            'ownerId':    $stateParams.ownerId
          }
        );
      }        
    }    

    // Get the Store's categories using Controller's function (but duplicated)
    $scope.getStoreCategories = function(storeId, categoryId){      
      if(storeId === null){
        storeId = $scope.selectedStore.id;
      }
      Store.findById({ 
        id: storeId,
        fields: {
          id: true,
          name: true
        }, 
        filter: {
          include: {
            relation: 'categories',
            scope:{
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
        var categories = $scope.categories = store.categories;
        if(store.categories.length > 0 && categoryId != null){
            var selectedCategoryIndex = categories.map(function(category){ 
              return category.id;
            }).indexOf(categoryId);
            $scope.selectedCategory = categories[selectedCategoryIndex];
        }
      });
    } 

    $scope.countSelectedTag = function(){
      $scope.selTagCount=$scope.selectedTags.length + " selected";
    }
      
  }])  
  .controller('EditReceiptController', ['$scope', 'Receipt', '$state',
      '$stateParams', 'Store', 'Item', 'ReceiptItem', 'Category', 
      'Tag', 'ReceiptTag', '$location', '$rootScope', 
      function($scope, Receipt, $state, $stateParams, Store, 
        Item, ReceiptItem, Category, Tag, ReceiptTag, $location, $rootScope) {   

    $scope.action = 'Edit';
    $scope.stores = [];
    $scope.selectedStore;
    $scope.selectedCategory;
    $scope.receipt = {};
    $scope.isDisabled = false;
    $scope.delDisabled = true;
    $scope.tags = [];  
    $scope.selectedTags=[];
    $scope.selTagCount;  

    $scope.groupName = $stateParams.groupName;

    var userId, groupId;
    if($stateParams.groupId == undefined){
      userId = $rootScope.currentUser.id;
      groupId = "";
    }else{
      userId = $stateParams.ownerId;
      groupId = $stateParams.groupId;
    }     

    Store
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
      .then(function(stores){
        //console.log("Stores: ", stores);
        var stores = $scope.stores = stores;
        Receipt.findById({
         id: $stateParams.id, 
         filter: { 
            include: [
              {
                relation: 'items',
                scope:{
                  where: {and: [
                    {customerId: userId},
                    {groupId: groupId}
                  ]}                  
                }
              },
              {
                relation: 'tags',
                scope:{
                  where: {and: [
                    {customerId: userId},
                    {groupId: groupId}
                  ]}                   
                }
              }              
            ]
          }
        })
        .$promise
        .then(function(receipt){ 
          console.log("receipt: ", receipt);   
          // Set Items related to Receipt       
          $scope.receipt = receipt; 
          $scope.items = receipt.items;
          if($scope.items.length > 0){ 
            $scope.delDisabled = false;
          };
          // Set selected Store
          var selectedStoreIndex = stores.map(function(store){ 
            return store.id;
          }).indexOf($scope.receipt.storeId);
          $scope.selectedStore = stores[selectedStoreIndex];   
          // Call to get the categories from selected store
          $scope.getStoreCategories($scope.selectedStore.id, $scope.receipt.categoryId);

          // Get categories by selected store using Service named 'ReceiptService'
          //ReceiptService.getCategoriesBySelectedStore($scope.selectedStore.id, $scope.receipt.categoryId);                  

          // Set Tag related to Receipt
          Tag.find({
            filter: {
              order: 'name ASC',
              where: {and: [
                {customerId: userId},
                {groupId: groupId}
              ]} 
            }            
          })
            .$promise
            .then(function(tags){
              $scope.tags = tags;
              if(receipt.tags.length > 0){
                for(var i=0 ; i < receipt.tags.length ; i++){
                  var selectedTagIndex = tags.map(function(tag){ 
                    return tag.id;
                  }).indexOf(receipt.tags[i].id);
                  $scope.selectedTags.push(tags[selectedTagIndex]);
                }
                $scope.selTagCount=receipt.tags.length + " selected";
              }
            });

        });
    });
 
    /*
    // Get categories by selected store using Service named 'ReceiptService'
    $scope.changeStore = function(){
      console.log("changeStore: ", $scope.selectedStore.name);
      ReceiptService.getCategoriesBySelectedStore($scope.selectedStore.id, null);
    } 
    */
    $scope.Receipts = function(){
      if($stateParams.groupId == undefined){
        $state.go('Receipts');
      }else{
           $state.go(
            'groupReceipts', 
            {
              'groupId':    $stateParams.groupId, 
              'groupName':  $stateParams.groupName,
              'ownerId':    $stateParams.ownerId
            }
          );
      }        
    }     

    $scope.viewReceipt = function(){
      if($stateParams.groupId == undefined){
        $state.go('viewReceipt', {'id': $stateParams.id});
      }else{
           $state.go(
            'groupViewReceipt', 
            {
              'id':         $stateParams.id, 
              'groupId':    $stateParams.groupId, 
              'groupName':  $stateParams.groupName,
              'ownerId':    $stateParams.ownerId
            }
          );
      }        
    } 

    // Get the Store's categories using Controller's function (but duplicated)
    $scope.getStoreCategories = function(storeId, categoryId){      
      if(storeId === null){
        storeId = $scope.selectedStore.id;
        //console.log("changeStoreId: ", storeId);
      }
      Store.findById({ 
        id: storeId,
        fields: {
          id: true,
          name: true
        },            
        filter: {
          include: {
            relation: 'categories',
            scope:{
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
        var categories = $scope.categories = store.categories;
        //console.log("store.categories: ", store.categories);
        if(store.categories.length > 0 && categoryId != null){
            var selectedCategoryIndex = categories.map(function(category){ 
              return category.id;
            }).indexOf(categoryId);
            $scope.selectedCategory = categories[selectedCategoryIndex];
        }
      });
    }      

    $scope.countSelectedTag = function(){
      $scope.selTagCount=$scope.selectedTags.length + " selected";
    }

    $scope.openCalendar = function(){
      $('#receiptdate').datetimepicker({
        format: 'YYYY-MM-DD',
        useCurrent: false
      });
      $scope.receipt.date = $('#receiptdate input').prop('value');
    }

    $scope.items = [];        
    $scope.newItem = function () {
      //console.log("go into newItem");
      // Add Item input form
      $scope.items.push({});
      if($scope.items.length > 0){ 
        $scope.delDisabled = false;
      }
    }

    $scope.spliceItem = function(){
      //console.log("Item length: ", $scope.items.length);
      $scope.items.splice($scope.items.length-1, 1);
      if($scope.items.length < 1){ 
        $scope.delDisabled = $scope.isDisabled = true;
        $scope.receipt.numberOfItem = "";
        $scope.receipt.total = "";        
      }   
    }

    $scope.changeItemPrice = function(){
      //console.log("items.length: ", $scope.items.length);
      $scope.totalprice=0;
      if($scope.items.length > 0){ 
        for(var i = 0 ; i < $scope.items.length ; i++){
          if($scope.items[i].price != undefined){
            $scope.totalprice += $scope.items[i].price;
          }
        };
        //console.log("total price: ", $scope.totalprice);
        $scope.receipt.numberOfItem = $scope.items.length;
        $scope.receipt.total = $scope.totalprice;
        this.changeTotal();
      }   
    }

    $scope.changeTotal = function(){
      if($scope.receipt.total > 0){
        $scope.isDisabled = false;
      }else{
        $scope.isDisabled = true;
      }  
    }

    // Delete selected receipt
    $scope.deleteReceipt = function(){
      if(confirm("Are you sure?")){

        if($stateParams.groupId == undefined){
          $state.go('deleteReceipt', {'id': $stateParams.id});
        }else{
             $state.go(
              'groupDeleteReceipt', 
              {
                'id':         $stateParams.id, 
                'groupId':    $stateParams.groupId, 
                'groupName':  $stateParams.groupName,
                'ownerId':    $stateParams.ownerId
              }
            );
        }   
      }    
    }

    $scope.submitForm = function() {
      //console.log("selectedCategory: ", $scope.selectedCategory);
      if($scope.selectedCategory !== undefined){
        $scope.receipt.categoryId = $scope.selectedCategory.id;
      }
      $scope.receipt.storeId = $scope.selectedStore.id;  
      $scope.receipt.date = $scope.receipt.date = $('#receiptdate input').prop('value');    
      $scope.receipt
      .$save()
      .then(function(){

        Receipt.items.destroyAll(
          {id: $stateParams.id}, 
          function(){
            for(var i=0 ; i < $scope.items.length ; i++){
              // need to fix, only new Item create
              // already exist Item should be update
              Item
              .create({
                name: $scope.items[i].name,
                price: $scope.items[i].price,
                customerId: userId,
                groupId: groupId
              }, function(item){
                //console.log('new related item id : ', item.id);
                ReceiptItem
                  .create({
                    receiptId: $scope.receipt.id,
                    itemId: item.id
                  })
                  .$promise;                
              });
            }

            Receipt.tags.destroyAll({
              id: $stateParams.id
            })
            .$promise
            .then(function(){
                for(var i = 0 ; i < $scope.selectedTags.length ; i++){
                  ReceiptTag
                    .create({
                      receiptId: $scope.receipt.id,
                      tagId: $scope.selectedTags[i].id
                    })
                    .$promise;                  
                }
            });
            //$state.go('Receipts');  
            if($stateParams.groupId == undefined){
              $state.go('Receipts');
            }else{
              $state.go(
                'groupReceipts', 
                {
                  'groupId':    $stateParams.groupId, 
                  'groupName':  $stateParams.groupName,
                  'ownerId':    $stateParams.ownerId
                }
              );
            }

        }); 
      });
    };
  }])
  .controller('AddReceiptController', ['$scope', '$state', 'Receipt', 'Store', 
    'Category', 'Item', 'ReceiptItem', 'Tag', 'ReceiptTag', '$rootScope', '$stateParams',  
    function($scope, $state, Receipt, Store, Category, 
      Item, ReceiptItem, Tag, ReceiptTag, 
      $rootScope, $stateParams) {             

    $scope.action = 'Add';
    $scope.stores = [];
    $scope.selectedStore;
    $scope.selectedCategory;
    $scope.receipt = {};
    $scope.isDisabled = true;
    $scope.delDisabled = true;
    $scope.tags = [];  
    $scope.selectedTags=[];
    $scope.selTagCount; 

    $scope.groupName = $stateParams.groupName;

    var userId, groupId;
    if($stateParams.groupId == undefined){
      userId = $rootScope.currentUser.id;
      groupId = "";
    }else{
      userId = $stateParams.ownerId;
      groupId = $stateParams.groupId;
    }    

    Store
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
      .then(function(stores){
        $scope.stores = stores;
        $scope.selectedStore = $scope.selectedStore;

        // Set Tag related to Receipt
        Tag.find({
            filter: {
              order: 'name ASC',
              where: {and: [
                {customerId: userId},
                {groupId: groupId}
              ]}
            }
          })
          .$promise
          .then(function(tags){
            $scope.tags = tags;
        });
    });
    
    /*
    // Get categories by selected store using Service named 'ReceiptService'
    $scope.changeStore = function(){
      console.log("changeStore: ", $scope.selectedStore.name);
      ReceiptService.getCategoriesBySelectedStore($scope.selectedStore.id, null); 
    }
    */

    // Get categories by selected store using Controller's function (but duplicated)
    $scope.getStoreCategories = function(storeId, categoryId){
      if(storeId === null){
        storeId = $scope.selectedStore.id;
        //console.log("changeStore: ", storeId);
      }      
      Store.findById({ 
        id: storeId,
        fields: {
          id: true,
          name: true
        },            
        filter: {
          include: {
            relation: 'categories',
            scope:{
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
        var categories = $scope.categories = store.categories;
        //console.log("store.categories: ", store.categories);
        if(store.categories.length > 0 && categoryId != null){
            var selectedCategoryIndex = categories.map(function(category){ 
              return category.id;
            }).indexOf(categoryId);
            $scope.selectedCategory = categories[selectedCategoryIndex];
        }
      });
    }    

    $scope.countSelectedTag = function(){
      $scope.selTagCount=$scope.selectedTags.length + " selected";
    }

    $scope.openCalendar = function(){
      $('#receiptdate').datetimepicker({
        format: 'YYYY-MM-DD',
        useCurrent: true
      });
      $scope.receipt.date = $('#receiptdate input').prop('value');
    }

    $scope.items = [];        
    $scope.newItem = function () {
      //console.log("go into newItem");
      // Add Item input form
      $scope.items.push({});
      if($scope.items.length > 0){ 
        $scope.delDisabled = false;
      };
       $scope.changeItemPrice();
    };

    $scope.spliceItem = function(){
      //console.log("Item length: ", $scope.items.length);
      $scope.items.splice($scope.items.length-1, 1);
      if($scope.items.length < 1){ 
        $scope.delDisabled = $scope.isDisabled = true;
        $scope.receipt.numberOfItem="" ;
        $scope.receipt.total="";         
      };
       $scope.changeItemPrice();
    };        

    $scope.changeItemPrice = function(){
      //console.log("items.length: ", $scope.items.length);
      $scope.totalprice=0;
      if($scope.items.length > 0){ 
        for(var i = 0 ; i < $scope.items.length ; i++){
          if($scope.items[i].price != undefined){
            $scope.totalprice += $scope.items[i].price;
          }
        };
        //console.log("total price: ", $scope.totalprice);
        $scope.receipt.numberOfItem = $scope.items.length;
        $scope.receipt.total = $scope.totalprice;
        this.changeTotal();
      };   
    };

    $scope.changeTotal = function(){
      if($scope.receipt.total > 0){
        $scope.isDisabled = false;
      }else{
        $scope.isDisabled = true;
      }  
    }
    $scope.submitForm = function() {
      $scope.receipt.date = $scope.receipt.date = $('#receiptdate input').prop('value');

      Receipt
        .create({
          comment: $scope.receipt.comment, 
          numberOfItem: $scope.receipt.numberOfItem, 
          total: $scope.receipt.total, 
          date: $scope.receipt.date,
          storeId: $scope.selectedStore.id,
          customerId: userId,
          groupId: groupId,
          categoryId: $scope.selectedCategory.id
        }, function(receipt){           
          for(var i=0 ; i < $scope.items.length ; i++){
            Item
              .create({
                name: $scope.items[i].name,
                price: $scope.items[i].price,
                customerId: userId,
                groupId: groupId               
              }, function(item){
                console.log('item id : ', item.id);
                ReceiptItem
                  .create({
                    receiptId: receipt.id,
                    itemId: item.id
                  });
              });
          };
          for(var i = 0 ; i < $scope.selectedTags.length ; i++){
            ReceiptTag
              .create({
                receiptId: receipt.id,
                tagId: $scope.selectedTags[i].id
              }).$promise;              
          };            
      });

      if($stateParams.groupId == undefined){
        $state.go('Receipts');
      }else{
        $state.go(
          'groupReceipts', 
          {
            'groupId':    $stateParams.groupId, 
            'groupName':  $stateParams.groupName,
            'ownerId':    $stateParams.ownerId
          }
        );
      }
    };        
  }]);  