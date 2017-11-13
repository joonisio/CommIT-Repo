/*
 * Licensed Materials - Property of IBM
 * "Restricted Materials of IBM"
 *
 * 5725-M39
 *
 * (C) COPYRIGHT IBM CORP. 2013 All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp. 
 *
 */

define("platform/store/_FormulaEvaluator",
["dojo/_base/array",
 "platform/logging/Logger"], 
function(arrayUtil, Logger){
	return {
/**@memberOf platform.store._FormulaEvaluator */
		evaluateFormula: function(metadata, targetObj) {
			arrayUtil.forEach(metadata.formulaFields, function(formulaField) {
				try {
					formulaField.formula.apply(targetObj);
				} catch (e) {
					var WARN = 1;
					Logger.log("Failed to apply formula of attribute " + 
							formulaField.name + 
							" of resource " + metadata.name + 
							" in record " + JSON.stringify(targetObj) + 
							". Reason: " + e.message,
							WARN);
				}
			});
		}
	};
});
