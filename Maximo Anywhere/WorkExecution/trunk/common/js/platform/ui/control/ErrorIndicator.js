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

define("platform/ui/control/ErrorIndicator",
	   [ "dojo/_base/declare",
	     "dojo/_base/lang",
	     "dojo/on",
	     "dojo/touch",
	     "dojo/dom-class",
	     "platform/translation/MessageService",
	     "platform/util/PlatformConstants",
	     "platform/ui/control/Text",
	     "platform/ui/control/Container",
	     "platform/ui/control/Link" ],
 function(declare, lang, on, touch, domClass, MessageService, PlatformConstants, Text, Container, Link) {
		return declare( [ Text ], {
	    	editable: false,
	    	hasLookup: false,
	    	collapsed: true,
	    	links: null,
	    	clear: null,
	    	retry: null,
	    	
	    	
		constructor : function(options) {
			this.resourceAttribute = '_errorMessage';
			this['class'] = (options && options['class']) ? this['class'] : 'platform.handlers.WorkOfflineHandler';
			this['clearMethod'] = (options && options['clearMethod']) ? this['clearMethod'] : 'confirmClearChanges';
			this['retryMethod'] = (options && options['retryMethod']) ? this['retryMethod'] : 'retryMyChanges';
		},

/**@memberOf platform.ui.control.ErrorIndicator */
		build: function() {
			// the error indicator is now used to show an error
			var self = this;
			this.baseClass = 'errorIndicator';
			this.inherited(arguments);
			this.setDisplay(false);
			var resource = this.getResource();
			var watchHandle;
			if(resource){
				currentRecord = resource.getCurrentRecord();
				// watch for _errored changes
				if (currentRecord){
					watchHandle = currentRecord.watch(PlatformConstants.ERRORED_ATTRIBUTE, lang.hitch(this, function(fieldName, oldValue, newValue){
						if (newValue != oldValue){
		    				this.setDisplay(this._setErrorIcons());
						}
	    			}));
					this.addResourceWatchHandle(watchHandle);
				}				
				this.links = new Container({
					id: this.getId(),
					cssClass : 'errorLinks'
				});
				this.clear = new Link({
					id: this.getId() + '_clear',
					label: MessageService.createStaticMessage('ClearChanges').getMessage(),
		            eventHandlers: [{
		            	'event' : 'click',
		                'class' : self['class'],
		                'method' : self['clearMethod'],
		            }],
		            labelClassName: 'fixErrorLink'
				});
				this.links.addChild(this.clear);
				this.retry = new Link({
					id: this.getId() + '_retry',
					label: MessageService.createStaticMessage('Resend').getMessage(),
		            eventHandlers: [{ 
		            	'event' : 'click',
		            	'class' : self['class'],
		                'method' : self['retryMethod'],
		            }],
		            labelClassName: 'fixErrorLink'
				});
				this.links.addChild(this.retry);

			    this.links.setParentReference(this);
			    var builtItem = this.links.build();
			    if (builtItem) {
			    	this.baseWidget.addChild(builtItem);
			    }
	
			}
			return this.baseWidget;
		},
		
	    render : function() {
		    this.inherited(arguments);
		    this.setDisplay(this._setErrorIcons(false));
	    },
	    
	    // sets the error icons.  error if there's an error
	    // returns true if record is errored
	    _setErrorIcons : function() {
	    	var hasError = false;
	    	var res = this.getResource();
		    if(res){
		    	var rec = res.getCurrentRecord();
		    	if(rec && this.baseWidget){
		    		// if there's an error, the error icon gets highest priority
		    		if(this.links){
		    			domClass[rec.isErrored()?'remove':'add'](this.links.baseWidget.domNode, 'lockedErrorLinks');
		    		}
		    		
		    		if (rec.isErrored()){
		    			hasError = true;
						domClass.add(this.baseWidget.domNode, 'eiError');		    			
		    		}
		    		else {
	    				domClass.remove(this.baseWidget.domNode, 'eiError');
	    			}
		    	}
		    }
	    
		    return hasError;
	    },
	    
	    destroy: function(){
            this.inherited(arguments);
	    	this.links.destroy();
	    	this.links.parentControl = null;
	    	this.links = null;
	    	this.clear.destroy();
	    	this.clear = null;
	    	this.retry.destroy();
	    	this.retry = null;

	    }
	});
});
