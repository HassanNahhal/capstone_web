'use strict';
/**
 * @ngdoc function
 * @name sbAdminApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sbAdminApp
 */
angular.module('app')
  .controller('ChartCtrl', ['$scope', '$timeout', 'Receipt', '$rootScope', 
    '$state', '$stateParams', 
    function ($scope, $timeout, Receipt, $rootScope, $state, $stateParams) {      

    $scope.groupName = $stateParams.groupName;   

    var userId, groupId;
    if($stateParams.groupId == undefined){
      userId = $rootScope.currentUser.id;
      groupId = "";
    }else{
      userId = $stateParams.ownerId;
      groupId = $stateParams.groupId;
    } 

      $scope.viewGroup = function(){
        if($stateParams.groupId != undefined){
             $state.go('viewGroup', {'id': $stateParams.groupId});
        }        
      }    

    var totals;
    var dates; 
    var monthlyTotal;
    var monthlyTotalLastYear;
    var monthNum;
    var monthNameFromDate; 
    var stores, tags, categories;
    var countOfTags, countOfReceipts;
    var catetory_donut_labels;
    var catetory_donut_data; 
    var tag_donut_labels;
    var tag_donut_data;  
    var store_pie_labels;
    var store_pie_data;       

    $scope.selectedMonth;
    $scope.thisYear = (new Date()).getFullYear();
    $scope.twelvemonths = [
        {name: '1 month', number: 0},
        {name: '2 months', number: 1},
        {name: '3 months', number: 2},
        {name: '4 months', number: 3},
        {name: '5 months', number: 4},
        {name: '6 months', number: 5},
        {name: '7 months', number: 6},
        {name: '8 months', number: 7},
        {name: '9 months', number: 8},
        {name: '10 months', number: 9},
        {name: '11 months', number: 10},
        {name: '12 months', number: 11}
    ];
    // default range of month is 6 months
    $scope.selectedMonth = $scope.twelvemonths[5];

    // Get recent 6 months receipts
    var ONE_MONTH = 30 * 24 * 60 * 60 * 1000; // Month in milliseconds
    var monthNames = [  "January", "February", "March", "April", 
                        "May", "June", "July", "August", 
                        "September", "October", "November", "December"
                    ];

    $scope.monthConsumptionChart = function(rangeOfMonth){

        // Set start first day of month
        var date = new Date();
        var year = date.getFullYear();
        var month = date.getMonth();
        var startDate;  // Every month first
        if(month - rangeOfMonth >= 0){
            startDate = new Date(year, month-rangeOfMonth, 1);
        }else{
            startDate = new Date(year -1 , 12 + (month-rangeOfMonth), 1);
        }

        totals = [];
        dates = []; 
        monthlyTotal = [];
        monthlyTotalLastYear = [];
        monthNum = [];
        monthNameFromDate = [];
        stores = {};
        tags = {};
        categories = {};  
        countOfReceipts = countOfTags = 0;  
        catetory_donut_labels = [];
        catetory_donut_data = []; 
        tag_donut_labels = [];
        tag_donut_data = [];  
        store_pie_labels = [];
        store_pie_data = []; 

        //{date: {gt: new Date('2015-12-31T00:00:00.000Z')}}                             

        Receipt.find({
            filter: {
                order: 'date DESC', 
                include: [
                    'tags', 
                    {
                        relation: 'store',
                        scope: {
                            include: {
                                relation: 'categories'
                            }
                        }
                    }
                ],                
                where: {and: [
                    {date: {gt: startDate}},
                    {and: [
                        {customerId: userId},
                        {groupId: groupId}
                    ]}                  
                ]}
            }
        })
        .$promise
        .then(function(receipts){
            // Line and Bar charts
            totals = receipts.map(function(receipt){ return receipt.total});
            dates = receipts.map(function(receipt){ return receipt.date});

            var monthTotal = 0;
            var thisMonth = 0;
            var nextMonth = 0;
            for(var i = totals.length -1 ; i >= 0 ; i--){
                monthTotal += totals[i];
                thisMonth = (new Date(dates[i])).getMonth();
                if((i-1 >= 0)){
                    nextMonth = (new Date(dates[i-1])).getMonth();
                    if(thisMonth != nextMonth){
                        monthlyTotal.push(monthTotal);
                        monthNum.push(thisMonth);
                        monthTotal = 0;
                    }
                }else{
                    monthlyTotal.push(monthTotal);
                    monthNum.push(thisMonth);
                    monthTotal = 0;
                }
            }
            for(var i = 0; i < monthNum.length ; i++){
                monthNameFromDate.push(monthNames[monthNum[i]]);
            } 

            // Get the monthly total as range of months for last year
            // Set the range first day of start and end month
            var endDate;
            if(month + 1 > 11){
                endDate = new Date(year, 0, 1);
            }else{
                endDate = new Date(year -1, month + 1, 1);
            }
            startDate = new Date(startDate.getFullYear() -1, startDate.getMonth(), 1);
            Receipt.find({
                filter: {
                    order: 'date DESC', 
                    include: [
                        'tags', 
                        {
                            relation: 'store',
                            scope: {
                                include: {
                                    relation: 'categories'
                                }
                            }
                        }
                    ],                
                    where: {and: [
                        {and: [
                            {customerId: userId},
                            {groupId: groupId}
                        ]}, 
                        {and: [
                                {date: {lt: endDate}},
                                {date: {gt: startDate}}
                        ]}                        
                    ]}
                }
            })
            .$promise
            .then(function(lastYearReceipts){

                totals = [];
                dates = [];
                totals = lastYearReceipts.map(function(receipt){ return receipt.total});
                dates = lastYearReceipts.map(function(receipt){ return receipt.date});

                monthTotal = 0;
                thisMonth = 0;
                nextMonth = 0;
                //randomValue = 0;
                for(var i = totals.length -1 ; i >= 0 ; i--){
                    monthTotal += totals[i];
                    thisMonth = (new Date(dates[i])).getMonth();
                    if((i-1 >= 0)){
                        nextMonth = (new Date(dates[i-1])).getMonth();
                        if(thisMonth != nextMonth){
                            monthlyTotalLastYear.push(monthTotal);
                            monthTotal = 0;
                        }
                    }else{
                        monthlyTotalLastYear.push(monthTotal);
                        monthTotal = 0;
                    }
                }
                //When laste year's monthly data is less than this year, set total 0    
                if(monthlyTotalLastYear.length < monthlyTotal.length){
                    var count = monthlyTotal.length - monthlyTotalLastYear.length;
                    for(var i = 0 ; i < count ; i++){
                        monthlyTotalLastYear.splice(0,0,0);
                    }
                }
                // Bar Chart comparion of monthly of this year and last year
                $scope.bar = {
                    labels: monthNameFromDate,
                    series: [$scope.thisYear-1, $scope.thisYear],
                    data: [
                       monthlyTotal,
                       monthlyTotalLastYear
                    ]            
                };                

            });  // .then(function(lastYearReceipts){         

            // Donut and pie charts
            countOfReceipts = receipts.length;
            angular.forEach(receipts, function(receipt, key){
                // category ID of receipt to get the name of category
                var categoryId = receipt.categoryId;

                if(receipt.tags.length > 0){
                    for(var i = 0 ; i < receipt.tags.length ; i++){
                        var tagname = receipt.tags[i].name;
                        if(tags[tagname] == undefined){
                            tags[tagname] = 1;
                            countOfTags += 1; 
                        }else{
                            tags[tagname] += 1;  
                            countOfTags += 1;  
                        }                        
                    }                    
                }
                if(stores[receipt.store.name] == undefined){
                    stores[receipt.store.name] = 1;
                }else{
                    stores[receipt.store.name] += 1;
                }
                if(receipt.store.categories.length > 0){
                    for(var i = 0 ; i < receipt.store.categories.length ; i++){
                        if(receipt.store.categories[i].id == categoryId){
                            var categoryName = receipt.store.categories[i].name;
                            if(categories[categoryName] == undefined){
                                categories[categoryName] = 1;
                            }else{
                                categories[categoryName] += 1;
                            }
                            break;
                        }
                    }
                }
            }); // angular.forEach(receipts, function(receipt, key){

            angular.forEach(categories, function(category, key){
                catetory_donut_labels.push(key);
                catetory_donut_data.push(Number(((categories[key]/countOfReceipts)*100).toFixed(2)));
            });

            angular.forEach(stores, function(store, key){
                store_pie_labels.push(key);
                store_pie_data.push(Number(((stores[key]/countOfReceipts)*100).toFixed(2)));
            });

            angular.forEach(tags, function(tag, key){
                tag_donut_labels.push(key);
                tag_donut_data.push(Number(((tags[key]/countOfTags)*100).toFixed(2)));
            });                        

        }); // .then(function(receipts){

        // Line Chart retrieved from real data of database
        // Monthly total consumption as range of months
        $scope.line = {
            labels: monthNameFromDate,      //['January', 'February', 'March', 'April', 'May', 'June'],        
            series: [$scope.thisYear],      //series: ['2016'],
            data: [
                monthlyTotal                //[1900, 1650, 1700, 2100, 1600, 1800]
            ]
        };
        // Donut chart for Category
        $scope.donut = {
            labels: catetory_donut_labels,
            data: catetory_donut_data
        }; 
        // Pie chart for Store
        $scope.pie = {
            labels: store_pie_labels,
            data: store_pie_data            
        };
        // Donut chart for Tags
        $scope.donut1 = {
            labels: tag_donut_labels,
            data: tag_donut_data            
        };  

    } // $scope.monthConsumptionChart = function(rangeOfMonth){

    // When change the range of month, re-draw line chart
    $scope.changRangeOfMonth = function(){
        $scope.monthConsumptionChart($scope.selectedMonth.number);
    }
    // default range of month is 6 months
    $scope.monthConsumptionChart($scope.selectedMonth.number);   
    
    /*
    // Dummy data for line chart
    $scope.line = {
        labels: ['January', 'February', 'March', 'April', 'May', 'June'],
        series: ['Series A', 'Series B'],
        data: [
          [1900, 1650, 1700, 2100, 1600, 1800],
          [28, 48, 40, 19, 86, 27, 90]
        ],
        onClick: function (points, evt) {
          console.log(points, evt);
        }
    };    

    $scope.bar = {
        labels: ['January', 'February', 'March', 'April', 'May', 'June'],
    	series: ['2015', '2016'],

    	data: [
    	   [2100, 1750, 1600, 1800, 1450, 1750],
    	   [1900, 1650, 1700, 2100, 1600, 1800]
    	]
    	
    };
    
    $scope.donut = {
    	labels: ["Applicances", "Clothing", "Electronics", "Helth & Pharmacy", "Furniture", "Grocery"],
    	data: [130, 70, 100, 300, 200, 1000]
    };
    
    $scope.pie = {
    	labels : ["Walmart", "Zehrs", "Shoppers", "Food basic", "Canadian Tire", "Sobei"],
    	data : [40, 20, 10, 10, 5, 5]
    };

    $scope.donut1 = {
    	labels : ["Gift", "Re", "Mail-Order Sales", "Tele Sales", "Corporate Sales"],
    	data : [300, 500, 100, 40, 120]
    };
    */
    $scope.radar = {
        labels:["Eating", "Drinking", "Wearing", "Entertaining", "Buying", "Training"],

        data:[
            [30, 15, 20, 10, 15, 10]
            //, [28, 48, 40, 19, 96, 27, 100]
        ]
    };

    $scope.dynamic = {
    	labels : ["Download Sales", "In-Store Sales", "Mail-Order Sales", "Tele Sales", "Corporate Sales"],
    	data : [300, 500, 100, 40, 120],
    	type : 'PolarArea',

    	toggle : function () 
    	{
    		this.type = this.type === 'PolarArea' ? 'Pie' : 'PolarArea';
    	}
    };


}]);