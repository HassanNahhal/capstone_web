'use strict';

 angular
  .module('app')
  .controller('AddTagController', ['$scope', 'Tag',
      '$state', function($scope, Tag, $state) {
    $scope.action = 'Add';
    $scope.tag = {};

    $scope.submitForm = function() {
      Tag
        .create({
          name: $scope.tagname
        })
        .$promise
        .then(function() {
          $state.go('Tags');
        });
    };
  }])  
  .controller('AllTagsController', [
  	'$scope', 'Tag', function($scope, Tag) {
	    $scope.tags = Tag.find({filter: {order: 'name ASC'}});
  }])
  .controller('EditTagController', ['$scope', 'Tag', '$stateParams', '$state', 
      function($scope, Tag, $stateParams, $state) {
		    $scope.action = 'Edit';

        Tag.findById({ id: $stateParams.id }).$promise
        .then(function(tag){
          $scope.tagname = tag.name;
        });  

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