// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: loopback-getting-started-intermediate
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

angular
  .module('app')
  .controller('AuthLoginController', ['$scope', 'AuthService', '$state', '$rootScope', 
      function($scope, AuthService, $state, $rootScope) {    

    //if(!$('.staticNavSigup').is(":visible")){
    //  $('.staticNavSigup').show();       
    //}        

    $scope.user = {
      email: "joe@gmail.com",
      password: "aaa"
    };

    var flashMessage;

    $scope.login = function() {
      AuthService.login($scope.user.email, $scope.user.password)
        .then(function() {
          //Check the invalid user, and giving a message will need
          flashMessage = '#loginErrorMessage';
          if($rootScope.currentUser == undefined){
            $scope.showMessage(flashMessage); 
          }
        }, function(err){
          console.log("Error of login at Login page: ", err);
        });
    };

    $scope.showMessage = function(flashMessage){
      $(flashMessage).addClass("in"); 
      window.setTimeout(function(){
        $(flashMessage).removeClass("in"); 
      }, 3000);        
    }     
  }])
  .controller('AuthLogoutController', ['$scope', 'AuthService', '$state', 
      function($scope, AuthService, $state) {
        
      AuthService.logout()
        .then(function() {          
          $state.go('/');
      });     
  }])
  .controller('SignUpController', ['$scope', 'AuthService', '$state', '$rootScope', 'Customer', 
      function($scope, AuthService, $state, $rootScope, Customer) {

    $scope.user = {};
    var flashMessage;
    $scope.register = function() {

      Customer.find({
        filter:{
          fields: {email: true},
          where: {email: $scope.user.email}          
        }
      })
      .$promise
      .then(function(user){
        if(user.length > 0){
          flashMessage = '#signUpErrorMessage';
          $scope.showMessage(flashMessage); 
          console.log("Already exist user", user);
        }else{
          AuthService.register($scope.user.email, $scope.user.password)
            .then(function(user) {
              console.log("SignUp user: ", user);
            });          
        }
      });    
    };

    $scope.showMessage = function(flashMessage){
      $(flashMessage).addClass("in"); 
      window.setTimeout(function(){
        $(flashMessage).removeClass("in"); 
      }, 3000);        
    };

  }])
  .controller('ProfileController', [
    '$scope', '$state', 'Customer', '$rootScope', 
    function($scope, $state, Customer, $rootScope) {     

      console.log("currentUser: ", $rootScope.currentUser);
      if($rootScope.currentUser == null || $rootScope.currentUser == undefined){
        $state.go('forbidden');
      }else{
        $scope.user = Customer.findById({id: $rootScope.currentUser.id});
        console.log("loggedin user; ", $scope.user);        
      }
  }])   
  // Admin Activities : admin codes are for Test, need to modify with correct authentication later
  .controller('AddCustomerController', ['$scope', 'Customer',  
      '$state', function($scope, Customer, $state) {       

    $scope.action = 'Add';
    $scope.user = {};

    $scope.submitForm = function() {
      Customer
        .create({
          username: $scope.username,
          email: $scope.email
        })
        .$promise
        .then(function() {
          $state.go('Customers');
        });
    };
  }])   
  .controller('AllCustomersController', [
    '$scope', 'Customer',  
    function($scope, Customer) {    
      $scope.users = Customer.find();    
  }])
  .controller('EditCustomerController', ['$scope', 'Customer', '$stateParams', '$state', 
      function($scope, Customer, $stateParams, $state) {
        $scope.action = 'Edit';

        Customer.findById({ id: $stateParams.id }).$promise
        .then(function(user){
          $scope.username = user.username;
          $scope.email = user.email;
        });  

        $scope.submitForm = function() {        
          Customer.prototype$updateAttributes(
              { id:$stateParams.id }, { username: $scope.username, email: $scope.email }
          )
          .$promise
          .then(function(){
            $state.go('Customers');
          });
        };
  }])
  .controller('DeleteCustomerController', ['$scope', 'Customer', '$state',
      '$stateParams', function($scope, Customer, $state, $stateParams) {
    Customer.groups.destroyAll({
      id: $stateParams.id
    })
    .$promise
    .then(function(){
      Customer
        .deleteById({ id: $stateParams.id })
        .$promise
        .then(function() {
          $state.go('Customers');
        });      
    });
  }]);
  // Admin Activities : admin codes are for Test, need to modify with correct authentication later