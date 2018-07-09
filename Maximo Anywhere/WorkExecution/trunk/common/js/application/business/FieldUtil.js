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

define("application/business/FieldUtil", [], function() {
	return {
		
		/*
		 * Initializes a composite field to the value of a record number and its description.
		 * Example: "ASSETNUM-Asset description"
		 */
/**@memberOf application.business.FieldUtil */
		initCompositeField : function(recordFieldName, descFieldName, compositeFieldName, dataObject) {
			
			var recordNum=dataObject.get(recordFieldName);
			var recordNumdesc=dataObject.get(descFieldName);
			
			// Possible to have a recordnum and no description as well as description and no recordnum (ex Items with linetype=material)
			if(recordNum&&recordNumdesc)			{
				dataObject.set(compositeFieldName, [recordNum, recordNumdesc].join("-"));
			}
			else if(recordNum){
				dataObject.set(compositeFieldName, recordNum);
			}
			else if(recordNumdesc){
				dataObject.set(compositeFieldName, recordNumdesc);
			}
			else if(!recordNum && !recordNumdesc){
				dataObject.set(compositeFieldName, null);
			}
		}
	}
});
