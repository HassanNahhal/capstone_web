'use strict';

 angular
  .module('app')
  .controller('AddTagController', [
    '$scope', 'Tag', '$state', '$rootScope', '$stateParams',
     function($scope, Tag, $state, $rootScope, $stateParams) {

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

    $scope.submitForm = function() {
      Tag
        .create({
          name: $scope.tagname,
          customerId: userId,
          groupId: groupId
        })
        .$promise
        .then(function() {
          $scope.Tags();
        });
    };

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
  	'$scope', 'Tag', '$rootScope', '$stateParams', '$state',  
    function($scope, Tag, $rootScope, $stateParams, $state) {

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

      $scope.actionTag = function(action, groupAction, tagId){
        if($stateParams.groupId == undefined){
           $state.go(
            action, 
            {
              'id': tagId
            }
          );
        }else{
           $state.go(
            groupAction, 
            {
              'id': tagId, 
              'groupId': $stateParams.groupId, 
              'groupName':  $stateParams.groupName,
              'ownerId': $stateParams.ownerId
            }
          );  
        } 
      }
 
      $scope.editTag = function(tagId){
        $scope.actionTag('editTag', 'groupEditTag', tagId);  
      }

      $scope.deleteTag = function(tagId){
        if(confirm("Are you sure?")){
          $scope.actionTag('deleteTag', 'groupDeleteTag', tagId);  
        }         
      }

  }])
  .controller('EditTagController', ['$scope', 'Tag', '$stateParams', '$state', '$location',  
      function($scope, Tag, $stateParams, $state, $location) {
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
            } 
          }        
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