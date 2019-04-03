var product_scenarios = require("./product.scenarios");
var warehouse_scenarios = require("./warehouse.scenarios");
var orderMatrix_scenarios = require("./orderMatrix.scenarios");
var heuristic_scenarios = require("./heuristic.scenarios");

/* ------------------MAIN SCENARIOS------------------- */

module.exports = {
    product_scenarios : product_scenarios,
    warehouse_scenarios : warehouse_scenarios,
    orderMatrix_scenarios : orderMatrix_scenarios,
    heuristic_scenarios : heuristic_scenarios
}