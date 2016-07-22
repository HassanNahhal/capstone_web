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
  }]);