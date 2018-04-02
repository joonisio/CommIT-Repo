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
define("platform/ui/control/DirectionsLink",
		[ "dojo/_base/declare",
   	      "dojo/_base/lang",
	      "dojo/dom-class",
		  "platform/ui/control/Link"
], function(declare, lang, domClass, Link) {
	return declare(Link,{
			
			constructor : function(options) {
				this.resource = 'PlatformMapMarkerInfo';
	    		this.requiredResources[this.resource] = {};
	    		this._controlType = 'directionslink';
	    		this.transitionTo= 'platform.DirectionsView';
	    		this.resourceAttribute= 'endMarker';
			},
			
/**@memberOf platform.ui.control.DirectionsLink */
			build : function() {
				var baseWidget = this.inherited(arguments);
				var endMarker = this.getCurrentRecord().get(this.resourceAttribute);
				this.setVisibility(endMarker && endMarker != '');
				this.addResourceWatchHandle(this.getCurrentRecord().watch(this.resourceAttribute, lang.hitch(this, function(attrName, oldValue, newValue){
					this.setVisibility(newValue && newValue != '');
			    })));
				
				domClass.add(baseWidget.domNode, 'mapdirections');
				return baseWidget;
			}
	});
});
