// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: loopback-getting-started-intermediate
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

angular
  .module('app')
  .factory('AuthService', ['Customer', '$q', '$rootScope', '$state', 
    function(User, $q, $rootScope, $state) {

    function login(email, password) {   

      return User
        .login({email: email, password: password})
        .$promise
        .then(function(response) {  
            $rootScope.currentUser = {
              id: response.user.id,
              tokenId: response.id,
              email: email,
              username: response.user.username
            };
            sessionStorage.setItem('access_token', JSON.stringify($rootScope.currentUser));
            $state.go('Dashboard');            
        }, function(err){ 
          console.log("Error of Login for auth: ", err);
        });
    }

    function logout() {
      return User
       .logout()
       .$promise
       .then(function() {          
          $rootScope.currentUser = null;
          sessionStorage.removeItem('access_token');
       });
    }

    function register(email, password) {
      return User
        .create({
         email: email,
         password: password
       })
       .$promise
       .then(function(response){
          login(email, password);
       }, function(err){
          console.log("Error in SignUp: ", err);
       });
    }

    return {
      login: login,
      logout: logout,
      register: register
    };
  }]);