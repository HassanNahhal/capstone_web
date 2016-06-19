'use strict';

 angular
  .module('app')
  .controller('AllReceiptsController', [
  	'$scope', 'Receipt', '$rootScope',   
     function($scope, Receipt, $rootScope) {

      var userId = $rootScope.currentUser.id;

	    $scope.receipts = Receipt.find({
        filter: {
          order: 'date DESC', 
          include: ['store', 'customer'],
          where: {customerId: userId}
        }
      });
      
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
                $state.go('Receipts');        
            });          
        });
    });
  }])
  .controller('EditReceiptController', ['$scope', 'Receipt', '$state',
      '$stateParams', 'Store', 'Item', 'ReceiptItem', 'Category', 
      'Tag', 'ReceiptTag', '$location', 
      function($scope, Receipt, $state, $stateParams, Store, 
        Item, ReceiptItem, Category, Tag, ReceiptTag, $location) {   

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

    Store
      .find({
        fields: {
          id: true,
          name: true
        }
      })
      .$promise
      .then(function(stores){
        //console.log("Stores: ", stores);
        var stores = $scope.stores = stores;
        Receipt.findById({
         id: $stateParams.id, 
         filter: { 
          include: ['items', 'tags']
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
          Tag.find()
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
          include: 'categories'
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
      };
    };

    $scope.spliceItem = function(){
      //console.log("Item length: ", $scope.items.length);
      $scope.items.splice($scope.items.length-1, 1);
      if($scope.items.length < 1){ 
        $scope.delDisabled = true;
        $scope.receipt.numberOfItem = "";
        $scope.receipt.total = "";        
      };      
    };

    $scope.changePrice = function(){
      //console.log("items.length: ", $scope.items.length);
      $scope.totalprice=0;
      if($scope.items.length > 0){ 
        for(var i = 0 ; i < $scope.items.length ; i++){
          $scope.totalprice += $scope.items[i].price;
        };
        //console.log("total price: ", $scope.totalprice);
        $scope.receipt.numberOfItem = $scope.items.length;
        $scope.receipt.total = $scope.totalprice;
      };   
    };

    // Delete selected receipt
    $scope.delReceipt = function(){
      if(confirm("Are you sure?")){
           $location.path('/deleteReceipt/' + $scope.receipt.id);    
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
                price: $scope.items[i].price                
              }, function(item){
                console.log('new related item id : ', item.id);
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
            $state.go('Receipts');           
        }); 
      });
    };
  }])
  .controller('AddReceiptController', ['$scope', '$state', 'Receipt', 'Store', 
      'Category', 'Item', 'ReceiptItem', 'Tag', 
      'ReceiptTag', '$rootScope',  
      function($scope, $state, Receipt, Store, Category, 
        Item, ReceiptItem, Tag, ReceiptTag, 
        $rootScope) {             

    $scope.action = 'Add';
    $scope.stores = [];
    $scope.selectedStore;
    $scope.selectedCategory;
    $scope.receipt = {};
    $scope.isDisabled = false;
    $scope.delDisabled = true;
    $scope.tags = [];  
    $scope.selectedTags=[];
    $scope.selTagCount; 

    Store
      .find()
      .$promise
      .then(function(stores){
        $scope.stores = stores;
        $scope.selectedStore = $scope.selectedStore;

        // Set Tag related to Receipt
        Tag.find()
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
        console.log("changeStore: ", storeId);
      }      
      Store.findById({ 
        id: storeId,
        fields: {
          id: true,
          name: true
        },            
        filter: {
          include: 'categories'
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
      this.changePrice();
    };

    $scope.spliceItem = function(){
      //console.log("Item length: ", $scope.items.length);
      $scope.items.splice($scope.items.length-1, 1);
      if($scope.items.length < 1){ 
        $scope.delDisabled = true;
        $scope.receipt.numberOfItem="" ;
        $scope.receipt.total="";         
      };
      this.changePrice();
    };        

    $scope.changePrice = function(){
      //console.log("items.length: ", $scope.items.length);
      $scope.totalprice=0;
      if($scope.items.length > 0){ 
        for(var i = 0 ; i < $scope.items.length ; i++){
          $scope.totalprice += $scope.items[i].price;
        };
        //console.log("total price: ", $scope.totalprice);
        $scope.receipt.numberOfItem = $scope.items.length;
        $scope.receipt.total = $scope.totalprice;
      };   
    };

    $scope.submitForm = function() {
      $scope.receipt.date = $scope.receipt.date = $('#receiptdate input').prop('value');
      //console.log("receipt.date: ", $scope.receipt.date);
      var userId = $rootScope.currentUser.id;
      Receipt
        .create({
          comment: $scope.receipt.comment, 
          numberOfItem: $scope.receipt.numberOfItem, 
          total: $scope.receipt.total, 
          date: $scope.receipt.date,
          storeId: $scope.selectedStore.id,
          customerId: userId,
          categoryId: $scope.selectedCategory.id
        }, function(receipt){           
          for(var i=0 ; i < $scope.items.length ; i++){
            Item
              .create({
                name: $scope.items[i].name,
                price: $scope.items[i].price                
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
      $state.go('Receipts');
    };        
  }]);  