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

define("platform/ui/layout/LayoutUtil",
		[
		 "dojo/_base/declare",
		 "generated/application/ui/layout/LayoutConfig",
		 "platform/ui/util/OrientationManager",
		 "dojo/_base/window",
		 "dojo/dom-construct",
		 "dojo/dom-attr",
		 "dojo/dom-geometry"
], function(declare, LayoutConfig, OrientationManager, window, domConstruct, domAttr, domGeometry) {

	return declare("platform.ui.layout.LayoutUtil", [], {

		constructor : function(options) {
			this.application = null;
			if(options && options.application){
				this.application = options.application;
			}
		},
		
/**@memberOf platform.ui.layout.LayoutUtil */
		calculateLayoutScreenSize: function(element) {
			return this._calculateLayoutScreenSize(this.getPhysicalWidth(element), element);
		},
		
		getPhysicalWidth: function(element){
			return this.getPhysicalSize(element).width;
		},
		
		getPhysicalHeight: function(element){
			return this.getPhysicalSize(element).height;
		},
		
		getPhysicalSize: function(element){
			// this will give pixels per inch
			var ppi = this.calculatePixelsPerInch();
			
			var viewport;
			if(element){
				viewport = domGeometry.position(element);
			}
			else {
				viewport = dojo.window.getBox();
			}
			
			var width = (viewport.w / ppi).toFixed(2);
			var height = (viewport.h / ppi).toFixed(2);
			domAttr.set(window.body(), {
		    	'data-width' : width,
		    	'data-height' : height
		    });
			if(!element){ //screen
				var sizeRecord = this.getResourceRecord();
				if(sizeRecord){
					sizeRecord.set('width', width+'"');
					sizeRecord.set('height', height+'"');
				}
			}
			// we need to do this if the user started the app in portrait or landscape
			//if element, then we are calculating based on item at runtime and the current width is what matters, regardless of rotation
			return {'width':width, 'height' :height};
		},
		
		getResourceRecord: function(){
			if(this.application){
				var resource = this.application.getResource('DeviceSizeResource');
				if(resource){
					return resource.getCurrentRecord();
				}
			}
			return null;
		},
		
		calculatePixelsPerInch: function() {
			var div = domConstruct.create("div", {id: "div_screensize"}, window.body(), "first");
			
			// give it an absolute size of one inch
			div.style.width="1in";

			var ppi = parseFloat(dojo.doc.defaultView.getComputedStyle(div, null).getPropertyValue('width'));
			
			// clean up
			domConstruct.destroy("div_screensize");
			
	    	domAttr.set(window.body(), {
		    	'data-ppi' : ppi,
		    });
	    	var sizeRecord = this.getResourceRecord();
			if(sizeRecord){
				sizeRecord.set('ppi', ppi);
			}
				
			return ppi;
		},

		isPortrait: function() {
		   var portrait = OrientationManager.isPortrait();
			var sizeRecord = this.getResourceRecord();
			if(sizeRecord){
				sizeRecord.set('orientation', portrait ? "portrait" : "landscape");
			}
			return portrait;
		},
		
		getOrientation : function() {
			return (this.isPortrait() ? "portrait" : "landscape");
		},
		
		_calculateLayoutScreenSize: function(physicalWidth, element) {
			var layoutConfigs = LayoutConfig.getLayoutConfigs();
			var size = 'small';
			for (i in layoutConfigs) {
				var config = layoutConfigs[i];
				if (physicalWidth >= config[LayoutConfig.FLD_MIN_WIDTH()]) {
					size = config[LayoutConfig.FLD_LAYOUT_SIZE()];;
					if(!element){
						var sizeRecord = this.getResourceRecord();
						if(sizeRecord){
							sizeRecord.set('layoutSize', size);
						}
					}
				}
			}
			return size;
		}
	});
});
