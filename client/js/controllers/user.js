// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: loopback-getting-started-intermediate
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

angular
  .module('app')
  .controller('AuthLoginController', ['$scope', 'AuthService', '$state',
      function($scope, AuthService, $state) {
    $scope.user = {};
    $scope.login = function() {
      AuthService.login($scope.user.email, $scope.user.password)
        .then(function() {
          //Check the invalid user, and giving a message will need
          $state.go('Dashboard');
        }, function (err) {
          console.log("error at login");
      });
    };
          
    $scope.localLogin = function() {
       AuthService.localLogin($scope.user.email, $scope.user.password)
        .then(function() {
          //Check the invalid user, and giving a message will need
          $state.go('Dashboard');
        }, function (err) {
          console.log("error at login");
      });
    };
          
    $scope.facebookLogin = function() {
      AuthService.facebookLogin()
        .then(function() {
          //Check the invalid user, and giving a message will need
          $state.go('Dashboard');
        }, function (err) {
          console.log("error at login");
      });
         
    };
        

  }])
  .controller('AuthLogoutController', ['$scope', 'AuthService', '$state', 
      function($scope, AuthService, $state) {
      AuthService.logout()
        .then(function() {
          $state.go('Home');
      });
          
      //********* Below code is not correct, just for test of logout
      //which needed to modify with correct authentication
      //$rootScope.currentUser = null; 
      //sessionStorage.removeItem('access_token');  
      //$state.go('Home');   
      //********* Above code is not correct, just for test of logout     
  }])
  .controller('SignUpController', ['$scope', 'AuthService', '$state', '$rootScope', 
      function($scope, AuthService, $state, $rootScope) {
    $scope.user = {};
    $scope.register = function() {      
      AuthService.register($scope.user.username, $scope.user.email, $scope.user.password)
        .then(function(user) {
          //below code is temporary for test need to adopt athentication correctly later
          $rootScope.currentUser = user;
          $state.transitionTo('Login');
        });
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
    '$scope', 'Customer', function($scope, Customer) {
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