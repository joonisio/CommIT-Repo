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

define("platform/ui/control/Image", 
	   [ "dojo/_base/declare",
	     "platform/ui/control/_ControlBase",
	     "platform/ui/control/_StatefulControlMixin",
	     "platform/ui/widget/Image",
	     "dojox/mvc/getStateful",
	     "dojo/_base/lang",
	     "dojo/_base/array",
	     "dojo/on",
	     "dojo/touch",
	     "dojo/dom-class",
	     "dojo/dom-attr",
	     "dojo/dom-style",
	     "platform/logging/Logger"
	     ],
function(declare, ControlBase, StatefulControlMixin, Image, getStateful, lang, array, on, touch, domClass, domAttr, domStyle, Logger) {
	return declare( [ ControlBase, StatefulControlMixin ], {
		statefulProperties : ['label','image'],
		platform : true,
		alt: '',
		
		constructor : function(options) {
			this._controlType = 'Image';
			this.boundToAttribute = false;
			this.resourceValue = '';
			
		},
    	
/**@memberOf platform.ui.control.Image */
		build: function(){
//			summary:
//				Build the control
//		
//			description:
//				This is where we setup all internals and create any widgets
			
			var imageSrc = this.getImageSrc();

			this.baseWidget = this.createWidget(Image, {
						control: this,
						alt: this.getLabelString(),
						src: imageSrc?imageSrc:'',
						style : this.style
			}).build();
			if(this.boundToAttribute){
				domAttr.set(this.baseWidget.domNode, {
					'data-resourceValue' : this.resourceValue
				});
			}
			
			if (this.boundToAttribute) {
				if(!imageSrc || imageSrc=='') {
					this.setVisibility(false);
				}				
				this.addResourceWatchHandle(this.getCurrentRecord().watch(this.resourceAttribute, lang.hitch(this, function(attrName, oldValue, newValue){
					if(oldValue == newValue){ //no change
						return;
					}
			    	if (!newValue || newValue == ''){
						Logger.trace('IN Image watch: HIDING');
						this.setVisibility(false);
			    	}
			    	else {
			    		//Actually switched the value
			    		//Need to update any styles based on the value change
			    		domClass.remove(this.baseWidget.domNode, oldValue)
			    		domClass.add(this.baseWidget.domNode, newValue);
						Logger.trace('IN Image watch: newValue: ' + newValue);
			    		this.setImage(this.getImageSrc());
						this.setVisibility(true);
			    	}
			    })));
			}
			
			if(this.hasClickEvent()){
				domStyle.set(this.baseWidget.domNode, 'cursor', 'pointer');
			}
			return this.inherited(arguments);
		},
	
		getImageSrc : function(){
			var imageSrc = this.image;
			if(this.resourceAttribute){
				imageSrc = this.getCurrentRecord().get(this.resourceAttribute);
				this.boundToAttribute = true;
			}
			if (this.image && !this.states) {
				var start = this.image.indexOf('{:');
				var end = this.image.indexOf('}', start);
				if(start>=0 && end >=0){
					this.boundToAttribute = true;
					var attribute = this.image.slice(start, end+1);
					this.resourceAttribute = attribute.slice(2, attribute.length-1);
					this.resourceValue = this.getCurrentRecord().get(this.resourceAttribute);
					imageSrc = this.image.replace(attribute, this.resourceValue);
				}
			}
			return this.addImagePath(imageSrc);
		},
		
	    setVisibility : function(vis) {
	    	domAttr.set(this.baseWidget.domNode, 'style', 'visibility:' + ((vis) ? 'visible' : 'hidden') + ';');
	    },

		setImage: function(/*String*/image){
			domAttr.set(this.baseWidget.domNode, {
				'src' : this.addImagePath(image),
				'resourceValue' : this.resourceValue,
				'data-resourceValue' : this.resourceValue
			});
		},
		
		setLabel: function(/*String*/label){
			domAttr.set(this.baseWidget.domNode, 'title', label);
		},
		
		supportsClick: function(){
			return false;
		},
		
		addImagePath: function(image){
			if (!image) {
				return null;
			}
			if (image != '' && image.indexOf('data:image') == -1) {
				if (this.platform!="false") {
					return this.IMAGE_PATH+image;
				} else {
					if (image.indexOf(this.IMAGE_APP_PATH) == -1) {
						return this.IMAGE_APP_PATH+image;
					} else {
						return image;
					}
				}
			}
			return image;
		}
	});
});
