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

define("platform/ui/widget/SimpleDialog", 
		["dojo/_base/declare",
		 "dojox/mobile/SimpleDialog",
		 "dojo/on",
	     "dojo/touch",
	     "dojo/_base/lang"
		 ], 
function(declare, SimpleDialog, on, touch, lang) {

	return declare(SimpleDialog, {
/**@memberOf platform.ui.widget.SimpleDialog */
		_onKeyDown: function(e){ //override so escape key will work on a browser
			if(e.keyCode == 27){ // ESC
				this.parentControl.ui.hideCurrentDialog();
			}
		},
		
		addCover: function(){
			this.inherited(arguments);
	    	if(this.parentControl.closeOnBackgroundClick=='true'){
	    		this.parentControl.addHandler(on(this._cover[0], touch.press, lang.hitch(this.parentControl, function(){
    		    	this.ui.hideCurrentDialog();
    		    })));
	    	}
		},
		
		hide: function(){
			this.inherited(arguments);
			if(this.modal){
				var cover = this._cover[0];
				if(cover){
					cover.parentNode.removeChild(cover);
					delete this._cover[0];
				}
			}
		}
	});
});
