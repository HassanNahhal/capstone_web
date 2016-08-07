angular
  .module('app')
  .factory('IntroHeaderService', ['$rootScope',  function($rootScope){
    function isIntroHeaderVisible(home){
      if(home){
        $('.navbar-brand').attr("href", "#page-top");
        if(!$('header').is(":visible")){
          $('header').show();
          $('.navbar-default').removeClass('navbar-shrink' );
          $('.navbar-default').removeClass('navbar-show' );
        } 
        if(!$rootScope.currentUser){    
            $('.staticNavMenu').removeClass("active");   
            if(!$('.staticNavMenu').is(":visible")){
              $('.staticNavMenu').show();       
            }     
        }  
        $('pagefooter').removeAttr('style');     
      }else{
        $('.navbar-brand').attr("href", "/");
        if($('header').is(":visible")){
          $('header').hide();
          $('.navbar-default').addClass('navbar-shrink' );        
          $('.navbar-default').addClass('navbar-show' );
        } 
        if(!$rootScope.currentUser){    
            if($('.staticNavMenu').is(":visible")){
              $('.staticNavMenu').removeClass("active");
              $('.staticNavMenu').hide();       
            }     
        }        
      } 

    };
    return {
      isIntroHeaderVisible: isIntroHeaderVisible
    };
  }]);