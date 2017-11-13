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

define("platform/ui/control/ProgressIndicator",
	   [ "dojo/_base/declare",
	     "dojo/_base/lang",
	     "dojox/mobile/Button",
	     "dojo/on",
	     "dojo/touch",
	     "dojo/dom-style",
	     "platform/ui/control/Text",
	     "platform/translation/MessageService",
	     "platform/handlers/WorkOfflineHandler",
	     "dojox/gesture/tap"
	     ],
 function(declare, lang, Button, on, touch, domStyle, Text, MessageService, WorkOfflineHandler, tap) {
		return declare( [ Text ], {
	    	editable: false,
	    	hasLookup: false,
	    	_cancelButton: null,

			constructor : function(options) {
				this.resource = 'PlatformProgressResource';
			this.resourceAttribute = 'progressMsg';						
		},

/**@memberOf platform.ui.control.ProgressIndicator */
		build: function() {
			var self = this;
			this.baseClass = 'progressindicator';			
			this.inherited(arguments);
			this.cancellabel = MessageService.createStaticMessage('cancelbutton').getMessage();
			
			this._cancelButton = this.createWidget(Button, {
				label : this.cancellabel				
			});
			this.addHandler(on(this._cancelButton, tap, lang.hitch(this, function(){
				this.application['platform.handlers.WorkOfflineHandler'].showCancelDownloadConfirmation(this);
			}))); 

			this.baseWidget.addChild(this._cancelButton);
			if (!this.application['platform.handlers.WorkOfflineHandler']){
				var handler = new WorkOfflineHandler();
				this.application.addHandler( {name : 'platform.handlers.WorkOfflineHandler', 'class': handler} );
			}
				
			var workOrdersLabel = MessageService.createStaticMessage('primaryResourcePluralLabel').getMessage();
			this.application['platform.handlers.WorkOfflineHandler'].workOrdersLabel = workOrdersLabel;
			
			this.progressResource = this.application.getResource('PlatformProgressResource').getRecordAt(0);
			this.application['platform.handlers.WorkOfflineHandler'].progressResource = this.progressResource;

			self._showHideWidget(this.progressResource.get('started'));
			
			this.addResourceWatchHandle(this.progressResource.watch('started', lang.hitch(this, function(fieldName, oldValue, newValue){
				if (oldValue != newValue){
					self._showHideWidget(newValue);
				}
			})));
			return this.baseWidget;
		},

		_showHideWidget: function(show){
			this.setDisplay(show);
			var showCancel = (show && this.application['platform.handlers.WorkOfflineHandler'].showCancelButton);				
			domStyle.set(this._cancelButton.domNode, 'display', ((showCancel) ? 'inline' : 'none'));
		},
		
        destroy: function () {
            this.inherited(arguments);
            this._cancelButton = null;
        }

	});
});
