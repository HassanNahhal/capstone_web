'use strict';

 angular
  .module('app')
  .controller('AddGroupController', ['$scope', 'Group','$state', 
    'CustomerGroup', 'Customer', '$rootScope',
    function($scope, Group, $state, CustomerGroup, Customer, $rootScope) {
    $scope.action = 'Add';
    $scope.group = {};
    $scope.isDisabled = true;
    var userId = $rootScope.currentUser.id;
    Customer
      .findById({
        id: userId,
        fields: {
          id: true,
          groupId: true
        }
      })
      .$promise
      .then(function(customer){
          if(customer.groupId === undefined || customer.groupId == "" ){
            $scope.isDisabled = false;
          }else{
            $scope.isDisabled = true;
            $state.go('Groups');            
          }        
      });

    $scope.submitForm = function() {
      Group
        .create({
          name: $scope.group.name                
        }, function(group){
          console.log('group id : ', group.id);
          CustomerGroup
            .create({
              customerId: userId,
              groupId: group.id
            })
            .$promise
            .then(function(){
                Customer.prototype$updateAttributes(
                    { id: userId }, { groupId: group.id }
                )
                .$promise
                .then(function(){
                  $state.go('Groups');
                })
            });
      });
    };
  }])  
  .controller('AllGroupsController', [
  	'$scope', 'Group', 'Customer', '$rootScope', 
    function($scope, Group, Customer, $rootScope) {      
      $scope.isDisabled = true;
      var userId = $rootScope.currentUser.id;
      Customer
        .findById({
          id: userId,
          filter: {
            include: {
              relation: 'groups',
              scope: {
                order: 'createdAt DESC', 
                fields: ['id', 'name'],
                limit: 1,
                include: 'grouptype'                
              }
            }
          }
        })
        .$promise
        .then(function(customer){
          $scope.groups = customer.groups;
          //console.log("customer-groups: ", customer);
          if(customer.groups.length > 0){
            $scope.isDisabled = true;
          }else{
            $scope.isDisabled = false;
          }
        });      
  }])
  .controller('EditGroupController', ['$scope', 'Group', '$stateParams', '$state', 
      function($scope, Group, $stateParams, $state) {
		    $scope.action = 'Edit';
        Group.findById({ id: $stateParams.id }).$promise
        .then(function(group){
          $scope.group = group;
        });
        
		    $scope.submitForm = function() {	
          $scope.group
            .$save()
            .then(function(){
               $state.go('Groups');
            });
		    };
  }])
  .controller('DeleteGroupController', ['$scope', 'Group', '$state',
      '$stateParams','Customer', '$rootScope',  
      function($scope, Group, $state, $stateParams, Customer, $rootScope) {
        var userId = $rootScope.currentUser.id;
        Group.customers.destroyAll({
          id: $stateParams.id
        })
        .$promise
        .then(function(){
          Group
            .deleteById({ id: $stateParams.id })
            .$promise
            .then(function() {
                Customer.prototype$updateAttributes(
                    { id: userId }, { groupId: "" }
                )
                .$promise
                .then(function(){
                  $state.go('Groups');
                });              
            });          
        });
  }]);