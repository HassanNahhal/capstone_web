'use strict';

 angular
  .module('app') 
  .controller('DashboardController', [
  	'$scope', 'Receipt', '$rootScope', '$stateParams', 
    '$state', 'Customer', 'Notification', 'Group', 
    function($scope, Receipt, $rootScope, $stateParams, 
      $state, Customer, Notification, Group) {     

      $scope.groupName = $stateParams.groupName;
      $scope.receipts = [];
      $scope.tagcloud = true;
      $scope.recentReceiptsCount;
      var tagnames = {};
      var tagIds = {};
      var userId, groupId;
      var tagWords = [];

      if($stateParams.groupId == undefined){
        userId = $rootScope.currentUser.id;
        groupId = "";
      }else{
        userId = $stateParams.ownerId;
        groupId = $stateParams.groupId;
      } 
      $scope.userId = userId;

      Receipt.find({ 
        filter: {
          fields: {
            id: true,
            date: true,
            total: true,
            storeId: true
          },          
          order: 'date DESC', 
          include: ['tags', 
            {
              relation: 'store',
              scope: {
                fields: {
                  id: true,
                  name: true
                }
              }
            }
          ],               
          where: 
            {and: [
                {customerId: userId},
                {groupId: groupId}
            ]}
        }
      })
      .$promise
      .then(function(receipts){
        //console.log("receipts: ", receipts);

        $scope.receipts = receipts;

        var name;
        if(receipts.length > 0){
          angular.forEach(receipts, function(receipt, receipt_key){
            if(receipt.tags.length > 0){
              angular.forEach(receipt.tags, function(tag, tag_key){
                name = tag.name;
                if(tagnames[name] == undefined){
                  tagnames[name] = 1;
                  tagIds[name] = tag.id;
                }else{
                  tagnames[name] += 1;
                  tagIds[name] = tag.id;
                }                
              });
            }
          });
        }
        angular.forEach(tagnames, function(tagname, key){
          var strlink = "javascript:angular.element(document.getElementById('dashboardTagController')).scope().open('";
          strlink  +=  tagIds[key];
          strlink += "','" + userId + "');";
          var word = {
            text: key, 
            weight: tagnames[key],
            link: strlink
          };
          tagWords.push(word);
        });
        if(tagWords.length < 1){
          $scope.tagcloud =false;
        }else{
          $(function() {
            $("#tagcloud").jQCloud(tagWords, {
              delay: 50,
              autoResize: true
            });
            $('#update-tagcloud').on('click', function() {
              tagWords.splice(-3);
              $('#tagcloud').jQCloud('update', tagWords);
            });        
          });          
        }
        // Set Receipts into localStorate
        if(receipts.length > 0){
          if(localStorage[userId] != undefined && 
              JSON.parse(localStorage[userId])['recentReceipts'] != undefined){
              if(JSON.parse(localStorage[userId])['recentReceipts'].length != receipts.length){
                $scope.Receipts2localStorage(receipts, 'recentReceipts');  
              }
          }else{
            $scope.Receipts2localStorage(receipts, 'recentReceipts');  
          } 
           
          if(receipts.length>5){
            $scope.setValue2localStorage(5, 'recentReceiptsCount');
          }else{
            $scope.setValue2localStorage(receipts.length, 'recentReceiptsCount');          
          }
        }else{
          $scope.setValue2localStorage(0, 'recentReceiptsCount');
        }
        $scope.recentReceiptsCount = $scope.getValue2localStorage('recentReceiptsCount'); 

      });
      /* Sample word format JSON Array format
      var tag_array = [
          {text: "Lorem", weight: 15},
          {text: "Ipsum", weight: 9, link: "http://jquery.com/"},
          {text: "Dolor", weight: 6, html: {title: "I can haz any html attribute"}},
      ];
      */
         
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

      $scope.setValue2localStorage = function(value, storageKey){
        var temp_localStorage = {};
        if(localStorage[userId] != undefined){
          temp_localStorage = JSON.parse(localStorage[userId]);  
        }
        temp_localStorage[storageKey] = value;
        localStorage.setItem(userId, JSON.stringify(temp_localStorage));        
      }
      $scope.getValue2localStorage = function(storageKey){
        if(localStorage[userId] != undefined){
          return JSON.parse(localStorage[userId])[storageKey];  
        }        
      }
      // Set Receipts into localStorate
      $scope.Receipts2localStorage = function(receipts, storageKey){
        var tmp_receipts = [];
        for(var i = 0 ; i < receipts.length ; i++){
          var receipt = {
            id: receipts[i].id,
            date: (receipts[i].date).substring(0, 10),
            total: receipts[i].total,
            storeName: receipts[i].store.name
          };
          tmp_receipts.push(receipt);
        }
        var temp_localStorage = {};
        if(localStorage[userId] != undefined){
          temp_localStorage = JSON.parse(localStorage[userId]);  
        }
        temp_localStorage[storageKey] = tmp_receipts;
        localStorage.setItem(userId, JSON.stringify(temp_localStorage));
      }

      $scope.showReceipts;
      $scope.recentReceipts = {};
      $scope.showRecentReceipts = function(){
        $scope.showReceipts = !$scope.showReceipts;
        if($scope.showReceipts){
          $scope.recentReceipts = JSON.parse(localStorage[userId])['recentReceipts'];  
        }       
      }

      $scope.viewReceipt = function(receiptId){
        $state.go('viewReceipt', {'id': receiptId});
      }

      // Show Recent Group Receipts
      $scope.groupReceipts;
      $scope.ownerGroup;
      $scope.memberGroup;
      $scope.ownerGroupRecentReceipts;
      $scope.memberGroupRecentReceipts;  
      $scope.recentGroupReceiptsCount;
      if($scope.getValue2localStorage('recentGroupReceiptsCount') == undefined){
        $scope.setValue2localStorage(0, 'recentGroupReceiptsCount');
        $scope.recentGroupReceiptsCount = 0;
      }else{
        $scope.recentGroupReceiptsCount = $scope.getValue2localStorage('recentGroupReceiptsCount');
      }

      $scope.showRecentGroupReceipts = function(){
        $scope.groupReceipts = !$scope.groupReceipts; 
        if($scope.groupReceipts){
          Customer.findById({
            id: userId,
            filter: { 
              include: 'groups',
              fields: {
                id: true,
                groupId: true
              }
            }
          })
          .$promise
          .then(function(customer){
            //console.log("customer: ", customer);
            if(customer.groups != undefined){
              if(customer.groups.length > 0){
                for(var i = 0 ; i < customer.groups.length ; i++){
                  if(customer.groups[i].ownerId == customer.id){
                    $scope.ownerGroup = {
                      ownerId: customer.groups[i].ownerId,
                      groupId: customer.groups[i].id,
                      groupName: customer.groups[i].name
                    };                      
                  }else{
                    $scope.memberGroup = {
                      ownerId: customer.groups[i].ownerId,
                      groupId: customer.groups[i].id,
                      groupName: customer.groups[i].name
                    }; 
                  }
                }
              }          
            } // if(customer.groups != undefined){

            if($scope.ownerGroup != undefined){
              // Get Owner Group Receipts
              Receipt.find({ 
                filter: {
                  fields: {
                    id: true,
                    date: true,
                    total: true,
                    storeId: true,
                    groupId: true
                  },
                  limit: 3,         
                  order: 'date DESC', 
                  include:  
                  {
                    relation: 'store',
                    scope: {
                      fields: {
                        id: true,
                        name: true
                      }
                    }
                  },               
                  where: {and: [
                    {customerId: $scope.ownerGroup.ownerId},
                    {groupId: $scope.ownerGroup.groupId}
                  ]}
                }
              })
              .$promise
              .then(function(receipts){
                //console.log("ownerGroupReceipts: ", receipts);
                if(receipts.length>0){ 
                  $scope.Receipts2localStorage(receipts, 'ownerGroupReceipts');
                  $scope.ownerGroupRecentReceipts = JSON.parse(localStorage[userId])['ownerGroupReceipts'];

                  $scope.setValue2localStorage(receipts.length, 'recentGroupReceiptsCount'); 
                  $scope.recentGroupReceiptsCount = receipts.length; 
                }else{
                  $scope.setValue2localStorage(0, 'recentGroupReceiptsCount'); 
                  $scope.recentGroupReceiptsCount = 0; 
                }
              });
            } //if($scope.ownerGroup != undefined){

            if($scope.memberGroup != undefined){
              // Get Member Group Receipts
              Receipt.find({ 
                filter: {
                  fields: {
                    id: true,
                    date: true,
                    total: true,
                    storeId: true,
                    groupId: true
                  },
                  limit: 3,          
                  order: 'date DESC', 
                  include:  
                  {
                    relation: 'store',
                    scope: {
                      fields: {
                        id: true,
                        name: true
                      }
                    }
                  },               
                  where: {and: [
                    {customerId: $scope.memberGroup.ownerId},
                    {groupId: $scope.memberGroup.groupId}
                  ]}
                }
              })
              .$promise
              .then(function(receipts){
                //console.log("memberGroupReceipts: ", receipts);  
                if(receipts.length>0){
                  $scope.Receipts2localStorage(receipts, 'memberGroupReceipts');  
                  $scope.memberGroupRecentReceipts = JSON.parse(localStorage[userId])['memberGroupReceipts'];

                  var temp_count = $scope.getValue2localStorage('recentGroupReceiptsCount');
                  temp_count += receipts.length;
                  $scope.setValue2localStorage(temp_count, 'recentGroupReceiptsCount');
                  $scope.recentGroupReceiptsCount = temp_count;
                  //console.log("member db");
                }                
              });               
            } //if($scope.memberGroup != undefined){            
          }); // .then(function(customer){
        }
      } //$scope.showRecentGroupReceipts = function(){

      $scope.viewGroupReceipt = function(receiptId, groupId, groupName, ownerId){
        $state.go(
          'groupViewReceipt', 
          {
            'id':         receiptId, 
            'groupId':    groupId, 
            'groupName':  groupName,
            'ownerId':    ownerId
          }
        );       
      }  

      $scope.showNotification;
      $scope.notifications;
      $scope.ownerNotifications
      $scope.notificationCount;
      if($scope.getValue2localStorage('notificationCount') != undefined){
        $scope.notificationCount = $scope.getValue2localStorage('notificationCount');
      }else{
        $scope.notificationCount = 0;
      }
      $scope.openNotification = function(){
        $scope.showNotification = !$scope.showNotification
        if($scope.showNotification){
           // Find invitation notification
          Notification.find({
            filter: {
              limit: 3,
              where: { and: [
                {receiverId: userId},
                {seen: false}                  
              ]}
            }
          })
          .$promise
          .then(function(notifications){
            //console.log("notifications: ", notifications);

            if(notifications.length > 0){

              $scope.notifications = notifications;
              $scope.notificationCount = notifications.length;
              $scope.setValue2localStorage(notifications.length, 'notificationCount');

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
            }else{
              $scope.setValue2localStorage(0, 'notificationCount');
            }
          }); // Notification.find({   

          Customer.findById({
            id: userId,
            filter: {
              fields: { id: true, groupId: true}
            }
          })
          .$promise
          .then(function(customer){
            //console.log("customer: ", customer);
            if(customer.groupId != undefined){

              //Find notification
              Notification.find({
                filter: {
                  limit: 3,
                  where: { and: [
                    {senderId: customer.id},
                    {and: [
                        {groupId: customer.groupId},
                        {accepted: false}
                      ]
                    }                  
                  ]}
                }
              })
              .$promise
              .then(function(notifications){
                //console.log("ownerNotifications: ", notifications);
                $scope.ownerNotifications = notifications;
                if($scope.ownerNotifications.length > 0){
                  var invitationCount = $scope.getValue2localStorage('notificationCount');
                  $scope.notificationCount = notifications.length + invitationCount;
                  $scope.setValue2localStorage($scope.notificationCount, 'notificationCount');

                  for(var i = 0 ; i < $scope.ownerNotifications.length ; i++){
                    if($scope.ownerNotifications[i].seen == true && 
                        $scope.ownerNotifications[i].left == true){
                      $scope.ownerNotifications[i].display = 
                        $scope.ownerNotifications[i].receiverEmail + " (refused)";
                    }else if($scope.ownerNotifications[i].seen == false && 
                              $scope.ownerNotifications[i].left == true){
                      $scope.ownerNotifications[i].display = 
                        $scope.ownerNotifications[i].receiverEmail + " (refused - invite again)";
                    }else{
                      $scope.ownerNotifications[i].display = $scope.ownerNotifications[i].receiverEmail;
                    }
                  }
                }
              }); 
                           
            }

          });

        } // if($scope.showNotification){
        
      } //  $scope.openNotification = function(){ 

      $scope.viewGroups = function(){
        $state.go('Groups');
      }

      $scope.viewEditGroup = function(groupId){
        $state.go('editGroup', {id: groupId});
      }

      //Combo chart using Hight Chart Open Source for non comercial
      $scope.combChart =    function () {
          $('#container1').highcharts({
              title: {
                  text: '2016-06 day of the week (Total: $1,375)'
              },
              xAxis: {
                  categories: ['Jun.01', 'Jun.06', 'Jun.13', 'Jun.20', 'Jun.27']
              },
              labels: {
                  items: [{
                      html: 'June total consumption',
                      style: {
                          left: '50px',
                          top: '18px',
                          color: (Highcharts.theme && Highcharts.theme.textColor) || 'black'
                      }
                  }]
              },
              series: [{
                  type: 'column',
                  name: 'Mon',
                  data: [0, 32, 42, 22, 67]
              }, {
                  type: 'column',
                  name: 'Tue',
                  data: [0, 28, 15, 50, 33]
              }, {
                  type: 'column',
                  name: 'Wed',
                  data: [45,30,15,100,85]
              }, {
                  type: 'column',
                  name: 'Thr',
                  data: [50,55,20,66,54]
              }, {
                  type: 'column',
                  name: 'Fri',
                  data: [35,20,33,80,0]
              }, {
                  type: 'column',
                  name: 'Sat/Sun',
                  data: [60,88,130,120,0]
              }, {
                  type: 'spline',
                  name: 'Average',
                  data: [31.67,42.17,42.50,73.00,39.83],
                  marker: {
                      lineWidth: 2,
                      lineColor: Highcharts.getOptions().colors[6],
                      fillColor: 'white'
                  }
              }, {
                  type: 'pie',
                  name: 'Total consumption',
                  data: [{
                      name: 'Mon',
                      y: 163,
                      color: Highcharts.getOptions().colors[0] // Jane's color
                  }, {
                      name: 'Tue',
                      y: 126,
                      color: Highcharts.getOptions().colors[1] // John's color
                  }, {
                      name: 'Wed',
                      y: 275,
                      color: Highcharts.getOptions().colors[2] // Joe's color
                  }, {
                      name: 'Thr',
                      y: 245,
                      color: Highcharts.getOptions().colors[3] // Joe's color
                  }, {
                      name: 'Fri',
                      y: 168,
                      color: Highcharts.getOptions().colors[4] // Joe's color
                  }, {
                      name: 'Sat/Sun',
                      y: 398,
                      color: Highcharts.getOptions().colors[5] // Joe's color
                  }],
                  center: [100, 80],
                  size: 100,
                  showInLegend: false,
                  dataLabels: {
                      enabled: false
                  }
              }]
          });
      } // Combo chart using Hight Chart Open Source for non comercial

  }])  
  .controller('DashboardUserController', [
    '$scope', 'Receipt', '$rootScope', '$stateParams', 'Customer', '$modal',  
    function($scope, Receipt, $rootScope, $stateParams, Customer, $modal) {

      $scope.ownerId;
      $scope.groupId;
      $scope.groupName;
      $scope.customer;
      $scope.username = $rootScope.currentUser.username;
      $scope.email = $rootScope.currentUser.email;

      var userId, groupId;
      if($stateParams.groupId == undefined){
        userId = $rootScope.currentUser.id;
        groupId = "";
      }else{
        userId = $stateParams.ownerId;
        groupId = $stateParams.groupId;
      }
      $scope.userId = userId;

      $scope.showProfile;
      $scope.openUser = function(){
        if(localStorage.customer == undefined || 
            JSON.parse(localStorage.customer).userId != userId){

            $scope.customer = {};
            Customer.findById({
              id: userId,
              filter: { 
                include: 'groups'
              }
            })
            .$promise
            .then(function(customer){
              console.log("customer: ", customer);
              $scope.setCustomer2LocalStorage(customer);
            });
        }else{
          $scope.customer = JSON.parse(localStorage.customer);
          if($scope.customer.photoFile != ""){
            $('#userPhoto').attr('src', $scope.customer.photoFile);
          }
        }
        $scope.showProfile =! $scope.showProfile;
      }

      $scope.setCustomer2LocalStorage = function(customer){
        var groupName, groupOwnerId;
        if(customer.groups != undefined){
          if(customer.groups.length > 0){
            for(var i = 0 ; i < customer.groups.length ; i++){
              if(customer.groups[i].ownerId == customer.id){
                groupName = customer.groups[i].name;
                groupOwnerId = customer.groups[i].ownerId;
              }
            }
          }          
        }
        var photoFile = "images/assets/default-user01.png";
        if(customer.photoFilePath != ""){        
          photoFile = customer.photoFilePath;
          $('#userPhoto').attr('src', photoFile);
          //console.log('photoFile: ', photoFile);
        }
        var user = {
          'userId': customer.id,
          'username': customer.username,
          'firstName': customer.firstName,
          'lastName': customer.lastName,
          'groupId': customer.groupId,
          'photoFile': photoFile,
          'groupName': groupName,
          'email': customer.email,
          'groupOwnerId': groupOwnerId
        }
        localStorage.setItem('customer', JSON.stringify(user));
        $scope.customer = user;
      }
      
      $scope.editCustomer = function(userId, username, firstName, lastName){
        $scope.params = {
          userId: userId,
          username: username,
          firstName: firstName,
          lastName: lastName
        };
        var modalInstance = $modal.open({
          templateUrl: 'ModalEditCustomer.html',
          controller: 'ModalEditCustomerInstanceCtrl',
          resolve: {
            params: function(){
              return $scope.params;
          }}
        });

        modalInstance.result.then(function (customer) {
          $scope.username = $rootScope.currentUser.username = customer.username;
          sessionStorage.setItem('access_token', JSON.stringify($rootScope.currentUser));
          $scope.setCustomer2LocalStorage(customer);
        }, function () {
          console.info('Customer Edit Modal dismissed.');
        });
      };
  }])
  .controller('ModalEditCustomerInstanceCtrl', [
    '$scope', '$state', '$modalInstance', 'params', 'Customer',   
      function($scope, $state, $modalInstance, params, Customer) {
      $scope.customer = params;
      $scope.submit = function(){
          Customer.prototype$updateAttributes(
              { id:$scope.customer.userId }, 
              { 
                username: $scope.customer.username,
                firstName: $scope.customer.firstName,
                lastName: $scope.customer.lastName 
              }
          )
          .$promise
          .then(function(customer){            
            $modalInstance.close(customer);
          });      
      }
      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };
  }])
  .controller('ModalUserPohtoFileCtrl', function ($scope, $modal, $log) {

    $scope.open = function (userId) {

        $scope.params = {
          userId: userId
        };

        //console.log("$scope.params: ", $scope.params);

        var modalInstance = $modal.open({
          templateUrl: 'ModalUserPohtoFile.html',
          controller: 'ModalUserPohtoFileInstanceCtrl',
          size: 'lg',
          resolve: {
            params: function(){
              return $scope.params;
          }}
        });
      };
  })
  .controller('ModalUserPohtoFileInstanceCtrl', [
    '$scope', '$state', '$modalInstance', 'params', 
    'Customer', 'FileUploader', 'Container', '$rootScope', 
      function($scope, $state, $modalInstance, params, Customer, 
        FileUploader, Container, $rootScope) {
      
      $scope.params = params;

      var userId = "";
      var repositoryPath = "";
      var storageId = "";    

      userId = params.userId;
      storageId = userId + 'photo';

      repositoryPath = storageId + '/'; 

      Container.getContainers(function(container){
        //console.log("container: ", container);
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
      var filePath = '/api/containers/' + storageId + '/download/' + response.result.files.file[0].name
      Customer.prototype$updateAttributes(
          { id: params.userId }, 
          { 
            photoFilePath: filePath
          }
      )
      .$promise
      .then(function(customer){  
          $('#userPhoto').attr('src', customer.photoFilePath);          
          var user = JSON.parse(localStorage.customer);
          user['photoFile'] = customer.photoFilePath;
          localStorage.setItem('customer', JSON.stringify(user));
          $scope.customer = user;
          $modalInstance.close('success');
          //console.log("photo File: ", customer.photoFilePath);
      }); 
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
  .controller('ModalDashboardTagReceiptsCtrl', function ($scope, $modal, $log) {

    $scope.open = function (tagId, userId, groupId, groupName) {

        $scope.params = {
          tagId: tagId,
          userId: userId,
          groupId: groupId,
          groupName: groupName
        };

        var modalInstance = $modal.open({
          templateUrl: 'ModalTagReceipts.html',
          controller: 'ModalDashboardTagReceiptsInstanceCtrl',
          size: 'lg',
          resolve: {
            params: function(){
              return $scope.params;
          }}
        });
      };
  })
  .controller('ModalDashboardTagReceiptsInstanceCtrl', [
    '$scope', '$state', '$modalInstance', 'params', 'Tag', '$filter', 
      function($scope, $state, $modalInstance, params, Tag, $filter) {           

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

  }]);