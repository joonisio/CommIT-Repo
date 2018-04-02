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

/**
 * 
 */
define("platform/ui/control/MapMarker",
		[ "dojo/_base/declare",
		  "platform/ui/control/Image"
], function(declare, Image) {
	return declare(Image,{
		/**@memberOf platform.ui.control.MapMarker */
			constructor : function(options) {
				this.resource = 'PlatformMapMarkerInfo';
				this.resourceAttribute = 'currentMarker';
	    		this.requiredResources[this.resource] = {};
				this._controlType = 'MapMarker';
			}

	});
});
