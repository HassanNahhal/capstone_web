'use strict';

 angular
  .module('app')
  .controller('AddTagController', [
    '$scope', 'Tag', '$state', '$rootScope', '$stateParams', 'ReceiptService', 
     function($scope, Tag, $state, $rootScope, $stateParams, ReceiptService) {      

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

    //console.log("$scope.tags: ", $scope.tags);  

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
  .controller('AllTagsController', [
  	'$scope', 'Tag', '$rootScope', '$stateParams', '$state', 'ReceiptService', 
    function($scope, Tag, $rootScope, $stateParams, $state, ReceiptService) {     

      $scope.groupName = $stateParams.groupName;

      var userId, groupId;
      if($stateParams.groupId == undefined){
        userId = $rootScope.currentUser.id;
        groupId = "";
      }else{
        userId = $stateParams.ownerId;
        groupId = $stateParams.groupId;
      }  

	    $scope.tags = Tag.find({
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

        $scope.Tags = function(){
          if($stateParams.groupId == undefined){
            $state.go('Tags');
          }else{
             $state.go('groupTags', groupParameters);
          }      
        }       

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