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

define("application/business/ClassStructureObject", 
		["application/business/FieldUtil"], function(fieldUtil) {
	return {
/**@memberOf application.business.ClassStructureObject */
		onInitialize : function(classtructure) {
			this._updateDesc(classtructure);
		},
	
		onAdd : function(classtructure) {
			this._updateDesc(classtructure);
		},
		
		_updateDesc : function (classtructure) {
			var fulldesc = classtructure.get('classificationid');
			// should probably use classsificationdesc, but having oslc problems with that
			var classdesc = classtructure.get('description');
			if (classdesc != null) {
				fulldesc = fulldesc + " : " + classdesc;			
			}
			classtructure.set('fulldesc', fulldesc);
		}		
		 
	};
});
