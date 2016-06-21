'use strict';

 angular
  .module('app')
  .controller('AddTagController', ['$scope', 'Tag',
      '$state', '$rootScope', function($scope, Tag, $state, $rootScope) {
    $scope.action = 'Add';
    $scope.tag = {};

    $scope.submitForm = function() {
      Tag
        .create({
          name: $scope.tagname,
          customerId: $rootScope.currentUser.id
        })
        .$promise
        .then(function() {
          $state.go('Tags');
        });
    };
  }])  
  .controller('AllTagsController', [
  	'$scope', 'Tag', '$rootScope', function($scope, Tag, $rootScope) {
	    $scope.tags = Tag.find({
        filter: {
          order: 'name ASC',
          where: {customerId: $rootScope.currentUser.id}
        }
      });
  }])
  .controller('EditTagController', ['$scope', 'Tag', '$stateParams', '$state', '$location',  
      function($scope, Tag, $stateParams, $state, $location) {
		    $scope.action = 'Edit';
        $scope.tag = {};

        Tag.findById({ id: $stateParams.id })
        .$promise
        .then(function(tag){
          $scope.tag = tag;
          $scope.tagname = tag.name;
        });  

        $scope.deleteTag = function(){
          if(confirm("Are you sure?")){
               $location.path('/deleteTag/' + $scope.tag.id);    
          }         
        }         

		    $scope.submitForm = function() {				
          Tag.prototype$updateAttributes(
              { id:$stateParams.id }, { name: $scope.tagname }
          )
          .$promise
          .then(function(){
            $state.go('Tags');
          });
		    };
  }])
  .controller('DeleteTagController', ['$scope', 'Tag', '$state',
      '$stateParams', function($scope, Tag, $state, $stateParams) {
    Tag
      .deleteById({ id: $stateParams.id })
      .$promise
      .then(function() {
        $state.go('Tags');
      });
  }]);