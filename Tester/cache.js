/* 
    MONGO-REDIS-OPLOG_CACHING = https://github.com/nosco/querycache
*/

/*-------------------------------------------------- USER------------------------------------- */
var user_roles = "http://localhost:3000/api/user/v1/rbac/roles/ROLE1";

var user_ernMenu = "http://localhost:3000/api/user/v1/rbac/rules/erpMenu";

var user_permissons = "http://localhost:3000/api/user/v1/permissionsPost"; //- Pending

/*-------------------------------------------------- BANNERS------------------------------------- */

var banner_v1 = "https://apigw.storeking.in/api/banner/v1/BANNERS-10006/fetch?franchise=F102501"

/*---------------------------------------------CATEGORY----------------------------------------------- */

var spc_list = "http://localhost:8082/api/category/v1/spc/list?count=8&filter={status:Active}&page=1&sort=name"

/* -------------------------------------------DEALS-------------------------------------- */

var deal_restriction = "/getBlockdataForDealListing"

var you_previously_bought = "http://localhost:8082/api/v1/youPreviouslyBought";

var top_selling = "http://localhost:8082/api/v1/topSelling/deals?classification=B2B&count=6&filter={acceptOrder:true,type:B2B}"