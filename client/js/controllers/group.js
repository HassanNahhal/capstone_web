'use strict';

 angular
  .module('app')
  .controller('AllGroupsController', ['$state', '$scope', 'Group', 'Customer', 
    '$rootScope', 'Notification', 'CustomerGroup', 
    function($state, $scope, Group, Customer, $rootScope, Notification, CustomerGroup) {       
      
      var userId = $rootScope.currentUser.id;
      $scope.isDisabled = true;
      $scope.groupsinmember;
      $scope.groups;
      $scope.notifications;
      $scope.requestleaveFromMember;
      $scope.noticeLeaveByOnwer;
      $scope.memberNotifications;
      var fromMemberLeaveGroup = {};

      // from member notification (Leave Group)
      Notification.find({
        filter: {
          where: { and: [
            {senderId: userId},
            {removeFromMember: true}                  
          ]}
        }
      })
      .$promise
      .then(function(memberNotifications){
        console.log("memberNotifications: ", memberNotifications);
        $scope.memberNotifications = memberNotifications;
        if(memberNotifications.length > 0){
          var groupId;
          for(var i = 0 ; i < memberNotifications.length ; i++){
            groupId = memberNotifications[i].groupId;
            fromMemberLeaveGroup[groupId] = {
              rejectLeaveGroup: memberNotifications[i].rejectLeaveGroup,
              removeFromMember: memberNotifications[i].removeFromMember,
              notificationId: memberNotifications[i].id
            };
          }
          console.log("fromMemberLeaveGroup: ", fromMemberLeaveGroup);
        }
      }); // Notification.find({      

      // Find invitation notification
      Notification.find({
        filter: {
          where: { and: [
            {receiverId: userId},
            {seen: false}                  
          ]}
        }
      })
      .$promise
      .then(function(notifications){
        console.log("notifications: ", notifications);
        if(notifications.length > 0){
          $scope.notifications = notifications;

          var groupIDs = notifications.map(function(notification){
            return notification.groupId;
          });
          //console.log("groupIDs: ", groupIDs);
          Group.find({
            filter: {
              include: 'grouptype',                  
              where: {
                id: {inq: groupIDs}
              }
            }
          })
          .$promise
          .then(function(groups){
            //console.log("groups: ", groups);
            for(var i = 0 ; i < notifications.length ; i++){
              $scope.notifications[i].group = groups[i];
            }
          });
        }
      }); // Notification.find({

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
          console.log("customer-groups: ", customer);
          if(customer.groups.length > 0){
            var isOwner = false;
            var groups = [];
            var memberInGroups = [];
            var requestleaveFromMember = [];
            var noticeLeaveByOnwer = [];            
            var groupID;
            for(var i = 0 ; i < customer.groups.length ; i++){
                groupID = customer.groups[i].id
                if(fromMemberLeaveGroup[groupID] == undefined){
                  customer.groups[i]['leaveGroup'] = true;
                }else if(fromMemberLeaveGroup[groupID].removeFromMember == true && 
                  fromMemberLeaveGroup[groupID].rejectLeaveGroup == false){
                  customer.groups[i]['leaveGroup'] = false;
                }else if(fromMemberLeaveGroup[groupID].removeFromMember == true && 
                  fromMemberLeaveGroup[groupID].rejectLeaveGroup == true){
                  customer.groups[i]['leaveGroup'] = true;
                  customer.groups[i]['notificationId'] = fromMemberLeaveGroup[groupID].notificationId;
                }

              if(customer.groups[i].ownerId == userId){
                isOwner = true;

                groups.push(customer.groups[i]);
                //$scope.groups.push(customer.groups[i]);
              }else{
                memberInGroups.push(customer.groups[i]);
                //$scope.groupsinmember.push(customer.groups[i]);
              }
            }
            if(groups.length > 0){
              $scope.groups = groups;
            }
            if(memberInGroups.length > 0){
              $scope.groupsinmember = memberInGroups;
            }
            //console.log("owner groups: ", $scope.groups);
            console.log("member groups: ", $scope.groupsinmember);
            if(isOwner){
              $scope.isDisabled = true;
            }else{
              $scope.isDisabled = false;
            }            
          }else{
            $scope.isDisabled = false;
          } // if(customer.groups.length > 0){

        });  //.then(function(customer){

        $scope.leaveGroup = function(flashMessageId, groupId, ownerId){
          if(confirm("Are you sure?")){
            var index = $scope.groupsinmember.map(function(groupsinmember){
              return groupsinmember.id;
            }).indexOf(groupId); 
            if($scope.groupsinmember[index].notificationId != undefined){
              Notification.prototype$updateAttributes(
                  { id: $scope.groupsinmember[index].notificationId }, 
                  { 
                    rejectLeaveGroup: false
                  }
              )
              .$promise
              .then(function(result){
                  $scope.showMessage(flashMessageId); 
                  $scope.groupsinmember[index].leaveGroup = false;
              }); // Notification.prototype$updateAttributes(
            }else{
                Customer.findById({
                  id: ownerId,
                  filter: {
                    fields: { id: true, email: true}
                  }
                })
                .$promise
                .then(function(customer){
                  Notification
                  .create({
                    senderId:           $rootScope.currentUser.id,
                    senderEmail:        $rootScope.currentUser.email,
                    receiverId:         ownerId,
                    receiverEmail:      customer.email,
                    groupId:            groupId,
                    removeFromMember:   true
                  })
                  .$promise
                  .then(function(notification){
                    $scope.showMessage(flashMessageId); 
                    $scope.groupsinmember[index].leaveGroup = false;
                  }); // .then(function(notification){
              }) // .then(function(customer){
            } // }else{
          } // if(confirm("Are you sure?" + groupId)){
        }  // $scope.leaveGroup = function(flashMessageId, groupId, ownerId){        

      $scope.groupReceipts = function(groupId, ownerId, groupName){
        //alert("groupId: " + groupId);
        $state.go('groupReceipts', {'groupId': groupId, 'ownerId': ownerId, 'groupName': groupName});
      }

      $scope.backToPage = function(){
        window.history.back();
      }

      $scope.acceptJoin = function(notificationId){
        if(confirm("Are you joining this group?")){
            var index = $scope.notifications.map(function(notification){
              return notification.id;
            }).indexOf(notificationId);
            CustomerGroup.create({
              customerId: userId,
              groupId: $scope.notifications[index].groupId
            })
            .$promise
            .then(function(response){
              Notification.prototype$updateAttributes(
                  { id:notificationId }, 
                  { 
                    seen: true,
                    accepted: true
                  }
              )
              .$promise
              .then(function(result){
                //Delete notification (no necessary any more)
                Notification.deleteById({id: notificationId})
                  .$promise
                  .then(function(){
                    if($scope.groupsinmember == undefined){
                      $scope.groupsinmember = [];              
                    }
                    $scope.notifications[index].group['leaveGroup'] = true;
                    $scope.groupsinmember.push($scope.notifications[index].group);
                    $scope.notifications.splice(index, 1);
                    if($scope.notifications.length == 0){
                      $scope.notifications = null;
                    }
                    $scope.showMessage("#acceptInvitation");
                  }); // .then(function(){
              }); // .then(function(result){
            }); // .then(function(response){
        } // if(confirm("Are you join this group?")){
      } //$scope.acceptJoin = function(notificationId){
        
      $scope.refuseJoin = function(notificationId){
        if(confirm("Are you sure?")){

            var index = $scope.notifications.map(function(notification){
              return notification.id;
            }).indexOf(notificationId);
            //console.log("$scope.groupsinmember: ", $scope.groupsinmember);

              Notification.prototype$updateAttributes(
                  { id:notificationId }, 
                  { 
                    seen: true,
                    left: true
                  }
              )
              .$promise
              .then(function(result){
                console.log("result: ", result);
                if($scope.groupsinmember == undefined){
                  $scope.groupsinmember = [];              
                }
                //$scope.groupsinmember.push($scope.notifications[index].group);
                $scope.notifications.splice(index, 1);
                if($scope.notifications.length == 0){
                  $scope.notifications = null;
                }
                $scope.showMessage("#refuseInvitation");                 
              });

        } // if(confirm("Are you join this group?")){

      } //$scope.refuseJoin = function(notificationId){

      $scope.showMessage = function(flashMessage){
        $(flashMessage).addClass("in"); 
        window.setTimeout(function(){
          $(flashMessage).removeClass("in"); 
        }, 4000);          
      } 

  }])  
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
            description: $scope.group.description,
            type: "owner",
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
  .controller('ViewGroupController', ['$scope', 'Group', 
      '$stateParams', '$state', '$rootScope', 'Customer', 'Notification', 
      'CustomerGroup', function($scope, Group, $stateParams, 
        $state, $rootScope, Customer, Notification, CustomerGroup) {

        $scope.isEnabled = false;
        $scope.isLeave = false;
        $scope.email;
        $scope.members;
        $scope.group;

        var userId = $rootScope.currentUser.id

        Group.findById({
         id: $stateParams.id, 
         filter: {
            include: ['grouptype', 'customers']
         }
        })
        .$promise
        .then(function(group){

          $scope.group = group;
          console.log("$scope.group: ", $scope.group);
          //if current user is the owner of group
          //enable invite member and show the member list of group        
          if(group.ownerId == userId){
            $scope.isEnabled = true;
          }else{
            $scope.isLeave = true;
          }  
          //Group members
          if(group.customers.length > 1){
            $scope.members = [];

            for(var i = 0 ; i < group.customers.length ; i++){
              if(group.customers[i].id != userId){
                $scope.members.push(group.customers[i]);
                if(group.ownerId == group.customers[i].id){
                  $scope.group.ownerEmail = group.customers[i].email;
                }
              }
            }         
          }
        });

        $scope.leaveGroup = function(flashMessageId){
          if(confirm("Are you sure?")){

            Notification
            .create({
              senderId:           $rootScope.currentUser.id,
              senderEmail:        $rootScope.currentUser.email,
              receiverId:         $scope.group.ownerId,
              receiverEmail:      $scope.group.ownerEmail,
              groupId:            $scope.group.id,
              removeFromMember:   true
            })
            .$promise
            .then(function(notification){
              $scope.showMessage(flashMessageId);
              window.setTimeout(function(){
                $state.go('Groups');
              }, 3500);                    
            });   
        


            /*
            CustomerGroup
              .find({
                filter: {
                  where: {and: [
                    {customerId: userId},
                    {groupId: $scope.group.id}
                  ]}
                }
              })
              .$promise
              .then(function(customergroup){                
                if(customergroup.length != 0){
                  CustomerGroup
                    .deleteById({ id: customergroup[0].id })
                    .$promise
                    .then(function(){
                      $state.go('Groups');
                    });
                }
              });  // .then(function(customergroup){
            */

          } // if(confirm("Are you sure?" + groupId)){
        }


        $scope.showMessage = function(flashMessage){
          $(flashMessage).addClass("in"); 
          window.setTimeout(function(){
            $(flashMessage).removeClass("in"); 
          }, 3300);          
        }         
        
  }])  
  .controller('EditGroupController', ['$scope', 'Group', '$stateParams', 
    '$state', '$rootScope', 'Customer', 'Notification', 'CustomerGroup', '$location', 'ReceiptService', 
      function($scope, Group, $stateParams, $state, $rootScope, 
        Customer, Notification, CustomerGroup, $location, ReceiptService) {

		    $scope.action = 'Edit';
        $scope.isEnabled = false;
        $scope.email;
        $scope.members;
        $scope.group;
        $scope.notifications;

        Group.findById({
         id: $stateParams.id, 
         filter: {
            include: [
              {
                relation: 'grouptype'
              }, 
              { 
                relation: 'customers',
                scope: {
                  fields: ['id', 'email']
                }
              }
            ]
         }
        })
        .$promise
        .then(function(group){
          $scope.group = group;
          //if current user is the owner of group
          //enable invite member and show the member list of group        
          if(group.ownerId == $rootScope.currentUser.id){
            $scope.isEnabled = true;
          }  
          //Group members
          if(group.customers.length > 1){
            $scope.members = [];
            for(var i = 0 ; i < group.customers.length ; i++){
              if(group.customers[i].id != $rootScope.currentUser.id){
                $scope.members.push(group.customers[i]);
              }
            }
          }
          //Find invite notification from Group owner
          Notification.find({
            filter: {
              where: { and: [
                {senderId: $rootScope.currentUser.id},
                {groupId: group.id}           
              ]}
            }
          })
          .$promise
          .then(function(notifications){
            console.log("owner-notifications: ", notifications);
            $scope.notifications = notifications;
            if($scope.notifications.length > 0){
              for(var i = 0 ; i < $scope.notifications.length ; i++){
                if($scope.notifications[i].accepted == false){
                  if($scope.notifications[i].seen == true && 
                      $scope.notifications[i].left == true){
                    $scope.notifications[i].display = 
                      $scope.notifications[i].receiverEmail + " (refused)";
                  }else if($scope.notifications[i].seen == false && 
                            $scope.notifications[i].left == true){
                    $scope.notifications[i].display = 
                      $scope.notifications[i].receiverEmail + " (refused - invite again)";
                  }else{
                    $scope.notifications[i].display = $scope.notifications[i].receiverEmail;
                  }                  
                }//if($scope.notifications[i].accepted == false){
              } // for(var i = 0 ; i < $scope.notifications.length ; i++){
            } // if($scope.notifications.length > 0){
          });
          //Notification from member
          Notification.find({
            filter: {
              where: { and: [
                {receiverId: $rootScope.currentUser.id},
                {and: [
                  {removeFromMember: true},
                  {groupId: group.id}           
                ]}                
              ]}
            }
          })
          .$promise
          .then(function(notifications){
            console.log("member-notifications: ", notifications);            
            if(notifications.length > 0){
              $scope.memberNotifications = notifications;
              for(var i = 0 ; i < $scope.memberNotifications.length ; i++){
                if($scope.memberNotifications[i].removeFromOwner == false && 
                    $scope.memberNotifications[i].rejectLeaveGroup == false){
                    $scope.memberNotifications[i].display = 
                      $scope.memberNotifications[i].senderEmail + " (request of leaving group)";                
                }else if($scope.memberNotifications[i].removeFromOwner == false && 
                    $scope.memberNotifications[i].rejectLeaveGroup == true){
                    $scope.memberNotifications[i].display = 
                      $scope.memberNotifications[i].senderEmail + " (reject leaving group)";
                } //if($scope.memberNotifications[i].removeFromOwner == false){
              } // for(var i = 0 ; i < $scope.memberNotifications.length ; i++){
            } // if($scope.memberNotifications.length > 0){            
          });
        }); // .then(function(group){

        $scope.backToPage = function(){
          window.history.back();
        }

        // reject request leaving Group
        $scope.rejectLeaveGroup = function(notificationId){
          if(confirm("Are you going to request to cancel leaving group?")){

            var index = $scope.memberNotifications.map(function(notification){
              return notification.id;
            }).indexOf(notificationId);

            Notification.prototype$updateAttributes(
                { id: notificationId }, 
                { 
                  rejectLeaveGroup: true
                }
            ).$promise
            .then(function(response){
              $scope.memberNotifications[index].display = 
                    $scope.memberNotifications[index].receiverEmail + " (request - cancel leave group)"
              $scope.memberNotifications[index].rejectLeaveGroup = true;
              $scope.showMessage("#cancelLeavingRequest");
            });
          }
        } // $scope.rejectLeaveGroup = function(notificationId){

        // accept request of leaving Group and Remove Member
        $scope.acceptLeaveAndRemoveMember = function(memberId, notificationId){
          if(confirm("Are you sure?")){
              $scope.removeLeavingGroupList(memberId);          
              $scope.deleteMemberFromGroup(memberId);
          } // if(confirm("Are you sure?")){
        } // $scope.acceptLeaveAndRemoveMember = function(memberId){

        $scope.removeLeavingGroupList = function(memberId){
          var index = $scope.memberNotifications.map(function(notification){
            return notification.senderId;
          }).indexOf(memberId);
          if($scope.memberNotifications[index] != undefined){
            var notificationId = $scope.memberNotifications[index].id;
            Notification.deleteById({id: notificationId})
              .$promise
              .then(function(){
                $scope.memberNotifications.splice(index, 1);
                if($scope.memberNotifications.length == 0){
                  $scope.memberNotifications = null;
                }                
                $scope.showMessage("#removeLeavingRequest");               
              });              
          }          
        } // $scope.removeLeavingGroupList = function(memberId){

        $scope.deleteMemberFromGroup = function(memberId){
          CustomerGroup
            .find({
              filter: {
                where: {and: [
                  {customerId: memberId},
                  {groupId: $scope.group.id}
                ]}
              }
            })
            .$promise
            .then(function(customergroup){                
              if(customergroup.length != 0){
                CustomerGroup
                  .deleteById({ id: customergroup[0].id })
                  .$promise
                  .then(function(){
                    var index = $scope.members.map(function(customer){
                      return customer.id;
                    }).indexOf(memberId);
                    $scope.members.splice(index, 1);
                    if($scope.members.length == 0){
                      $scope.members = null;
                    }
                    $scope.showMessage("#removeMember"); 
                  });
              }
            });  // .then(function(customergroup){ 
        } // $scope.deleteMemberFromGroup = function(memberId){
        
        $scope.removeMember = function(memberId){
          if(confirm("Are you sure?")){
            $scope.deleteMemberFromGroup(memberId);  
            $scope.removeLeavingGroupList(memberId);                     
          } // if(confirm("Are you sure?")){
        } // $scope.removeMember = function(memberId){

        $scope.removeInvitation = function(memberId){
          if(confirm("Are you sure?")){
            var index = $scope.notifications.map(function(notification){
              return notification.receiverId;
            }).indexOf(memberId);
            var notificationId = $scope.notifications[index].id;
            Notification.deleteById({id: notificationId})
              .$promise
              .then(function(){
                $scope.notifications.splice(index, 1);
                if($scope.notifications.length == 0){
                  $scope.notifications = null;
                }
                $scope.showMessage("#removeInvitation");
              });
          }          
        }

        $scope.sendInvitation = function(){
          var memberEmail = ($scope.email).trim();
          var flashMessage;        
          if(memberEmail != undefined && 
              memberEmail != ($rootScope.currentUser.email).trim()){
              Customer.find({
                filter: {
                  fields: ['id', 'email'],
                  where: {
                    email: memberEmail
                  }  
                }                
              })
              .$promise
              .then(function(customer){
                if(customer.length == 0){
                  flashMessage = "#invitationErr";
                  $scope.showMessage(flashMessage);
                }else{
                  flashMessage = "#invitationSuccess";                
                  Notification
                  .create({
                    senderId: $rootScope.currentUser.id,
                    senderEmail: $rootScope.currentUser.email,
                    receiverId: customer[0].id,
                    receiverEmail: customer[0].email,
                    groupId: $scope.group.id
                  })
                  .$promise
                  .then(function(notification){
                    if($scope.notifications == null){
                      $scope.notifications = [];  
                    }
                    notification.display = notification.receiverEmail;
                    $scope.notifications.push(notification);
                    $scope.showMessage(flashMessage);                    
                  });
                }

              });            
          }
        }

        $scope.againInvitation = function(notificationId){
          if(confirm("Are you going to invite again?")){

            var index = $scope.notifications.map(function(notification){
              return notification.id;
            }).indexOf(notificationId);

            Notification.prototype$updateAttributes(
                { id: notificationId }, 
                { 
                  seen: false,
                  left: true
                }
            ).$promise
            .then(function(response){
              $scope.notifications[index].display = 
                    $scope.notifications[index].receiverEmail + " (refused - invite again)"
              $scope.showMessage("#invitationSuccess");
            });
          }
        }         

        $scope.showMessage = function(flashMessage){
          $(flashMessage).addClass("in"); 
          $("#invitationButton").prop("disabled", true);
          window.setTimeout(function(){
            $(flashMessage).removeClass("in"); 
            $("#email").prop("value", "");
            $("#invitationButton").prop("disabled", false); 
          }, 4000);          
        } 

        $scope.deleteGroup = function(){
          if(confirm("Are you sure?")){

            Group.findById({
              id: $scope.group.id,
              filter: {   
                fields: {
                  id: true,
                  ownerId: true
                },          
                include:{
                  relation: 'customers',
                  scope: {
                    fields: {
                      id: true,
                      groupId: true
                    },
                  }
                }
              }
            })
            .$promise
            .then(function(group){
              console.log("group: ", group);
              if(group.customers.length > 1){
                ReceiptService.publicShowMessage('#deleteGroupErrorMessage');
              }else if(group.customers.length === 1){
                if(group.customers[0].id === group.ownerId){
                  $state.go('deleteGroup', {'id': $scope.group.id});
                }else{
                  ReceiptService.publicShowMessage('#deleteGroupErrorMessage');
                }
              }else{
                $state.go('deleteGroup', {'id': $scope.group.id}); 
              } //else if(group.customers.length === 0){
            }); // Group.findById({           
            //$location.path('/deleteGroup/' + $scope.group.id);    
          }  // if(confirm("Are you sure?")){       
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