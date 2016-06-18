'use strict';
/**
 * @ngdoc function
 * @name sbAdminApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sbAdminApp
 */
angular.module('app')
  .controller('ChartCtrl', ['$scope', '$timeout', function ($scope, $timeout) {
    $scope.line = {
	    labels: ['January', 'February', 'March', 'April', 'May', 'June'],
	    //series: ['Series A', 'Series B'],
        series: ['2016'],
	    data: [
	      [1900, 1650, 1700, 2100, 1600, 1800]
	      //, [28, 48, 40, 19, 86, 27, 90]
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