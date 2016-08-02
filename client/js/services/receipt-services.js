angular
  .module('app')
  .factory('ReceiptService', ['Store', '$rootScope',  function(Store, $rootScope){
    function getCategoriesBySelectedStore(storeId, categoryId){
      return Store
        .findById({ 
          id: storeId,
          fields: {
            id: true,
            name: true
          },            
          filter: {         
            include: {
              relation: 'categories',
              scope:{
                fields: ['id', 'name']
              }
            }
          }
        })
        .$promise
        .then(function(store){
          var categories = $rootScope.categories = store.categories;
          console.log("store.categories in service: ", store.categories);
          if(store.categories.length > 0 && categoryId != null){
              var selectedCategoryIndex = categories.map(function(category){ 
                return category.id;
              }).indexOf(categoryId);
              $rootScope.selectedCategory = categories[selectedCategoryIndex];
          }
        }); 
    };

    function publicRemoveSpaceInString(str){
      return str.replace(/\s+/g, '');
    };

    function publicShowMessage(flashMessage){
      $(flashMessage).addClass("in"); 
      window.setTimeout(function(){
        $(flashMessage).removeClass("in"); 
      }, 3000);        
    };    
    return {
      getCategoriesBySelectedStore: getCategoriesBySelectedStore,
      publicShowMessage: publicShowMessage,
      publicRemoveSpaceInString: publicRemoveSpaceInString
    };
  }])
  .factory('Excel',function($window){
        var uri='data:application/vnd.ms-excel;base64,',
            template='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>',
            base64=function(s){return $window.btoa(unescape(encodeURIComponent(s)));},
            format=function(s,c){return s.replace(/{(\w+)}/g,function(m,p){return c[p];})};
        return {
            tableToExcel:function(tableId,worksheetName){
                var table=$(tableId),
                    ctx={worksheet:worksheetName,table:table.html()},
                    href=uri+base64(format(template,ctx));
                return href;
            }
        };
  });