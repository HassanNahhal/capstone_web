angular
  .module('app')
  .factory('IntroHeaderService', ['$rootScope',  function($rootScope){
    function isIntroHeaderVisible(home){
      if(home){
        if(!$('header').is(":visible")){
          $('header').show();
          $('.navbar-default').removeClass('navbar-shrink' );
        } 
      }else{
        if($('header').is(":visible")){
          $('header').hide();
          $('.navbar-default').addClass('navbar-shrink' );        
        }      
      }
    };
    return {
      isIntroHeaderVisible: isIntroHeaderVisible
    };
  }]);