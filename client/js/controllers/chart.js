'use strict';

angular.module('app')
  .controller('ChartCtrl', ['$scope', '$timeout', 'Receipt', '$rootScope', 
    '$state', '$stateParams', 
    function ($scope, $timeout, Receipt, $rootScope, $state, $stateParams) {      

    $scope.groupName = $stateParams.groupName;   
    $scope.receipts;
    $scope.tagchartpercent = [];
    $scope.isChart;

    var userId, groupId;
    if($stateParams.groupId == undefined){
      userId = $rootScope.currentUser.id;
      groupId = "";
    }else{
      userId = $stateParams.ownerId;
      groupId = $stateParams.groupId;
    } 

    $(window).resize(function(){
        $scope.footerRelocate();
    }); 
        
    $('pagefooter').removeAttr('style');
    $scope.footerRelocate = function(){
        if(!$scope.isChart){
            $('pagefooter.myfooter').css('position', 'absolute').css('bottom',0);
        }else{
            $('pagefooter').removeAttr('style');
        }        
    }
    $scope.footerRelocate();    

    $scope.viewGroup = function(){
        if($stateParams.groupId != undefined){
             $state.go('viewGroup', {'id': $stateParams.groupId});
        }        
    }  

    $scope.generatePDF = function(id, chart){
        var pdfSource = '#' + id;
        var pdfFilename = id + '.pdf';
        var pdf = new jsPDF('l', 'pt', 'letter');
        var source = $(pdfSource)[0];

        var canvas;
        var imgData;
        var imgWidth = pdf.internal.pageSize.width - 100;
        var imgHeight = pdf.internal.pageSize.height - 100;    

        if(chart != ''){
            canvas = $('#' + chart)[0];
            imgData = canvas.toDataURL("image/png");
            pdf.addImage(imgData, 'png', 50, 50, imgWidth, imgHeight);
        }

        var specialElementHandlers = {
            '#bypassme': function(element, renderer){
                return true;
            }
        };
        var margins = {
            top: 10,
            left: 20,
            width: 500
        };
        pdf.fromHTML(
            source
            , margins.left
            , margins.top
            , {
                'width': margins.width
                , 'elementHandlers': specialElementHandlers
            },
            function(dispose){
                pdf.save(pdfFilename);
            }
        );

    };

    var totals;
    var dates; 
    var monthlyTotal, monthlyTotalKey;
    var monthlyTotalLastYear, monthlyTotalLastYearKey;
    var monthNum, monthRangeArray;
    var monthNameFromDate; 
    var stores, storesTotal, tags, categories;
    var countOfTags, countOfReceipts;
    var catetory_donut_labels;
    var catetory_donut_data; 
    var tag_donut_labels;
    var tag_donut_data;  
    var store_pie_labels;
    var store_pie_data, store_pie_data_total;       

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
    //var ONE_MONTH = 30 * 24 * 60 * 60 * 1000; // Month in milliseconds
    var monthNames = [  "January", "February", "March", "April", 
                        "May", "June", "July", "August", 
                        "September", "October", "November", "December"
                    ];

  $scope.commaSeparateNumber =   function(val){
    if(val != undefined){
      var tmp = ("" + val).split(".");
      var valComma;
      if(tmp.length>1){
        valComma = tmp[0];
        if(tmp[1].length > 1){
          valComma += "." + tmp[1].substring(0,2);
        }else{
          valComma += "." + tmp[1].substring(0,1) + "0";
        }
      }else{
        valComma = tmp[0] + ".00";
      }
      val = valComma;        
    }    
    return val;
  };

    $scope.monthConsumptionChart = function(rangeOfMonth){

        // Set start first day of month
        var date = new Date();
        var year = date.getFullYear();
        var month = date.getMonth();
        var startDate;  // Every month first
        var startDateThisYear, startDateLastYear;
        if(month - rangeOfMonth >= 0){
            startDate = new Date(year, month-rangeOfMonth, 1);
        }else{
            startDate = new Date(year -1 , 12 + (month-rangeOfMonth), 1);        
        }
        startDateThisYear = new Date(startDate - 1);

        var j = 0;
        var m = 0;
        var s = 0;
        monthRangeArray = new Array(rangeOfMonth+1);
        for(var i = 0 ; i <= rangeOfMonth  ; i++){
            m = startDate.getMonth() + j;
            if(m < 12){
                monthRangeArray[i] = m;
            }else{
                monthRangeArray[i] = s;
                s++;
            }            
            j++;
        }

        totals = [];
        dates = []; 
        monthlyTotal = [];
        monthlyTotalKey = {};
        monthlyTotalLastYear = [];
        monthlyTotalLastYearKey = {};
        monthNum = [];
        monthNameFromDate = [];
        stores = {};
        storesTotal = {};
        tags = {};
        categories = {};  
        countOfReceipts = countOfTags = 0;  
        catetory_donut_labels = [];
        catetory_donut_data = []; 
        tag_donut_labels = [];
        tag_donut_data = [];  
        store_pie_labels = [];
        store_pie_data = []; 
        store_pie_data_total = []; 

        //{date: {gte: new Date('2015-12-31T00:00:00.000Z')}}   
        //Wed Jun 01 2016 00:00:00 GMT-0400 (Eastern Daylight Time)                          

        Receipt.find({
            filter: {
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
                    {date: {gt: startDateThisYear}},
                    {and: [
                        {customerId: userId},
                        {groupId: groupId}
                    ]}                  
                ]},
                order: 'date DESC'                
            }
        })
        .$promise
        .then(function(receipts){

            if(receipts.length < 1){
                $('#chart').hide();
                $('#noChart').show();
                $scope.isChart = false;
                $scope.footerRelocate();
                //$('pagefooter.myfooter').css('position', 'absolute').css('bottom',0);
            }else{
                $('#noChart').hide();
                $scope.isChart = true;
                $scope.footerRelocate();
                //$('pagefooter').removeAttr('style'); 

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
                            monthlyTotalKey[thisMonth] = $scope.commaSeparateNumber(monthTotal);
                            monthTotal = 0;
                        }
                    }else{
                        monthlyTotal.push(monthTotal);
                        monthNum.push(thisMonth);
                        monthlyTotalKey[thisMonth] = $scope.commaSeparateNumber(monthTotal);
                        monthTotal = 0;
                    }
                }
                //if no monthly data exist, set total value = 0
                monthlyTotal = [];
                for(var i = 0; i < monthRangeArray.length ; i++){
                    monthNameFromDate.push(monthNames[monthRangeArray[i]]);   
                    if(monthlyTotalKey[monthRangeArray[i]] == undefined){
                        monthlyTotal.push(0);
                    }else{
                        monthlyTotal.push(monthlyTotalKey[monthRangeArray[i]]);
                    }
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
                startDateLastYear = new Date(startDate - 1);
                //console.log("startDateLastYear: ", startDateLastYear);
                //console.log("endDate: ", endDate);

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
                                    {date: {gt: startDateLastYear}},
                                    {date: {lt: endDate}}
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
                    for(var i = totals.length -1 ; i >= 0 ; i--){
                        monthTotal += totals[i];
                        thisMonth = (new Date(dates[i])).getMonth();
                        if((i-1 >= 0)){
                            nextMonth = (new Date(dates[i-1])).getMonth();
                            if(thisMonth != nextMonth){
                                monthlyTotalLastYear.push(monthTotal);
                                monthlyTotalLastYearKey[thisMonth] = $scope.commaSeparateNumber(monthTotal);
                                monthTotal = 0;
                            }
                        }else{
                            monthlyTotalLastYear.push(monthTotal);
                            monthlyTotalLastYearKey[thisMonth] = $scope.commaSeparateNumber(monthTotal);
                            monthTotal = 0;
                        }
                    }
                    //if no monthly data exist, set total value = 0
                    monthlyTotalLastYear = [];
                    for(var i = 0; i < monthRangeArray.length ; i++){ 
                        if(monthlyTotalLastYearKey[monthRangeArray[i]] == undefined){
                            monthlyTotalLastYear.push(0);
                        }else{
                            monthlyTotalLastYear.push(monthlyTotalLastYearKey[monthRangeArray[i]]);
                        }
                    } 

                    // Bar Chart comparion of monthly of this year and last year
                    $scope.bar = {
                        labels: monthNameFromDate,
                        series: [$scope.thisYear-1, $scope.thisYear],
                        data: [
                           monthlyTotalLastYear,
                           monthlyTotal
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
                        storesTotal[receipt.store.name] = receipt.total;
                    }else{
                        stores[receipt.store.name] += 1;
                        storesTotal[receipt.store.name] += receipt.total;
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

                // more than 7 items, get rest of items named as "Others" and sum their values
                var count = 1;
                var otherTotal = 0;
                angular.forEach(categories, function(category, key){
                    if(count < 8){
                        catetory_donut_labels.push(key);
                        catetory_donut_data.push(Number(((categories[key]/countOfReceipts)*100).toFixed(2)));
                        count++;
                    }else{
                        
                        otherTotal = otherTotal + Number(((categories[key]/countOfReceipts)*100).toFixed(2));
                    }                    
                });
                if(count >= 8){
                    catetory_donut_labels.push('others');
                    catetory_donut_data.push(Number(otherTotal).toFixed(2));                    
                }

                count = 1;
                otherTotal = 0;
                var otherStoreAmount = 0;
                angular.forEach(stores, function(store, key){
                    if(count < 8){
                        store_pie_labels.push(key);
                        store_pie_data.push(Number(((stores[key]/countOfReceipts)*100).toFixed(2)));
                        store_pie_data_total.push(Number(storesTotal[key]).toFixed(2));
                        count++;
                    }else{
                        otherTotal = otherTotal + Number(((stores[key]/countOfReceipts)*100).toFixed(2));
                        otherStoreAmount = otherStoreAmount + storesTotal[key];
                    }
                });
                if(count >= 8){
                    store_pie_labels.push('others');
                    store_pie_data.push(Number(otherTotal).toFixed(2));                    
                    store_pie_data_total.push(Number(otherTotal).toFixed(2)); 
                }                

                count = 1;
                otherTotal = 0;
                var tagprogresschart = [];
                var tagValue = 0;
                var tagType;
                angular.forEach(tags, function(tag, key){
                  if(count < 8){
                        tag_donut_labels.push(key);
                        tag_donut_data.push(Number(((tags[key]/countOfTags)*100).toFixed(2)));
                        count++;
                    }else{
                        otherTotal = otherTotal + Number(((tags[key]/countOfTags)*100).toFixed(2));
                    }
                    tagValue = Number(((tags[key]/countOfTags)*100).toFixed(2));
                    if (tagValue <= 5) {
                      tagType = 'danger';
                    } else if (tagValue <= 10) {
                      tagType = 'success';
                    } else if (tagValue <= 15) {
                      tagType = 'primary';
                    } else if (tagValue <= 20) {
                      tagType = 'info';
                    } else if (tagValue <= 55) {
                      tagType = 'warning';
                    } else {
                      tagType = 'danger';
                    }
                    tagprogresschart.push({
                        name: key,
                        value: tagValue,
                        type: tagType
                    });
                });
                if(count >= 8){
                    tag_donut_labels.push('others');
                    tag_donut_data.push(Number(otherTotal).toFixed(2));                    
                } 
                $scope.tagchartpercent =  tagprogresschart;
                //console.log("tagprogresschart: ", tagprogresschart);                                      

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
                // Radar chart for Tags
                $scope.radar = {
                    labels:tag_donut_labels,
                    data:[
                        tag_donut_data
                    ]
                };

                // Polar Area Chart Monthly Comsumption
                $scope.polararea = {
                    labels : store_pie_labels,
                    data : store_pie_data_total  
                };                                              

            }   // if(receipts)

        }); // .then(function(receipts){


    } // $scope.monthConsumptionChart = function(rangeOfMonth){

    // When change the range of month, re-draw line chart
    $scope.changRangeOfMonth = function(){
        $scope.monthConsumptionChart($scope.selectedMonth.number);
    }
    // default range of month is 6 months
    $scope.monthConsumptionChart($scope.selectedMonth.number);   
   
}]);