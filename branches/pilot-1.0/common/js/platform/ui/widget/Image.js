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

define("platform/ui/widget/Image", 
	[	"dojo/_base/declare",
	 	"platform/ui/widget/_domWidget",
	 	"dojo/dom-construct",
	 	"dojo/_base/lang",
	 	"dojo/dom-attr"], 
function(declare, domWidget, domConstruct, lang, domAttr){
	return declare( domWidget, {
  		
		constructor : function(options) {
			this._widgetType = 'Image';
			lang.mixin(this, options);
			if(!this.alt){
				this.alt='';
			}
		},
		
/**@memberOf platform.ui.widget.Image */
		build: function() {
			if(this.control) {
				this.domElement = domConstruct.create("img", {
					id: this.getId(),
        			'src': this.src,
        			alt: this.alt,
        			title: this.alt,
        			'class': 'img ' + this.control['cssClass'] + this.control.getDataCss(),
        			style: this.style
        		});
				domAttr.set(this.domElement, 'onerror', 'this.style.opacity="0";');
			}
	    	return this.inherited(arguments);
		}
		
	});
});
