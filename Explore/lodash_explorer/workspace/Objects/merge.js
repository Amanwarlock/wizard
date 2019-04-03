var _ = require("lodash");


/**
 * @description - This merges source object to destination object;
 *  Source field if undefined are skipped if destination value exists;
 *  source objects are applied from left to right;
 */

 /**
  * @example - 
    var object = {
        'a': [{ 'b': 2 }, { 'd': 4 }]
    };
 
    var other = {
        'a': [{ 'c': 3 }, { 'e': 5 }]
    };
 
	_.merge(object, other);
	// => { 'a': [{ 'b': 2, 'c': 3 }, { 'd': 4, 'e': 5 }] }
  */
//--------------------------------------------------------------------------------------------------------------------------
/* Main Development stage */
 function merge_test(_source , _destination){

  }


//--------------------------------------------------------------------------------------------------------------------------
  /* Testing Stage */

//--------------------------------------------------------------------------------------------------------------------------

  /* INPUTS - OUTPUTS */

//--------------------------------------------------------------------------------------------------------------------------

  /* SCENARIOS */