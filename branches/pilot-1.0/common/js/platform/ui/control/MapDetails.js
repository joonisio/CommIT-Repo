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
define("platform/ui/control/MapDetails",
		[ "dojo/_base/declare",
		  "platform/ui/control/Container",
		  "dijit/layout/ContentPane",
		  "dojo/_base/lang",
		  "dojo/dom-attr",
		  "dojo/dom-style",
          "platform/translation/MessageService" 
		  ],function(declare, Container, ContentPane, lang, domAttr, domStyle, MessageService) {
	return declare(Container, {

			constructor : function(options) {
				this._controlType = 'MapDetails';
			},

/**@memberOf platform.ui.control.MapDetails */
			build : function() {
				var containerWidget = this.inherited(arguments);
				domStyle.set(containerWidget.domNode, 'display', 'none');
                containerWidget.domNode.setAttribute('mapDetails', 'true');
				var self = this;
				var platformMapMarkerInfo = this.application.getResource('PlatformMapMarkerInfo').getCurrentRecord();
				this.addResourceWatchHandle(platformMapMarkerInfo.watch('currentMarker', lang.hitch(this, function(attrName, oldValue, newValue){
					var mapHandler = self.application['platform.handlers.MapHandler'];
					if (mapHandler && mapHandler.mapControl && mapHandler.mapControl.mapShown) {
						domStyle.set(containerWidget.domNode, 'display', '');
				    	if (!newValue || newValue == ''){
							domAttr.set(containerWidget.domNode, "innerHTML", '<p class="mapDetailsNoMarkers">'+ MessageService.createStaticMessage('noCoordinates').getMessage()+'</p>');						
				    	}
					}
			    })));
				return containerWidget;
			}
		});
});
