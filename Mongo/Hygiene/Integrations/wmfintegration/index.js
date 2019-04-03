/**
 * @author Aman kareem <aman.kareem@storeking.in>
 * @since Oct 31st 2018;
 */
"use strict;"
var _ = require("lodash");
var async = require("async");
var http = require("http");
var https = require("https");
var chalk = require('chalk');
var chalker = new chalk.constructor({ enabled: true, level: 1 });

/* 
    - Abstraction layer for warehouse partner integrations like Walmart;
    - Implementation Layer is abstract and is called by this communication wrapper;
    - All Implementation layers must implement the functions defined in this layer;
    - Implementation layers Directors and main file must be named as per the given Integration key at the FC definition in DB;  

*/

/**
 * Pass process.env to this function;
 * @param {*} environment 
 * @param {*} logger 
 */
function Fulfillment() {

}

Fulfillment.prototype = {
    /**
     * Environment : DEV / PRE-PROD / LIVE  - This should be passed from node process.env only in order to avoid malfunction
     */
    environment: null,

    logger: null,
    /**
     * Life cycle value ;
     */
    established: false, // Will be set to true by lifecycle function init() only
    /**
     * 
     */
    hearBeat: function () {

        if (this.logger)
            this.logger.trace(chalker.green.bold(`[ ${this.environment.msg} ] WMF Integration layer is up & running ! ......`));
        else
            console.log(chalker.green.bold(`[ ${this.environment.msg} ] WMF Integration layer is up & running ! ......`));
    },
    /**
     * Life cycle function and  must be called;
     */
    init: function (env, logger) {

        this.environment = {};

        this.logger = logger;

        if (!env || env === undefined) {
            this.established = false;
        } else {

            if (typeof env.PROD_ENV === 'string') {
                this.environment.isProd = JSON.parse(env.PROD_ENV.toLowerCase());
            } else {
                this.environment.isProd = env.PROD_ENV;
            }

            if (this.environment.isProd) {
                this.environment.msg = `PRODUCTION`;
            } else {
                this.environment.msg = `SANDBOX`;
            }

            this.established = true;

            this.hearBeat();
        }

    },

    /**
     * 
     */
    login: function (fc) {
        return new Promise((resolve, reject) => {

            if (!this.established) {
                reject(new Error(`Life cycle function init is not called`));
                return;
            }
            if (!fc) {
                reject(new Error(`FC cannot be empty`));
                return;
            }

            try {
                var integrationKey = fc.partner.integrationKey;
                var intergrationLayer = require(`./integrations/${integrationKey}/${integrationKey}`);

                if (!intergrationLayer) {
                    reject(new Error(`Could not find Intergration layer , Check if partner integration key is correctly mapped to FC.`));
                }
                else {
                    intergrationLayer.login(this.environment, fc).then(result => resolve(result)).catch(e => reject(e));
                }

            } catch (e) {
                reject(e);
            }

        });
    },

    /**
     * 
     */
    logout: function (fc) {
        return new Promise((resolve, reject) => {

            if (!this.established) {
                reject(new Error(`Life cycle function init is not called`));
                return;
            }
            if (!fc) {
                reject(new Error(`FC cannot be empty`));
                return;
            }

            try {
                var integrationKey = fc.partner.integrationKey;
                var intergrationLayer = require(`./integrations/${integrationKey}/${integrationKey}`);

                if (!intergrationLayer) {
                    reject(new Error(`Could not find Intergration layer , Check if partner integration key is correctly mapped to FC.`));
                }
                else {
                    intergrationLayer.logout(this.environment, fc).then(result => resolve(result)).catch(e => reject(e));
                }

            } catch (e) {
                reject(e);
            }

        });
    },

    /**
     * 
     */
    getAllCategories: function (fc) {
        return new Promise((resolve, reject) => {

            if (!this.established) {
                reject(new Error(`Life cycle function init is not called`));
                return;
            }
            if (!fc) {
                reject(new Error(`FC cannot be empty`));
                return;
            }
        });
    },

    /**
     * 
     */
    getAllParentCategories: function (fc) {
        return new Promise((resolve, reject) => {
            if (!this.established) {
                reject(new Error(`Life cycle function init is not called`));
                return;
            }
            if (!fc) {
                reject(new Error(`FC cannot be empty`));
                return;
            }

            try {
                var integrationKey = fc.partner.integrationKey;
                var intergrationLayer = require(`./integrations/${integrationKey}/${integrationKey}`);

                if (!intergrationLayer) {
                    reject(new Error(`Could not find Intergration layer , Check if partner integration key is correctly mapped to FC.`));
                }
                else {
                    intergrationLayer.getAllParentCategories(this.environment).then(result => resolve(result)).catch(e => reject(e));
                }

            } catch (e) {
                reject(e);
            }

        });
    },

    /**
     * 
     */
    getCategoryById: function (fc, categoryId) {
        return new Promise((resolve, reject) => {

            if (!this.established) {
                reject(new Error(`Life cycle function init is not called`));
                return;
            }
            if (!fc) {
                reject(new Error(`FC cannot be empty`));
                return;
            }

        });
    },

    /**
     * 
     */
    getParentCategory: function (fc, categoryId) {
        return new Promise((resolve, reject) => {

            if (!this.established) {
                reject(new Error(`Life cycle function init is not called`));
                return;
            }
            if (!fc) {
                reject(new Error(`FC cannot be empty`));
                return;
            }

        });
    },

    /**
     * 
     */
    getCategoryChildren: function (fc, categoryId) {
        return new Promise((resolve, reject) => {

            if (!this.established) {
                reject(new Error(`Life cycle function init is not called`));
                return;
            }
            if (!fc) {
                reject(new Error(`FC cannot be empty`));
                return;
            }

            try {
                var integrationKey = fc.partner.integrationKey;
                var intergrationLayer = require(`./integrations/${integrationKey}/${integrationKey}`);

                if (!intergrationLayer) {
                    reject(new Error(`Could not find Intergration layer , Check if partner integration key is correctly mapped to FC.`));
                }
                else {
                    intergrationLayer.getCategoryChildren(this.environment, categoryId).then(result => resolve(result)).catch(e => reject(e));
                }

            } catch (e) {
                reject(e);
            }

        });
    },

    /**
     * 
     */
    getProductsByCategory: function (fc, categoryId) {
        return new Promise((resolve, reject) => {

            if (!this.established) {
                reject(new Error(`Life cycle function init is not called`));
                return;
            }
            if (!fc) {
                reject(new Error(`FC cannot be empty`));
                return;
            }

            try {
                var integrationKey = fc.partner.integrationKey;
                var intergrationLayer = require(`./integrations/${integrationKey}/${integrationKey}`);

                if (!intergrationLayer) {
                    reject(new Error(`Could not find Intergration layer , Check if partner integration key is correctly mapped to FC.`));
                }
                else {
                    intergrationLayer.getProductsByCategory(this.environment, categoryId).then(result => resolve(result)).catch(e => reject(e));
                }

            } catch (e) {
                reject(e);
            }

        });
    },

    /**
     * 
     */
    getAllProducts: function (fc) {
        return new Promise((resolve, reject) => {

            if (!this.established) {
                reject(new Error(`Life cycle function init is not called`));
                return;
            }
            if (!fc) {
                reject(new Error(`FC cannot be empty`));
                return;
            }

        });
    },

    /**
     * 
     */
    getProductById: function (fc, productId) {
        return new Promise((resolve, reject) => {

            if (!this.established) {
                reject(new Error(`Life cycle function init is not called`));
                return;
            }
            if (!fc) {
                reject(new Error(`FC cannot be empty`));
                return;
            }

            try {
                var integrationKey = fc.partner.integrationKey;
                var intergrationLayer = require(`./integrations/${integrationKey}/${integrationKey}`);

                if (!intergrationLayer) {
                    reject(new Error(`Could not find Intergration layer , Check if partner integration key is correctly mapped to FC.`));
                }
                else {
                    intergrationLayer.getProductById(this.environment, productId).then(result => resolve(result)).catch(e => reject(e));
                }

            } catch (e) {
                reject(e);
            }

        });
    },

    /**
     * 
     */
    productByLocation: function (fc, sku) {
        return new Promise((resolve, reject) => {

            if (!this.established) {
                reject(new Error(`Life cycle function init is not called`));
                return;
            }
            if (!fc) {
                reject(new Error(`FC cannot be empty`));
                return;
            }
            if (!sku) {
                reject(new Error(`Product SKU cannot be empty.`));
                return;
            }

            try {
                var integrationKey = fc.partner.integrationKey;
                var intergrationLayer = require(`./integrations/${integrationKey}/${integrationKey}`);

                if (!intergrationLayer) {
                    reject(new Error(`Could not find Intergration layer , Check if partner integration key is correctly mapped to FC.`));
                }
                else {
                    intergrationLayer.productByLocation(this.environment, fc, sku).then(result => resolve(result)).catch(e => reject(e));
                }

            } catch (e) {
                reject(e);
            }

        });
    },

    /**
     * 
     */
    volumetricPricing: function (fc, productId) {
        return new Promise((resolve, reject) => {

            if (!this.established) {
                reject(new Error(`Life cycle function init is not called`));
                return;
            }
            if (!fc) {
                reject(new Error(`FC cannot be empty`));
                return;
            }
            if (!productId) {
                reject(new Error(`Product Id cannot be empty to fetch volumetric data..`));
                return;
            }

            try {
                var integrationKey = fc.partner.integrationKey;
                var intergrationLayer = require(`./integrations/${integrationKey}/${integrationKey}`);

                if (!intergrationLayer) {
                    reject(new Error(`Could not find Intergration layer , Check if partner integration key is correctly mapped to FC.`));
                }
                else {
                    intergrationLayer.volumetricPricing(this.environment, fc, productId).then(result => resolve(result)).catch(e => reject(e));
                }

            } catch (e) {
                reject(e);
            }

        });
    },

    /**
     * 
     */
    inventoryBuckets: function (fc, productsList, options) {
        return new Promise((resolve, reject) => {
            if (!this.established) {
                reject(new Error(`Life cycle function init is not called`));
                return;
            }
            if (!fc) {
                reject(new Error(`FC cannot be empty`));
                return;
            }
            if (!productsList || !productsList.length) {
                reject(new Error(`Product List cannot be empty.`));
                return;
            }

            try {
                var integrationKey = fc.partner.integrationKey;
                var intergrationLayer = require(`./integrations/${integrationKey}/${integrationKey}`);

                if (!intergrationLayer) {
                    reject(new Error(`Could not find Intergration layer , Check if partner integration key is correctly mapped to FC.`));
                }
                else {
                    intergrationLayer.inventoryBuckets(this.environment, fc, productsList, options).then(result => resolve(result)).catch(e => reject(e));
                }

            } catch (e) {
                reject(e);
            }

        });
    },

    /**
     * 
     */
    startSession: function (fc) {
        return new Promise((resolve, reject) => {

            if (!this.established) {
                reject(new Error(`Life cycle function init is not called`));
                return;
            }
            if (!fc) {
                reject(new Error(`FC cannot be empty`));
                return;
            }

        });
    },

    /**
     * 
     */
    accessToken: function (fc) {
        return new Promise((resolve, reject) => {

            if (!this.established) {
                reject(new Error(`Life cycle function init is not called`));
                return;
            }
            if (!fc) {
                reject(new Error(`FC cannot be empty`));
                return;
            }

            try {
                var integrationKey = fc.partner.integrationKey;
                var intergrationLayer = require(`./integrations/${integrationKey}/${integrationKey}`);

                if (!intergrationLayer) {
                    reject(new Error(`Could not find Intergration layer , Check if partner integration key is correctly mapped to FC.`));
                }
                else {
                    intergrationLayer.accessToken(this.environment).then(result => resolve(result)).catch(e => reject(e));
                }

            } catch (e) {
                reject(e);
            }

        });
    },

    /**
     * 
     */
    addToCart: function (fc, data) {
        return new Promise((resolve, reject) => {

            if (!this.established) {
                reject(new Error(`Life cycle function init is not called`));
                return;
            }
            if (!fc) {
                reject(new Error(`FC cannot be empty`));
                return;
            }

            try {
                var integrationKey = fc.partner.integrationKey;
                var intergrationLayer = require(`./integrations/${integrationKey}/${integrationKey}`);

                if (!intergrationLayer) {
                    reject(new Error(`Could not find Intergration layer , Check if partner integration key is correctly mapped to FC.`));
                }
                else {
                    intergrationLayer.addToCart(this.environment, fc, data).then(result => resolve(result)).catch(e => reject(e));
                }

            } catch (e) {
                reject(e);
            }

        });
    },

    /**
     * 
     */
    viewCart: function (fc) {
        return new Promise((resolve, reject) => {

            if (!this.established) {
                reject(new Error(`Life cycle function init is not called`));
                return;
            }
            if (!fc) {
                reject(new Error(`FC cannot be empty`));
                return;
            }

            try {
                var integrationKey = fc.partner.integrationKey;
                var intergrationLayer = require(`./integrations/${integrationKey}/${integrationKey}`);

                if (!intergrationLayer) {
                    reject(new Error(`Could not find Intergration layer , Check if partner integration key is correctly mapped to FC.`));
                }
                else {
                    intergrationLayer.viewCart(this.environment, fc).then(result => resolve(result)).catch(e => reject(e));
                }

            } catch (e) {
                reject(e);
            }

        });
    },

    /**
     * 
     */
    removeFromCart: function (fc) {
        return new Promise((resolve, reject) => {

            if (!this.established) {
                reject(new Error(`Life cycle function init is not called`));
                return;
            }
            if (!fc) {
                reject(new Error(`FC cannot be empty`));
                return;
            }

        });
    },

    /**
     * 
     */
    replaceItemsInCart: function (fc) {
        return new Promise((resolve, reject) => {

            if (!this.established) {
                reject(new Error(`Life cycle function init is not called`));
                return;
            }
            if (!fc) {
                reject(new Error(`FC cannot be empty`));
                return;
            }

        });
    },

    /**
     * 
     */
    checkOut: function (fc) {
        return new Promise((resolve, reject) => {

            if (!this.established) {
                reject(new Error(`Life cycle function init is not called`));
                return;
            }
            if (!fc) {
                reject(new Error(`FC cannot be empty`));
                return;
            }

            try {
                var integrationKey = fc.partner.integrationKey;
                var intergrationLayer = require(`./integrations/${integrationKey}/${integrationKey}`);

                if (!intergrationLayer) {
                    reject(new Error(`Could not find Intergration layer , Check if partner integration key is correctly mapped to FC.`));
                }
                else {
                    intergrationLayer.checkOut(this.environment, fc).then(result => resolve(result)).catch(e => reject(e));
                }

            } catch (e) {
                reject(e);
            }


        });
    },

    /**
     * 
     */
    getOrder: function (fc, orderId) {
        return new Promise((resolve, reject) => {

            if (!this.established) {
                reject(new Error(`Life cycle function init is not called`));
                return;
            }
            if (!fc) {
                reject(new Error(`FC cannot be empty`));
                return;
            }
            if (!orderId) {
                reject(new Error(`Order Id cannot be empty`));
                return;
            }

            try {
                var integrationKey = fc.partner.integrationKey;
                var intergrationLayer = require(`./integrations/${integrationKey}/${integrationKey}`);

                if (!intergrationLayer) {
                    reject(new Error(`Could not find Intergration layer , Check if partner integration key is correctly mapped to FC.`));
                }
                else {
                    intergrationLayer.getOrder(this.environment, orderId).then(result => resolve(result)).catch(e => reject(e));
                }

            } catch (e) {
                reject(e);
            }

        });
    },

    /**
     * 
     */
    cancelOrder: function (fc) {
        return new Promise((resolve, reject) => {

            if (!this.established) {
                reject(new Error(`Life cycle function init is not called`));
                return;
            }
            if (!fc) {
                reject(new Error(`FC cannot be empty`));
                return;
            }

        });
    },

    /**
     * 
     */
    trackOrder: function (fc) {
        return new Promise((resolve, reject) => {

            if (!this.established) {
                reject(new Error(`Life cycle function init is not called`));
                return;
            }
            if (!fc) {
                reject(new Error(`FC cannot be empty`));
                return;
            }

        });
    },

    /**
     * 
     */
    shippmentModes: function (fc) {
        return new Promise((resolve, reject) => {

            if (!this.established) {
                reject(new Error(`Life cycle function init is not called`));
                return;
            }
            if (!fc) {
                reject(new Error(`FC cannot be empty`));
                return;
            }

            try {
                var integrationKey = fc.partner.integrationKey;
                var intergrationLayer = require(`./integrations/${integrationKey}/${integrationKey}`);

                if (!intergrationLayer) {
                    reject(new Error(`Could not find Intergration layer , Check if partner integration key is correctly mapped to FC.`));
                }
                else {
                    intergrationLayer.shippmentModes(this.environment, fc).then(result => resolve(result)).catch(e => reject(e));
                }

            } catch (e) {
                reject(e);
            }

        });
    }
};

module.exports = Fulfillment;