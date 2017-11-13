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

define("platform/ui/util/OrientationEventListenerMixin",
      [
       "dojo/_base/declare",
       ],
function(declare) {

	return declare("platform.ui.util.OrientationEventListenerMixin", [], {
		
/**@memberOf platform.ui.util.OrientationEventListenerMixin */
		onOrientationChanged : function(newOrientation) {
			// subclasses are to implement this to handle specific orientation changes
		}
	});
});
