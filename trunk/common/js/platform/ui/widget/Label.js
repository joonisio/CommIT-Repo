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

define("platform/ui/widget/Label", 
	[	"dojo/_base/declare",
	 	"platform/ui/widget/_domWidget",
        "dojo/dom-class",
	 	"dojo/dom-construct",
	     "dojo/dom-attr",
	 	"dojo/_base/lang",
	 	"dojo/query", "dojo/NodeList-dom" ], 
function(declare, domWidget, domClass, domConstruct, domAttr, lang, query){
	return declare( domWidget, {
 		
		domElement: null,
		control: null,
		
		constructor : function(options) {
			this._widgetType = 'Label';
			this.fieldId = '';
			lang.mixin(this, options);
			if(this.control) {
				this.fieldId = this.control.fieldId;
			}
		},
		
/**@memberOf platform.ui.widget.Label */
		build: function() {
			if(this.control) {
				var className = this.control.labelClassName?this.control.labelClassName:'';
				className += this.labelClassName?' '+this.labelClassName:'';
				
				// changed to a </div> so that truncating will work in layouts
				this.domElement = domConstruct.create("div", {
					id : this.getId(),
        			'for' : (this.control.labelFor)?this.control.labelFor:'',
        			'innerHTML': (this.label?this.label:this.control.getLabelString())+(this.control.requiredIndicator==true?'<span class="requiredLabel" style="display:'+(this.required?'inline':'none')+'">&nbsp;*</span>':''),
        			'class': this.control.classPrefix + className,
        			'style' : this.style
        		});
	            if(this.role){
	            	domAttr.set(this.domElement,'role',this.role);
	            }
			}
	    	return this.inherited(arguments);
		},
		
		setReadOnly : function(readOnly){
			if(readOnly){
				domClass.remove(this.domElement,'editableLabel');
				domClass.add(this.domElement,'nonEditableLabel');		
			}
			else{
				domClass.remove(this.domElement,'nonEditableLabel');
				domClass.add(this.domElement,'editableLabel');		
			}
		},
		
		setRequired : function(required){
			query(".requiredLabel", this.domElement).style("display", required?'inline':'none');
            if(required){
            	domClass.add(this.domElement, 'requiredControl');
            }
            else {
                domClass.remove(this.domElement, 'requiredControl');
            }
		},
		
		destroy: function(){
			this.control = null;
			if (this.domElement){
				domConstruct.destroy(this.domElement);
				this.domElement = null;
			}
		}
		
	});
});
