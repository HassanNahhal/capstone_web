'use strict';

 angular
  .module('app') 
  .controller('DashboardController', [
  	'$scope', 'Receipt', '$rootScope', '$stateParams', 
    '$state', 'Customer', 'Notification', 'Group', 
    function($scope, Receipt, $rootScope, $stateParams, 
      $state, Customer, Notification, Group) {   

      $('pagefooter').removeAttr('style'); 
      $(window).resize(function(){
        $('pagefooter').removeAttr('style');
      });        

      $scope.groupName = $stateParams.groupName;
      $scope.receipts;
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

        var name;
        if(receipts.length > 0){
          $scope.receipts = [];
          $scope.receipts = receipts;

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

      //ComboChart -- Get last month receipt as day of the week
      $scope.enabledComboChart;
      var totals;
      var dates; 
      var monthlyTotalLastYearKey;
      var monthNameFromDate;      
      var date = new Date();
      var year = date.getFullYear();
      var month = date.getMonth();
      var startDate;  // first day
      var startDateThisYear;
      var strThisMonthFirstDay;

      var monthFullNames = [  "January", "Feburary.", "March", "April", 
                                    "May ", "June", "July", "August", 
                                    "September", "October", "November", "December"
                                ];      
      $scope.thisYearLastMonth = "" + year + " " + monthFullNames[(month-1)];

      if(month - 1 >= 0){
          startDate = new Date(year, month - 1, 1);
      }else{
          startDate = new Date(year -1 , 11, 1);        
      }      
      startDateThisYear = new Date(startDate - 1);
  
      var endDate;
      endDate = new Date(year, month, 1);

      if(("" + month).length > 1){
        strThisMonthFirstDay = "" + (month+1) + "-01";
      }else{
        strThisMonthFirstDay = "0" + (month+1) + "-01";
      } 

      totals = [];
      dates = []; 
      var monthTotal = 0;     

      Receipt.find({
          filter: {
              order: 'date ASC', 
              fields: { 
                id: true, 
                customerId: true,
                groupId: true,
                total: true,
                date: true
              },               
              where: {and: [
                  {and: [
                      {customerId: userId},
                      {groupId: groupId}
                  ]}, 
                  {and: [
                          {date: {gt: startDateThisYear}},
                          {date: {lt: endDate}}
                  ]}                        
              ]}
          }
      })
      .$promise
      .then(function(lastMonthReceipts){
          //console.log("lastMonthReceipts: ", lastMonthReceipts);    
          var dayOfWeek = {};
          var numberOfWeek;
          var lastDate;
          var dailyTotals = {};
          var dailyTotalSum = new Array(lastDate);

          //var thisYearLastMonth;
          lastDate = new Date(endDate - 1);
          lastDate = ("" + lastDate).substring(8,10);

          totals = [];
          dates = [];
          totals = lastMonthReceipts.map(function(receipt){ return receipt.total});
          dates = lastMonthReceipts.map(function(receipt){ return receipt.date});

          var monthNames = [  "Jan.", "Feb.", "Mar.", "Apr.", 
                              "May ", "Jun.", "Jul.", "Aug.", 
                              "Sep.", "Oct.", "Nov.", "Dec."
                          ];   
          var comboChartCategories = [];       
          var numberOfDate;
          for(var i = 0; i < totals.length ; i++){
            if((dates[i]).substring(5,10) != strThisMonthFirstDay){
              $scope.enabledComboChart = true;
              //cumulate daily total
              numberOfDate = Number((dates[i]).substring(8,10));              
              if(dailyTotals[numberOfDate] == undefined){
                dailyTotals[numberOfDate] = [];
              }              
              dailyTotals[numberOfDate].push(totals[i]);
            } // if((dates[i]).substring(5,10) != strThisMonthFirstDay){
          } // for(var i = 0; i < totals.length ; i++){
          
          for(var j = 1 ; j <= lastDate ; j++){
            if(dailyTotals[j] == undefined){
              dailyTotals[j] = [0];
              dailyTotalSum[j-1] = 0;
            }else{
              var totalSum = dailyTotals[j].reduce($scope.getSum);
              dailyTotalSum[j-1] = totalSum;
            }
          }

          monthTotal = dailyTotalSum.reduce($scope.getSum);

          for(var k = 0 ; k < dailyTotalSum.length ; k++){
            var today = new Date(startDate);
            today.setDate(today.getDate() + k);
            numberOfWeek = today.getDay();
            if(("" + today).substring(8,10) == "01"){
              if(numberOfWeek != 0){
                for(var j = 0 ; j < numberOfWeek ; j++){
                  dayOfWeek[j] = [];
                  dayOfWeek[j].push(0);  
                }
              }
              if(numberOfWeek != 0){
                comboChartCategories.push(("Week/" + monthNames[month-1] + "01"));  
              }                
            }

            if(numberOfWeek == 0){
              comboChartCategories.push(("Week/" + monthNames[month-1] + ("" + today).substring(8,10)));  
            }              

            if(dayOfWeek[numberOfWeek] == undefined){
              dayOfWeek[numberOfWeek] = [];
            }  
            dayOfWeek[numberOfWeek].push(dailyTotalSum[k]);  

            if(("" + today).substring(8,10) == lastDate){
              if(numberOfWeek != 6){
                for(var j = 6; j > numberOfWeek ; j--){
                  dayOfWeek[j].push(0);
                }
              }
            }
          } // for(var k = 0 ; k < dailyTotalSum.length ; k++){

          var averagePerWeek = new Array(dayOfWeek[0].length);
          for(var j = 0 ; j < dayOfWeek[0].length ; j++){
            var weekSum = {};
            weekSum[j] = [];
            for(var h = 0 ; h < 7 ; h ++){
              weekSum[j].push(dayOfWeek[h][j]);
            }
            averagePerWeek[j] = Number((weekSum[j].reduce($scope.getSum)/7).toFixed(2));
          }  // for(var j = 0 ; j < dayOfWeek[0].length ; j++){          

          var splineAverage =  {
                    type: 'spline',
                    name: 'Average',
                    data: averagePerWeek,
                    marker: {
                        lineWidth: 2,
                        lineColor: Highcharts.getOptions().colors[7],
                        fillColor: 'white'
                    }
                };

          monthlyTotalLastYearKey = $scope.commaSeparateNumber(monthTotal);   

          var comboChartSeries = [];
          var comboChartWeekSum = [];
          var numberToDate = ['Sun', 'Mon', 'Tue', 'Wed', 'Thr', 'Fri', 'Sat'];

          angular.forEach(dayOfWeek, function(value_totals, key_datenumber){
            var eachWeek = {
              type: 'column',
              name: numberToDate[key_datenumber],
              data: value_totals
            };
            comboChartSeries.push(eachWeek);
            var weekSum =  {
                      name: numberToDate[key_datenumber],
                      y: Number($scope.commaSeparateNumber(value_totals.reduce($scope.getSum))),
                      color: Highcharts.getOptions().colors[key_datenumber] 
                  };
            comboChartWeekSum.push(weekSum);

          });
          comboChartSeries.push(splineAverage);

          var pieChart = {
                    type: 'pie',
                    name: 'Total consumption',
                    data: comboChartWeekSum,
                    center: [100, 80],
                    size: 100,
                    showInLegend: false,
                    dataLabels: {
                        enabled: false
                    }
                  };    
          comboChartSeries.push(pieChart);  

        $scope.comboChart = function(){
          // High Chart
          $('#container1').highcharts({
              title: {
                  text: $scope.thisYearLastMonth + ' day of the week ($' + monthlyTotalLastYearKey + ')'
              },
              xAxis: {
                  categories: comboChartCategories
              },
              labels: {
                  items: [{
                      html: ($scope.thisYearLastMonth).substring(5,9) + ' total consumption',
                      style: {
                          left: '50px',
                          top: '18px',
                          color: (Highcharts.theme && Highcharts.theme.textColor) || 'black'
                      }
                  }]
              },
              series: comboChartSeries
          }); // $('#container1').highcharts({   
        };
        window.setTimeout(function(){
          $scope.comboChart();
        }, 500);         

      });  // .then(function(lastYearReceipts){   
      //ComboChart -- END -- Get last month receipt as day of the week      

      // Get Array Sum
      $scope.getSum = function(total, num) {
          return total + num;
      }   
         
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
    '$scope', '$state', '$modalInstance', 'params', 'Customer', '$rootScope', '$http', 'ReceiptService', 
      function($scope, $state, $modalInstance, params, Customer, $rootScope, $http, ReceiptService) {

      $http.defaults.headers.common.authorization = $rootScope.currentUser.tokenId;

      $scope.customer = params;

      $scope.hasWhiteSpace = function(pw){
        retrun (/^\s*$/).test(pw);
      }

      $scope.disabled = false;

      $scope.updateUserProfile = function(){
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

      $scope.submit = function(){

        $scope.disabled = true;

        if($scope.customer.password != undefined){
          if($scope.customer.password =='' && 
            ($scope.customer.password1 == undefined || $scope.customer.password1 == '')){
              // Update User Profile
              $scope.updateUserProfile();
          }else if($scope.customer.password != $scope.customer.password1){
            ReceiptService.publicShowMessage('#invalidPasswordMessage');
            $scope.disabled = false; 
          }else{
            var newPassword = $scope.customer.password;
            var re = /^\w*$/;
            if(re.test(newPassword) == false){
              ReceiptService.publicShowMessage('#invalidWhiteSpaceMessage');
              $scope.disabled = false;
            }else if(newPassword == ''){
              // Update User Profile
              $scope.updateUserProfile();             
            }else{
              // Change Password **************************
              Customer.prototype$updateAttributes(
                  { id:$scope.customer.userId }, 
                  { 
                    username: $scope.customer.username,
                    firstName: $scope.customer.firstName,
                    lastName: $scope.customer.lastName,
                    password: newPassword
                  }
              )
              .$promise
              .then(function(customer){ 
                ReceiptService.publicShowMessage('#showChangePasswordMessage');   
                window.setTimeout(function(){
                  $modalInstance.close(customer);
                }, 3100);                
              }); 
              // Change Password **************************             
            } // if($scope.hasWhiteSpace($scope.customer.password)){
          } // if($scope.customer.password === $scope.customer.password1){
        }else{
          //Update User Profile
          $scope.updateUserProfile();
        } // if($scope.customer.password != undefined){
      } // $scope.submit = function(){

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
    'Customer', 'FileUploader', 'Container', '$rootScope', 'ReceiptService', 
      function($scope, $state, $modalInstance, params, Customer, 
        FileUploader, Container, $rootScope, ReceiptService) {
      
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