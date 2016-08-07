'use strict';

 angular
  .module('app')
  .controller('AddTagController', [
    '$scope', 'Tag', '$state', '$rootScope', '$stateParams', 'ReceiptService', 
     function($scope, Tag, $state, $rootScope, $stateParams, ReceiptService) {  

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

    $scope.groupName = $stateParams.groupName;

    var userId, groupId;
    if($stateParams.groupId == undefined){
      userId = $rootScope.currentUser.id;
      groupId = "";
    }else{
      userId = $stateParams.ownerId;
      groupId = $stateParams.groupId;
    }      

    $scope.action = 'Add';
    $scope.tag = {};

    $scope.tags = Tag.find({
      filter: {
        fields: { "id": true, "name": true},
        order: 'name ASC',
          where: {and: [
            {customerId: userId},
            {groupId: groupId}
          ]}
      }
    });  
      
    $scope.backToPage = function(){
      window.history.back();
    }

    $scope.submitForm = function() {
      var newTagName = (($scope.tagname).trim()).toLowerCase();
      var tagName;
      var isNewTagName = false;
      if($scope.tags.length > 0){
        var isExist = false;
        for(var i = 0 ; i < $scope.tags.length ; i++){
          tagName = (($scope.tags[i].name).trim()).toLowerCase();
          if(tagName == newTagName){
            ReceiptService.publicShowMessage('#addTagErrorMessage');
            isExist = true;
            break;
          }
        } // for(var i = 0 ; i < $scope.tags.length ; i++){
        isNewTagName = !isExist;
      }else{
        isNewTagName = true;
      } // if($scope.tags.length > 0){
      if(isNewTagName){
        Tag
          .create({
            name: newTagName,
            customerId: userId,
            groupId: groupId
          })
          .$promise
          .then(function() {
            $scope.Tags();
          });          
      } // if(isNewTagName){
    };  // $scope.submitForm = function() {

    $scope.Tags = function(){
      if($stateParams.groupId == undefined){
        $state.go('Tags');
      }else{
         $state.go(
          'groupTags', 
          {
            'groupId': $stateParams.groupId, 
            'ownerId': $stateParams.ownerId
          }
        );
      }      
    }

  }])  
  .filter('startFrom', function() {
      return function(input, start) {
          start = +start; //parse to int
          return input.slice(start);
      }
  })
  .filter('tagFilter', function(){
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
             return dataArray.filter(function(tag){
                var name = tag.name;
                var tagName = name.toLowerCase().indexOf(term) > -1;
                return tagName;
             });
        } 
    }
  })  
  .controller('AllTagsController', [
  	'$scope', 'Tag', '$rootScope', '$stateParams', '$state', 'ReceiptService', '$filter', 
    function($scope, Tag, $rootScope, $stateParams, $state, ReceiptService, $filter) {  

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

      $scope.tags = [];
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
        $scope.lineNum = tags.length;
        $scope.changePageRelocateFooter();
      });

      //Pagination - angular
      $scope.getData = function(){
        if($scope.searchText == undefined || $scope.searchText == ''){
          return $filter('filter')($scope.tags);
        }else{
          return $filter('tagFilter')($scope.tags, $scope.searchText);
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
      
      $scope.addTag = function(){
        if($stateParams.groupId == undefined){
          $state.go('addTag');
        }else{
             $state.go(
              'groupAddTag', 
              {
                'groupId':    $stateParams.groupId, 
                'groupName':  $stateParams.groupName,
                'ownerId':    $stateParams.ownerId
              }
            );
        }
      }
 
      $scope.editTag = function(tagId){
        //$scope.actionTag('editTag', 'groupEditTag', tagId);  
        if($stateParams.groupId == undefined){
           $state.go(
            'editTag', 
            {
              'id': tagId
            }
          );
        }else{
           $state.go(
            'groupEditTag', 
            {
              'id': tagId, 
              'groupId': $stateParams.groupId, 
              'groupName':  $stateParams.groupName,
              'ownerId': $stateParams.ownerId
            }
          );  
        } //if($stateParams.groupId == undefined){        
      }

      $scope.deleteTag = function(tagId){
        if(confirm("Are you sure?")){
          //$scope.actionTag('deleteTag', 'groupDeleteTag', tagId);  
          Tag.findById({
            id: tagId,
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
          .then(function(tag){
            if(tag.receipts.length > 0){
              ReceiptService.publicShowMessage('#deleteTagErrorMessage');
            }else if(tag.receipts.length === 0){
              if($stateParams.groupId == undefined){
                 $state.go(
                  'deleteTag', 
                  {
                    'id': tagId
                  }
                );
              }else{
                 $state.go(
                  'groupDeleteTag', 
                  {
                    'id': tagId, 
                    'groupId': $stateParams.groupId, 
                    'groupName':  $stateParams.groupName,
                    'ownerId': $stateParams.ownerId
                  }
                );  
              } //if($stateParams.groupId == undefined){
            } //else if(tag.receipts.length === 0){
          }); // Tag.findById({           
        }  // if(confirm("Are you sure?")){       
      } // $scope.deleteTag = function(tagId){

  }])
  .controller('EditTagController', ['$scope', 'Tag', '$stateParams', '$state', '$location', 'ReceiptService',  
      function($scope, Tag, $stateParams, $state, $location, ReceiptService) {

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
        $scope.tag = {};
        $scope.groupName = $stateParams.groupName;

        Tag.findById({ id: $stateParams.id })
        .$promise
        .then(function(tag){
          $scope.tag = tag;
          $scope.tagname = tag.name;
        });

        var groupParameters;
        if($stateParams.groupId != undefined){
          groupParameters = {
                'groupId': $stateParams.groupId, 
                'groupName': $stateParams.groupName, 
                'ownerId': $stateParams.ownerId
              };
        } 

        //console.log("groupParameters: ", groupParameters);       

        $scope.backToPage = function(){
          window.history.back();
        }
        
        $scope.Tags = function(){
          if($stateParams.groupId == undefined){
            $state.go('Tags');
          }else{
             $state.go('groupTags', groupParameters);
          }      
        } 

        $scope.disableDelete = true;
        $scope.delTooltip = '';
        $scope.isAllowedToDelete = function(){
          Tag.findById({
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
          .then(function(tag){
            if(tag.receipts.length > 0){
              $scope.disableDelete = true;
              $scope.delTooltip = 'Tag has been used by receipt(s)';
            }else{
              $scope.disableDelete = false;
              $scope.delTooltip = '';
            } //if(tag.receipts.length > 0){
          }); // Tag.findById({      
        }    
        $scope.isAllowedToDelete();

        $scope.deleteTag = function(){

          if(confirm("Are you sure?")){
            Tag.findById({
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
            .then(function(tag){
              if(tag.receipts.length > 0){
                ReceiptService.publicShowMessage('#deleteTagErrorMessage');
              }else if(tag.receipts.length === 0){
                if($stateParams.groupId == undefined){
                   $state.go(
                    'deleteTag', 
                    {
                      'id': $stateParams.id
                    }
                  );
                }else{
                  groupParameters['id'] = $stateParams.id;
                  $state.go('groupDeleteTag', groupParameters);
                } // if($stateParams.groupId == undefined){
              } //else if(tag.receipts.length === 0){
            }); // Tag.findById({
          } // if(confirm("Are you sure?")){    
        }                   

		    $scope.submitForm = function() {				
          Tag.prototype$updateAttributes(
              { id:$stateParams.id }, { name: $scope.tagname }
          )
          .$promise
          .then(function(){
            $scope.Tags();
          });
		    };
  }])
  .controller('DeleteTagController', ['$scope', 'Tag', '$state', '$stateParams', 
    function($scope, Tag, $state, $stateParams) {

        Tag
          .deleteById({ id: $stateParams.id })
          .$promise
          .then(function() {
            if($stateParams.groupId == undefined){
              $state.go('Tags');
            }else{
               $state.go(
                'groupTags', 
                {
                  'groupId': $stateParams.groupId, 
                  'groupName': $stateParams.groupName, 
                  'ownerId': $stateParams.ownerId
                }
              );
            }
          });

  }]);