// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: loopback-getting-started-intermediate
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

angular
  .module('app')
  .factory('AuthService', ['Customer', '$q', '$rootScope', '$http',
    function(User, $q, $rootScope, $http) {
        
    function localLogin(email, assword) {
        console.log("localLogin: "+ JSON.stringify({email: $scope.user.email, password:$scope.user.password}));
        return $http.post("http://localhost:3000/auth/local", JSON.stringify({username: "infomat", password:$scope.user.password}))
        .$promise
        .then(function(response) {         
          $rootScope.currentUser = {
            id: response.user.id,
            tokenId: response.id,
            email: email,
            username: response.user.username
          };
          console.log("currentUser: ", $rootScope.currentUser);
          sessionStorage.setItem('access_token', JSON.stringify($rootScope.currentUser));
        });
    }
        
    function facebookLogin(email, assword) {
        
    }
            
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
          console.log("currentUser: ", $rootScope.currentUser);
          sessionStorage.setItem('access_token', JSON.stringify($rootScope.currentUser));
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

    function register(username, email, password) {
      return User
        .create({
         username: username,
         email: email,
         password: password
       })
       .$promise
       .then(function(response){
          //console.log("response: ", response);
          // below redirect login doesn't seem goood
          // need to create a page for sign up successfully
          login(email, password);
       });
    }

        
    return {
      login: login,
      logout: logout,
      register: register
    };
  }]);