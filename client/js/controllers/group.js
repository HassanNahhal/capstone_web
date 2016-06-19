'use strict';

 angular
  .module('app')
  .controller('AddGroupController', ['$scope', 'Group','$state', 
    'CustomerGroup', 'Customer', '$rootScope', 'GroupType', 
    function($scope, Group, $state, CustomerGroup, Customer, $rootScope, GroupType) {
    $scope.action = 'Add';
    $scope.group = {};
    $scope.isDisabled = true;
    var userId = $rootScope.currentUser.id;

    // Find group whose owner is current user
    Customer
      .findById({
        id: userId,
        filter: {
          include: {
            relation: 'groups',
            scope: {
              order: 'createdAt DESC', 
              fields: ['id', 'name', 'ownerId'],
              include: 'grouptype',
              where: {ownerId: userId}                
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
          $state.go('Groups');
        }else{
          $scope.isDisabled = false;
        }
      });      

    $scope.submitForm = function() {

      // Get the default group limitation
      // 5 members and 50 receipts
      var defaultGroupTypeId = "";
      GroupType
      .find({
        filter: {
          where: {
            and: [
              {limitedMember: '5'}, 
              {limitedReceipt: '50'}
            ]
          }
        }
      })
      .$promise
      .then(function(grouptype){
        //console.log("grouptype: ", grouptype);
        if(grouptype.length>0){
          defaultGroupTypeId = grouptype[0].id;  
        }  
        //console.log("defaultGroupTypeId: ", defaultGroupTypeId);
        // Create Group and also make relation with customer
        Group
          .create({
            name: $scope.group.name,
            ownerId: userId,
            groupTypeId: defaultGroupTypeId           
          }, function(group){
            //console.log('group id : ', group.id);
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

      });   
    };
  }])  
  .controller('AllGroupsController', [
  	'$scope', 'Group', 'Customer', '$rootScope', 
    function($scope, Group, Customer, $rootScope) { 

      $scope.isDisabled = true;
      var userId = $rootScope.currentUser.id;
      $scope.groupsinmember = [];
      $scope.groups = [];
      // Find Group whose owner is current logged in user
      Customer
        .findById({
          id: userId,
          filter: {
            include: {
              relation: 'groups',
              scope: {
                //order: 'createdAt DESC', 
                fields: ['id', 'name', 'ownerId'],
                include: 'grouptype'
                //, where: {ownerId: userId}                
              }
            }
          }
        })
        .$promise
        .then(function(customer){
          //console.log("customer-groups: ", customer);
          if(customer.groups.length > 0){
            var isOwner = false;
            for(var i = 0 ; i < customer.groups.length ; i++){
              if(customer.groups[i].ownerId == userId){
                isOwner = true;
                $scope.groups.push(customer.groups[i]);
              }else{
                $scope.groupsinmember.push(customer.groups[i]);
              }
            }
            //console.log("owner groups: ", $scope.groups);
            //console.log("member groups: ", $scope.groupsinmember);
            if(isOwner){
              $scope.isDisabled = true;
            }else{
              $scope.isDisabled = false;
            }            
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

        $scope.deleteGroup = function(){
          if(confirm("Are you sure?")){
               $location.path('/deleteGroup/' + $scope.group.id);    
          }         
        }        
        
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