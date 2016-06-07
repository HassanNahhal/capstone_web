'use strict';
 
angular
 .module('app', [
    'ui.router',
    'lbServices',
    'angularFileUpload',
    'btorfs.multiselect',
    'oc.lazyLoad',
    'angular-loading-bar'
 ])
 .config(['$stateProvider', '$urlRouterProvider', '$ocLazyLoadProvider', function(
 	$stateProvider, $urlRouterProvider, $ocLazyLoadProvider) {

    $ocLazyLoadProvider.config({
      debug:false,
      events:true,
    });	

   $stateProvider  
		.state('Home', {
			url: '/Home',
			templateUrl: 'views/pages/home.html'
		})
		.state('About', {
			url: '/About',
			templateUrl: 'views/pages/about.html'
		})
		.state('Contact', {
			url: '/Contact',
			templateUrl: 'views/pages/contact.html'
		})				
      	.state('Items', {
			url: '/Items',
			templateUrl: 'views/items/items.html',
			controller: 'AllItemsController'
		})
		.state('deleteItem', {
	        url: '/deleteItem/:id',
	        controller: 'DeleteItemController'
      	})	
		.state('editItem', {
	        url: '/editItem/:id',
	        templateUrl: 'views/items/item-form.html',
	        controller: 'EditItemController'
      	})
		.state('addFile', {
			url: '/addFile',
			templateUrl: 'views/files/addFile.html',
			authenticate: true
		})    		     		      				   
		.state('Stores', {
			url: '/Stores',
			templateUrl: 'views/stores/stores.html',
			controller: 'AllStoresController'
		})
		.state('addStore', {
			url: '/addStore',
			templateUrl: 'views/stores/store-form.html',
			controller: 'AddStoreController'
			// , authenticate: true
		}) 		
		.state('editStore', {
			url: '/editStore/:id',
			templateUrl: 'views/stores/store-form.html',
			controller: 'EditStoreController'//
			//, authenticate: true
		})
		.state('deleteStore', {
	        url: '/deleteStore/:id',
	        controller: 'DeleteStoreController'
      	})
		.state('Tags', {
			url: '/Tags',
			templateUrl: 'views/tags/tags.html',
			controller: 'AllTagsController'
		})
		.state('addTag', {
			url: '/addTag',
			templateUrl: 'views/tags/tag-form.html',
			controller: 'AddTagController'
			// , authenticate: true
		}) 		
		.state('editTag', {
			url: '/editTag/:id',
			templateUrl: 'views/tags/tag-form.html',
			controller: 'EditTagController'//
			//, authenticate: true
		})
		.state('deleteTag', {
	        url: '/deleteTag/:id',
	        controller: 'DeleteTagController'
      	})      	
		.state('Categories', {
			url: '/Categories',
			templateUrl: 'views/categories/categories.html',
			controller: 'AllCategoriesController'
		})
		.state('addCategory', {
			url: '/addCategory',
			templateUrl: 'views/categories/category-form.html',
			controller: 'AddCategoryController'
			// , authenticate: true
		}) 		
		.state('editCategory', {
			url: '/editCategory/:id',
			templateUrl: 'views/categories/category-form.html',
			controller: 'EditCategoryController'//
			//, authenticate: true
		})
		.state('deleteCategory', {
	        url: '/deleteCategory/:id',
	        controller: 'DeleteCategoryController'
      	})      	
		.state('addReceipt', {
			url: '/addReceipt',
			templateUrl: 'views/receipts/receipt-form.html',
			controller: 'AddReceiptController'
			//authenticate: true
		})
		.state('editReceipt', {
			url: '/editReceipt/:id',
			templateUrl: 'views/receipts/receipt-form.html',
			controller: 'EditReceiptController'
			//authenticate: true
		}) 		      	
      	.state('Receipts', {
			url: '/Receipts',
			templateUrl: 'views/receipts/receipts.html',
			controller: 'AllReceiptsController'
		})
		.state('deleteReceipt', {
        url: '/deleteReceipt/:id',
        controller: 'DeleteReceiptController'
      	})
		.state('Customers', {
			url: '/Customers',
			templateUrl: 'views/users/users.html',
			controller: 'AllCustomersController'
		})
		.state('addCustomer', {
			url: '/addCustomer',
			templateUrl: 'views/users/user-form.html',
			controller: 'AddCustomerController'
			// , authenticate: true
		}) 		
		.state('editCustomer', {
			url: '/editCustomer/:id',
			templateUrl: 'views/users/user-form.html',
			controller: 'EditCustomerController'//
			//, authenticate: true
		})
		.state('deleteCustomer', {
	        url: '/deleteCustomer/:id',
	        controller: 'DeleteCustomerController'
      	})      	
		.state('Login', {
			url: '/Login',
			templateUrl: 'views/users/login.html',
			controller: 'AuthLoginController'
		})
		.state('Logout', {
			url: '/Logout',
			controller: 'AuthLogoutController'
		})		
		.state('Signup', {
			url: '/Signup',
			templateUrl: 'views/users/signup.html',
			controller: 'SignUpController'
		})
		.state('Profile', {
			url: '/Profile',
			templateUrl: 'views/users/profile.html',
			controller: 'ProfileController'
		})
		.state('Groups', {
			url: '/Groups',
			templateUrl: 'views/groups/groups.html',
			controller: 'AllGroupsController'
		})	
		.state('addGroup', {
			url: '/addGroup',
			templateUrl: 'views/groups/group-form.html',
			controller: 'AddGroupController'
		})	
		.state('editGroup', {
			url: '/editGroup/:id',
			templateUrl: 'views/groups/group-form.html',
			controller: 'EditGroupController'
		})
		.state('deleteGroup', {
	        url: '/deleteGroup/:id',
	        controller: 'DeleteGroupController'
      	})
		.state('Charts', {
			url: '/Charts',
			templateUrl: 'views/users/charts.html'
		})       	
		.state('Dashboard', {
			url: '/Dashboard',
			templateUrl: 'views/users/dashboard.html'
		})      	 					
		.state('forbidden', {
			url: '/forbidden',
			templateUrl: 'views/pages/forbidden.html'
		})
		.state('chart',{
			url:'/chart',
			templateUrl:'views/users/chart.html',			
			controller:'ChartCtrl',
			resolve: {
			  loadMyFile:function($ocLazyLoad) {
			    return $ocLazyLoad.load({
			      name:'chart.js',
			      files:[
			        'vendor/angular-chart.js/dist/angular-chart.min.js',
			        'vendor/angular-chart.js/dist/angular-chart.css'
			      ]
			    }),
			    $ocLazyLoad.load({
			        name:'app',
			        files:['js/controllers/chart.js']
			    })
			  }
			}
		});	

   $urlRouterProvider.otherwise('Home');

 }]);