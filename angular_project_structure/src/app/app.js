angular.module("my-app", [])
.constant("apis" , {
    login : "api/v1/login"
})
.constant("appconstants" , {})
/* .config(["$localStorageProvider", function ($localStorageProvider) {
    $localStorageProvider.setKeyPrefix("sk-");
}])
.config(function(stConfig) {
    stConfig.pagination.template = 'app/pages/widgets/smartTable/smartTablePagination.html';
}) */
.run(['$rootScope' , '$http' , function($rootScope , $http){
    console.log("----Inside angular run method-----");
}])
.controller("mainCtrl" , function($rootScope, $scope){
    console.log('----Inside angular main ctrl---');
});
