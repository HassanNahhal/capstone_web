'use strict';

 angular
  .module('app')
  .controller('AllReceiptsController', [
  	'$scope', 'Receipt', '$rootScope', '$stateParams', '$state', '$log', '$filter', 'Tag', 'Excel', '$timeout', 
     function($scope, Receipt, $rootScope, $stateParams, $state, $log, $filter, Tag, Excel, $timeout) {

      $scope.ownerId = $stateParams.ownerId;
      $scope.groupId = $stateParams.groupId;
      $scope.groupName = $stateParams.groupName;
      $scope.receipts = [];

      // Pagination
      $scope.pageUnits = [5, 10, 15, 20];
      $scope.pageSize = 10;
      $scope.currentPage = 0;    

      var userId, groupId;
      if($stateParams.groupId == undefined){
        userId = $rootScope.currentUser.id;
        groupId = "";
      }else{
        userId = $stateParams.ownerId;
        groupId = $stateParams.groupId;
      }

      Receipt.find({
        filter: {
          order: 'date DESC', 
          include: ['store', 'customer'],
          where: {and: [
            {customerId: userId},
            {groupId: groupId},
          ]}
        }
      })
      .$promise
      .then(function(receipts){
        $scope.receipts = receipts;
      }); 

      // Sorting
      $scope.tablehead = {
        'store.name': "Store",
        'total': "Total",
        'numberOfItem': "#Item(s)",
        'date': "Date"
      };

      $scope.sort = {
          column: 'date',
          descending: '-',
          symbol: true
      };

      $scope.exportToExcel=function(tableId){ 
            $scope.exportHref=Excel.tableToExcel(tableId,'Receipts');
            $timeout(function(){location.href=$scope.exportHref;},100); 
      };         

      $scope.commaSeparateNumber =   function(val){
        if(val != undefined){
          var tmp = ("" + val).split(".");
          var valComma;
          if(tmp.length>1){
            valComma = Math.floor(tmp[0]).toLocaleString();
            if(tmp[1].length > 1){
              valComma += "." + tmp[1].substring(0,2);
            }else{
              valComma += "." + tmp[1].substring(0,1) + "0";
            }
          }else{
            valComma = Math.floor(tmp[0]).toLocaleString() + ".00";
          }
          val = valComma;        
        }    
        return val;
      };   
      
      // Sorting
      $scope.selectedCls = function(column) {
          return column == $scope.sort.column && 'sort-' + $scope.sort.symbol;
      };

      $scope.sortColumn = 'date';
      $scope.sortDesc = true;
      $scope.changeSorting = function(column) {
          var sort = $scope.sort;
          if (sort.column == column) {
             if(sort.descending == ''){
                sort.descending = '-';
             }else{
                sort.descending = '';
             }
             sort.symbol = !sort.symbol;

             $scope.sortDesc = !$scope.sortDesc;
          } else {
              sort.column = column;
              sort.descending = '';
              sort.symbol = false;

              $scope.sortDesc = false;
          }
          switch(column){
            case 'store.name':
              $scope.sortColumn = 'store.name';
              break;
            case 'total':
              $scope.sortColumn = 'total';
              break;
            case 'numberOfItem':
              $scope.sortColumn = 'numberOfItem';
              break;
            case 'date':
              $scope.sortColumn = 'date';
              break;                            
          }
      };  
      // Sorting    

      //Pagination - angular
      $scope.getData = function(){
        return $filter('filter')($scope.receipts)
      }

      $scope.numberOfPages=function(){
          return Math.ceil($scope.getData().length/$scope.pageSize);                
      }
      //$scope.number = $scope.numberOfPages();
      $scope.getNumber = function(num) {
          return new Array(num);   
      }
      $scope.changePageSize = function(){
        $scope.currentPage = 0;
      }     
      //Pagination - angular

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
  .filter('startFrom', function() {
      return function(input, start) {
          start = +start; //parse to int
          return input.slice(start);
      }
  })
  .filter('receiptFilter', function(){
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
             return dataArray.filter(function(receipt){
                var total = "" + receipt.total;
                var name = receipt.store.name;
                var date = "" + receipt.date;
                var comment = "" + receipt.comment;
                var receiptInStore = name.toLowerCase().indexOf(term) > -1;
                var receiptInTotal = total.toLowerCase().indexOf(term) > -1;
                var receiptInDate = date.toLowerCase().indexOf(term) > -1;
                var receiptInComment = comment.toLowerCase().indexOf(term) > -1;
                return receiptInStore || receiptInTotal || receiptInDate || receiptInComment;
             });
        } 
    }
  })
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

    window.scrollTo(0,0); // Always move to top of page

    $scope.stores = [];
    $scope.selectedStore;
    $scope.selectedCategory;
    $scope.receipt = {};
    $scope.tags = [];  
    $scope.selectedTags=[];
    //$scope.selTagCount;  

    var userId, groupId;
    if($stateParams.groupId == undefined){
      userId = $rootScope.currentUser.id;
      groupId = "";
    }else{
      userId = $stateParams.ownerId;
      groupId = $stateParams.groupId;
    }  
    $scope.groupName = $stateParams.groupName;    
    $scope.userId = userId;
    $scope.groupId = groupId;

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
          //console.log("receipt: ", receipt);   
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
                //$scope.selTagCount=receipt.tags.length + " selected";
              }
            });

        });
    });

    $scope.commaSeparateNumber =   function(val){
      if(val != undefined){
          var tmp = ("" + val).split(".");
          var valComma;
          if(tmp.length>1){
            valComma = Math.floor(tmp[0]).toLocaleString();
            if(tmp[1].length > 1){
              valComma += "." + tmp[1].substring(0,2);
            }else{
              valComma += "." + tmp[1].substring(0,1) + "0";
            }
          }else{
            valComma = Math.floor(tmp[0]).toLocaleString() + ".00";
          }
          val = valComma;
          /*
          while (/(\d+)(\d{3})/.test(val.toString())){
            val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
          } 
          */        
      }
      return val;
    };     

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

    $scope.backToPage = function(){
      window.history.back();
    }
      
  }])
  .controller('ModalReceiptFileInstanceCtrl', [
    '$scope', '$state', '$modalInstance', 'params', 
    'Receipt', 'FileUploader', 'Container', '$rootScope', 'ReceiptService', 
      function($scope, $state, $modalInstance, params, Receipt, 
        FileUploader, Container, $rootScope, ReceiptService) {
      
      $scope.params = params;

      var userId = "";
      var repositoryPath = "";
      var storageId = "";     
      
      $scope.groupName = params.groupName;

      if(params.groupId == undefined){
        userId = params.ownerId;
        storageId = userId;
      }else{
        userId = params.ownerId;
        storageId = params.groupId;
      }        

      repositoryPath = storageId + '/'; 

      Container.getContainers(function(container){
        var isContainer = false;
        for(var i = 0; i < container.length; i++){
          if(container[i].name == storageId){
            isContainer = true;
            break;
          }           
        }
        if(isContainer == false){
          Container.createContainer({
            name: storageId
          },function(data){
              //console.log("new container: ", data);
            }
          );               
        }          
      });   

    // create a uploader with options
    var uploader = $scope.uploader = new FileUploader({
      scope: $scope,                          // to automatically update the html. Default: $rootScope
      url: '/api/containers/' + repositoryPath + 'upload',
      formData: [
        { key: 'value' }
      ]
    });

    // ADDING FILTERS
    uploader.filters.push({
        name: 'imageFilter',
        fn: function (item, options) { // second user filter
          var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
          return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
        }
    });  

    // REGISTER HANDLERS
    // --------------------
    uploader.onAfterAddingFile = function(item) {
      //console.info('After adding a file', item);      
      if((item.file.size/1024/1024)>2){
        ReceiptService.publicShowMessage('#invalidFileSizeMessage');
        uploader.queue = [];
      }else{
        $scope.disabled = true;
      }
    };
    // --------------------
    uploader.onAfterAddingAll = function(items) {
      //console.info('After adding all files', items);
    };
    // --------------------
    uploader.onWhenAddingFileFailed = function(item, filter, options) {
      //console.info('When adding a file failed', item);
    };
    // --------------------
    uploader.onBeforeUploadItem = function(item) {
      //console.info('Before upload', item);
    };
    // --------------------
    uploader.onProgressItem = function(item, progress) {
      $scope.disabled = true;
      //console.info('Progress: ' + progress, item);
    };
    // --------------------
    uploader.onProgressAll = function(progress) {
      //console.info('Total progress: ' + progress);
    };
    // --------------------
    uploader.onSuccessItem = function(item, response, status, headers) {
      //console.info('Success', response, status, headers); 
      $scope.disabled = true;          
      $scope.$broadcast('uploadCompleted', item);
    };
    //response.result.files.file[0].container
    //response.result.files.file[0].name --> filename
    //response.result.files.file[0].originalFilename --> original file name
    //   '/api/containers/575595b333f5bf0c15c0f272/download/default-user01_1468038941183.png'    
    // --------------------
    uploader.onErrorItem = function(item, response, status, headers) {
      $scope.disabled = true;
      //console.info('Error', response, status, headers);
    };
    // --------------------
    uploader.onCancelItem = function(item, response, status, headers) {
      //console.info('Cancel', response, status);
    };
    // --------------------
    uploader.onCompleteItem = function(item, response, status, headers) {
      //console.info('Complete', response, status, headers);
      $scope.disabled = true;   
      var filePath = '/api/containers/' + storageId + '/download/' + response.result.files.file[0].name;
      //console.log("receiptFile: ", filePath);
      $modalInstance.close(filePath);         
    };
    // --------------------
    uploader.onCompleteAll = function() {
      //console.info('Complete all');
    };
    // --------------------
    //console.info('uploader: ', uploader);

    $scope.close = function () {
      $modalInstance.dismiss('close');
    };
  }])  
  .controller('ModalTagReceiptsCtrl', function ($scope, $modal, $log) {

    $scope.open = function (tagId, userId, groupId, groupName) {

        $scope.params = {
          tagId: tagId,
          userId: userId,
          groupId: groupId,
          groupName: groupName
        };

        var modalInstance = $modal.open({
          templateUrl: 'ModalTagReceipts.html',
          controller: 'ModalTagReceiptsInstanceCtrl',
          size: 'lg',
          resolve: {
            params: function(){
              return $scope.params;
          }}
        });
      };
  })
  .controller('ModalTagReceiptsInstanceCtrl', [
    '$scope', '$state', '$modalInstance', 'params', 'Tag', '$filter', 'Excel', '$timeout', 
      function($scope, $state, $modalInstance, params, Tag, $filter, Excel, $timeout) {           

      $scope.receipts = [];
      $scope.userId = params.userId;
      $scope.groupId = params.groupId;
      $scope.groupName = params.groupName;
      $scope.tagId = params.tagId;

      Tag.find({
          filter: { 
              include: {
                relation: 'receipts',
                scope: {
                    include: {
                        relation: 'store'
                    }
                }
              },
              where: {and: [
                  {id: params.tagId},
                  {and: [
                      {customerId: params.userId},
                      {groupId: params.groupId}
                  ]}                  
              ]}
          }
      })
      .$promise
      .then(function(tags){
          $scope.tagname = tags[0].name;
          if(tags[0].receipts.length > 0){
            $scope.receipts = tags[0].receipts;
          }
      });    

      // Pagination
      $scope.pageUnits = [5, 10, 15];
      $scope.pageSize = 10;
      $scope.currentPage = 0; 

      // Sorting
      $scope.tablehead = {
        'store.name': "Store",
        'total': "Total",
        'numberOfItem': "#Item(s)",
        'date': "Date"
      };

      $scope.sort = {
          column: 'date',
          descending: '-',
          symbol: true
      };   

      $scope.exportToExcel=function(tableId, tagName){ 
            $scope.exportHref=Excel.tableToExcel(tableId,'Receipts in ' + tagName);
            $timeout(function(){location.href=$scope.exportHref;},100); 
      };         

      $scope.commaSeparateNumber =   function(val){
        if(val != undefined){
          var tmp = ("" + val).split(".");
          var valComma;
          if(tmp.length>1){
            valComma = Math.floor(tmp[0]).toLocaleString();
            if(tmp[1].length > 1){
              valComma += "." + tmp[1].substring(0,2);
            }else{
              valComma += "." + tmp[1].substring(0,1) + "0";
            }
          }else{
            valComma = Math.floor(tmp[0]).toLocaleString() + ".00";
          }
          val = valComma;        
        }
        return val;
      };       

      $scope.selectedCls = function(column) {
          return column == $scope.sort.column && 'sort-' + $scope.sort.symbol;
      };

      $scope.sortColumn = 'date';
      $scope.sortDesc = true;
      $scope.changeSorting = function(column) {
          var sort = $scope.sort;
          if (sort.column == column) {
             if(sort.descending == ''){
                sort.descending = '-';
             }else{
                sort.descending = '';
             }
             sort.symbol = !sort.symbol;

             $scope.sortDesc = !$scope.sortDesc;
          } else {
              sort.column = column;
              sort.descending = '';
              sort.symbol = false;

              $scope.sortDesc = false;
          }
          switch(column){
            case 'store.name':
              $scope.sortColumn = 'store.name';
              break;
            case 'total':
              $scope.sortColumn = 'total';
              break;
            case 'numberOfItem':
              $scope.sortColumn = 'numberOfItem';
              break;
            case 'date':
              $scope.sortColumn = 'date';
              break;                            
          }
      };  
      // Sorting 
      //Pagination - angular
      $scope.getData = function(){
        return $filter('filter')($scope.receipts)
      }

      $scope.numberOfPages=function(){
          return Math.ceil($scope.getData().length/$scope.pageSize);                
      }
      //$scope.number = $scope.numberOfPages();
      $scope.getNumber = function(num) {
          return new Array(num);   
      }
      $scope.changePageSize = function(){
        $scope.currentPage = 0;
      }     
      //Pagination - angular

      $scope.close = function () {
        $modalInstance.dismiss('close');
      };

      $scope.viewReceipt = function(receiptId){
        $modalInstance.close('viewReceipt');
        if($scope.groupId == undefined){
          $state.go('viewReceipt', {'id': receiptId});
        }else{
             $state.go(
              'groupViewReceipt', 
              {
                'id':         receiptId, 
                'groupId':    $scope.groupId, 
                'groupName':  $scope.groupName,
                'ownerId':    $scope.userId
              }
            );
        }        
      }      

  }]) 
  .controller('EditReceiptController', ['$scope', 'Receipt', '$state',
      '$stateParams', 'Store', 'Item', 'ReceiptItem', 'Category', 
      'Tag', 'ReceiptTag', '$location', '$rootScope', '$modal', 
      function($scope, Receipt, $state, $stateParams, Store, 
        Item, ReceiptItem, Category, Tag, ReceiptTag, $location, $rootScope, $modal) {   

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

    var userId, groupId;
    if($stateParams.groupId == undefined){
      userId = $rootScope.currentUser.id;
      groupId = "";
    }else{
      userId = $stateParams.ownerId;
      groupId = $stateParams.groupId;
    }  

    $scope.receiptId = $stateParams.id;
    $scope.groupId = $stateParams.groupId;
    $scope.groupName = $stateParams.groupName;
    $scope.ownerId = userId;

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
          //console.log("receipt: ", receipt);   
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

    $scope.backToPage = function(){
      window.history.back();
    }

    $scope.removePhoto = function(){
      $scope.receipt.imageFilePath = "";
    }

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

    } // $scope.getStoreCategories = function(storeId, categoryId){  

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
      // Add Item input form
      $scope.items.push({});
      if($scope.items.length > 0){ 
        $scope.delDisabled = false;
      }
    }

    $scope.spliceItem = function(){
      $scope.items.splice($scope.items.length-1, 1);
      if($scope.items.length < 1){ 
        $scope.delDisabled = $scope.isDisabled = true;
        $scope.receipt.numberOfItem = "";
        $scope.receipt.total = "";        
      }   
    }

    $scope.changeItemPrice = function(){
      $scope.totalprice=0;
      if($scope.items.length > 0){ 
        for(var i = 0 ; i < $scope.items.length ; i++){
          if($scope.items[i].price != undefined){
            $scope.totalprice += $scope.items[i].price;
          }
        };
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

    $scope.open = function (receiptId, groupId, groupName, ownerId) {

        $scope.params = {
          receiptId: receiptId,
          ownerId: ownerId,
          groupId: groupId,
          groupName: groupName
        };

        var modalInstance = $modal.open({
          templateUrl: 'ModalReceiptFile.html',
          controller: 'ModalReceiptFileInstanceCtrl',
          size: 'lg',
          resolve: {
            params: function(){
              return $scope.params;
          }}
        });

        modalInstance.result.then(function (imageFilePath) {
          $scope.receipt.imageFilePath = imageFilePath;
        }, function () {
        });

    };   

    $scope.checkValues = function(){

      if($scope.selectedStore == undefined ){
        $scope.showMessage('#invalidStoreMessage'); 
        return false;        
      }
      if($scope.selectedCategory == undefined ){
        $scope.showMessage('#invalidCategoryMessage'); 
        return false;        
      }
      var receiptDate = $('#receiptdate input').prop('value');
      if(receiptDate == undefined || receiptDate == ""){
        $scope.showMessage('#invalidDateMessage'); 
        return false;        
      }
      if($scope.receipt.total == undefined || $scope.receipt.total == "0"){
        $scope.showMessage('#invalidTotalMessage'); 
        return false;        
      }      
      if($scope.receipt.numberOfItem == undefined || $scope.receipt.numberOfItem == "0"){
        $scope.showMessage('#invalidNoItemMessage'); 
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
      //console.log("selectedCategory: ", $scope.selectedCategory);
      if($scope.selectedCategory !== undefined){
        $scope.receipt.categoryId = $scope.selectedCategory.id;
      }
      $scope.receipt.storeId = $scope.selectedStore.id;  

      if($scope.checkValues()){
        var receiptDate = $('#receiptdate input').prop('value');
        var temp_date = new Date(receiptDate);
        $scope.receipt.date = temp_date.setHours(temp_date.getHours() + 12);
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

          }); 
        });        
      }  //if($scope.checkValues()){
    };  // Submit()
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

    $scope.backToPage = function(){
      window.history.back();
    }
         
    $scope.showMessage = function(flashMessage){
      $(flashMessage).addClass("in"); 
      window.setTimeout(function(){
        $(flashMessage).removeClass("in"); 
      }, 3000);        
    }    

    // Get categories by selected store using Controller's function (but duplicated)
    $scope.getStoreCategories = function(storeId, categoryId){

        if(storeId == null){
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

    } //$scope.getStoreCategories = function(storeId, categoryId){

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
      // Add Item input form
      $scope.items.push({});
      if($scope.items.length > 0){ 
        $scope.delDisabled = false;
      };
       $scope.changeItemPrice();
    };

    $scope.spliceItem = function(){
      $scope.items.splice($scope.items.length-1, 1);
      if($scope.items.length < 1){ 
        $scope.delDisabled = $scope.isDisabled = true;
        $scope.receipt.numberOfItem="" ;
        $scope.receipt.total="";         
      };
       $scope.changeItemPrice();
    };        

    $scope.changeItemPrice = function(){
      $scope.totalprice=0;
      if($scope.items.length > 0){ 
        for(var i = 0 ; i < $scope.items.length ; i++){
          if($scope.items[i].price != undefined){
            $scope.totalprice += $scope.items[i].price;
          }
        };
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

    $scope.checkValues = function(){

      if($scope.selectedStore == undefined ){
        $scope.showMessage('#invalidStoreMessage'); 
        return false;        
      }
      if($scope.selectedCategory == undefined ){
        $scope.showMessage('#invalidCategoryMessage'); 
        return false;        
      }
      var receiptDate = $('#receiptdate input').prop('value');
      if(receiptDate == undefined || receiptDate == ""){
        $scope.showMessage('#invalidDateMessage'); 
        return false;        
      }
      if($scope.receipt.total == undefined || $scope.receipt.total == "0"){
        $scope.showMessage('#invalidTotalMessage'); 
        return false;        
      }      
      if($scope.receipt.numberOfItem == undefined || $scope.receipt.numberOfItem == "0"){
        $scope.showMessage('#invalidNoItemMessage'); 
        return false;        
      }      

      return true;            
    } //$scope.checkValues = function(){

    $scope.submitForm = function() {

      if($scope.checkValues()){

        var receiptDate = $('#receiptdate input').prop('value');
        var temp_date = new Date(receiptDate);
        $scope.receipt.date = temp_date.setHours(temp_date.getHours() + 12);        

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

      } // if($scope.checkValues){
 
    };  // $scope.submitForm = function() {
  }]);  