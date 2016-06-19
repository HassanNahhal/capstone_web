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
    function ($scope, $timeout, Receipt, $rootScope) {

    var userId = $rootScope.currentUser.id;

    var totals;
    var dates; 
    var monthlyTotal;
    var monthlyTotalLastYear;
    var monthNum;
    var monthNameFromDate; 

    $scope.selectedMonth;
    $scope.thisYear = (new Date()).getFullYear();
    $scope.rangeOfMonth = 5;    // means recent 6 months
    $scope.twelvemonths = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    // Get recent 6 months receipts
    var ONE_MONTH = 30 * 24 * 60 * 60 * 1000; // Month in milliseconds
    var monthNames = [  "January", "February", "March", "April", 
                        "May", "June", "July", "August", 
                        "September", "October", "November", "December"
                    ];

    $scope.monthConsumptionChart = function(rangeOfMonth){
        //console.log("number: ", rangeOfMonth);
        totals = [];
        dates = []; 
        monthlyTotal = [];
        monthlyTotalLastYear = [];
        monthNum = [];
        monthNameFromDate = [];         

        Receipt.find({
            filter: {
                order: 'date DESC', 
                include: ['store', 'customer'],
                where: {and: [
                    {customerId: userId},
                    {date: {gt: Date.now() - ONE_MONTH * rangeOfMonth}}
                    //{date: {gt: new Date('2015-12-31T00:00:00.000Z')}}
                ]}
            }
        })
        .$promise
        .then(function(receipts){
            totals = receipts.map(function(receipt){ return receipt.total});
            dates = receipts.map(function(receipt){ return receipt.date});
            var monthTotal = 0;
            var thisMonth = 0;
            var nextMonth = 0;
            var randomValue = 0;
            for(var i = totals.length -1 ; i >= 0 ; i--){
                monthTotal += totals[i];
                thisMonth = (new Date(dates[i])).getMonth();
                if((i-1 >= 0)){
                    nextMonth = (new Date(dates[i-1])).getMonth();
                    if(thisMonth != nextMonth){
                        monthlyTotal.push(monthTotal);
                        monthNum.push(thisMonth);
                        //Test data using 2016 from database
                        randomValue = monthTotal + Math.floor(Math.random() * 300) + 100;
                        monthlyTotalLastYear.push(randomValue);
                        monthTotal = 0;
                    }
                }else{
                    monthlyTotal.push(monthTotal);
                    monthNum.push(thisMonth);
                    //Test data using 2016 from database
                    randomValue = monthTotal + Math.floor(Math.random() * 300) + 100;
                    monthlyTotalLastYear.push(randomValue);
                    monthTotal = 0;
                }
            }
            for(var i = 0; i < monthNum.length ; i++){
                monthNameFromDate.push(monthNames[monthNum[i]]);
            }              
        });
        console.log("last year month: ", monthlyTotalLastYear);

        // Line Chart retrieved from real data of database
        $scope.line = {
            labels: monthNameFromDate,      //['January', 'February', 'March', 'April', 'May', 'June'],        
            series: [$scope.thisYear],      //series: ['2016'],
            data: [
                monthlyTotal                //[1900, 1650, 1700, 2100, 1600, 1800]
            ]
        }; 

        // Bar Chart comparion of monthly of each year
        // not the real data test using 2016 data from database
        $scope.bar = {
            labels: monthNameFromDate,
            series: [$scope.thisYear-1, $scope.thisYear],
            data: [
               monthlyTotal,
               monthlyTotalLastYear
            ]
            
        };


    }
    // When change the range of month, re-draw line chart
    $scope.changRangeOfMonth = function(){
        $scope.monthConsumptionChart($scope.selectedMonth-1);
    }
    // default range of month is 6 months
    $scope.monthConsumptionChart(5);    

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
    */
    /*
    $scope.bar = {
        labels: ['January', 'February', 'March', 'April', 'May', 'June'],
    	series: ['2015', '2016'],

    	data: [
    	   [2100, 1750, 1600, 1800, 1450, 1750],
    	   [1900, 1650, 1700, 2100, 1600, 1800]
    	]
    	
    };
    */

    $scope.donut = {
    	labels: ["Applicances", "Clothing", "Electronics", "Helth & Pharmacy", "Furniture", "Grocery"],
    	data: [130, 70, 100, 300, 200, 1000]
    };

    $scope.pie = {
    	labels : ["Walmart", "Zehrs", "Shoppers", "Food basic", "Canadian Tire", "Sobei"],
    	data : [40, 20, 10, 10, 5, 5]
    };

    $scope.radar = {
        labels:["Eating", "Drinking", "Wearing", "Entertaining", "Buying", "Training"],

        data:[
            [30, 15, 20, 10, 15, 10]
            //, [28, 48, 40, 19, 96, 27, 100]
        ]
    };

    $scope.donut1 = {
    	labels : ["Gift", "Re", "Mail-Order Sales", "Tele Sales", "Corporate Sales"],
    	data : [300, 500, 100, 40, 120]
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