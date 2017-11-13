/*
 * Licensed Materials - Property of IBM
 * "Restricted Materials of IBM"
 *
 * 5725-M39
 *
 * (C) COPYRIGHT IBM CORP. 2015 All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp.
 *
 */

define("platform/handlers/EsigHandler",
		   [ "dojo/_base/declare",
		     "platform/handlers/_ApplicationHandlerBase",
		     "dijit/focus",
		     "platform/warning/PlatformRuntimeWarning",
		     "platform/util/PlatformConstants",
		     "platform/model/ModelService",
		     "platform/translation/SynonymDomain"
	],
	function(declare, ApplicationHandlerBase, dijitFocus, PlatformRuntimeWarning, PlatformConstants, ModelService, SynonymDomain) {

	var callbackContext = null;
	var callbackFunction = null;
	var callbackParameters = null;
	var callbackCancelCtx = null;
	var callbackCancelFunc = null;
	var callbackCancelParams = null;
	var PlatformEsigAttributeResource_loaded = false;
	var PlatformLoginTrackingResource_loaded = false;
	//var esigResource = null; //this variable was changed to class context to avoid miss memory usage and also to execute unit tests since qunit does not manage global variables so well
	var esigAttribute = null;

	return declare( ApplicationHandlerBase, {
		esigResource: null,
		//Initialize Esig Login view
/**@memberOf platform.handlers.EsigHandler */
		initializeEsig: function(eventContext){
			var esigForm = this.application.getResource('PlatformEsigResource').getCurrentRecord();
			var loginForm = this.application.getResource('PlatformLoginResource').getCurrentRecord();
			var username = loginForm.get("username");
			if (username) {
				esigForm.set('userName', username);
			}
			else{
				esigForm.set('userName', null);
			}
			esigForm.set('password', null);
			esigForm.set('reason', null);
			esigForm.set('success', false);		// flag will be used to determine when an esig validation is successful
		},
		
		// check to see if esig is required
		/**
		 * This method will be responsible to verifi if a esignature is required for the attribute resource
		 * @param {eventcontext}EventContext - receive the current context of the application.
		 * @param {platform.store.ResourceMetadata} resource -Resource metadata where the attribute "resourceAttribute" will be verified by e-sig maximo or mobile 
		 * @param {String | Array[String]} resourceAttribute -a string of the attribute name or a Array os attributes name.
		 * 
		 * @return {boolean} Return true if one of the resource attributes specified at resourceAttribute requires esig
		 */
		isEsigRequired: function(eventContext, resource, resourceAttribute){
			
			var isEsigEnabled = eventContext.application.isFeatureEnabled("esig.enabled");
			if (!isEsigEnabled) {
				return false;
			}
			if (!resource || resource.getMetadata().isLocal() === true || (resource.isDirty && !resource.isDirty())){
				return false;
			}
			//Do not enforce for new records, only changed ones to match the Maximo logic.
			if (typeof resource.getCurrentRecord == 'function' && resource.getCurrentRecord() && resource.getCurrentRecord().isNew()) {
				return false;
			}
			
			if(!resourceAttribute){
				resourceAttribute = this._getChangedAttributeAsArrays(resource);
			}
			
			var esigRequired = this._checkComplexAttibutes(eventContext, resource, resourceAttribute);
			if(!esigRequired){
				esigRequired = this._checkSimpleAttibutes(eventContext, resource, resourceAttribute);
			}
			 return esigRequired;
		},
		
		_getChangedAttributeAsArrays: function(viewResource){
	    	var changedAttribute = [];
	    	if(viewResource){
	    		
	    		if(viewResource._changedRecords && Object.keys(viewResource._changedRecords).length > 0){
			    	var changedRecordsKeys = Object.keys(viewResource._changedRecords);
			    	
			    	for (var i=0; i< changedRecordsKeys.length; i++){
			    		var changedRecord = viewResource._changedRecords[changedRecordsKeys[i]];
			    		
			    		var changedRecordAttributesKeys = Object.keys(changedRecord.__changedAttributes);
				    	
				    	for (var j=0; j< changedRecordAttributesKeys.length; j++){
				    		changedAttribute.push(changedRecord.__changedAttributes[changedRecordAttributesKeys[j]]);
				    	}
			    	}
	    		} else {
	    			var changedRecordAttributesKeys = [];
	    			var resource = null;
	    			if(viewResource._changedRecords){
		    			if (viewResource.getCurrentRecord()._isNew){
		    				resource = viewResource.getCurrentRecord();
		    				changedRecordAttributesKeys = Object.keys(resource.__changedAttributes);
		    			} else {
		    				resource = viewResource._changedRecords;
		    				if(!resource.__changedAttributes){
		    					return changedAttribute;
		    				}
		    				changedRecordAttributesKeys = Object.keys(resource.__changedAttributes);
		    			}
		    			
				    	
				    	for (var j=0; j< changedRecordAttributesKeys.length; j++){
				    		changedAttribute.push(resource.__changedAttributes[changedRecordAttributesKeys[j]]);
				    	}
	    			} else {
		    			var changedRecordAttributesKeys = Object.keys(viewResource.__changedAttributes);
				    	
				    	for (var j=0; j< changedRecordAttributesKeys.length; j++){
				    		changedAttribute.push(viewResource.__changedAttributes[changedRecordAttributesKeys[j]]);
				    	}
		    		}
	    		}
	    	}
	    	return changedAttribute;
	    },
	    
		_checkComplexAttibutes: function(eventContext, resource, resourceAttribute){
			
			if( typeof resourceAttribute === 'string' ){
				return false;
			}
	    	for (var i = 0; i < resourceAttribute.length; i++){
	    		var esigAttribute = resourceAttribute[i];
	    		if (resource.isFieldComplex(esigAttribute)){
	    			var curRec = resource.getCurrentRecord();


	    			var complexChange = curRec.getLoadedModelDataSetOrNull(esigAttribute);
	    			
	    			if(!complexChange || typeof complexChange !== "object"){
	    				break;
	    			}
	    			
	    			var complexChangeAttributes =   this._getChangedAttributeAsArrays(complexChange.getCurrentRecord());



	    	    	if (complexChangeAttributes.length > 0 && this._checkSimpleAttibutes(this, complexChange, complexChangeAttributes)){
	    	    		return true;
		    			
	    	    	}

	    		}
	    	}
	    	return false;
		},
		_checkSimpleAttibutes: function(eventContext, resource, resourceAttribute){
			this.esigResource = resource;
//			esigAttribute = resourceAttribute;
			
			// make sure resources are present
			this._loadRequiredResources();
			if( typeof resourceAttribute === 'string' ){
				esigAttribute = resourceAttribute;
				
				// check to see if _esigEnabled = true in the attribute's meta data
				var attrData = resource.getMetadata().getField(resourceAttribute);
				if (attrData._esigEnabled == true ||  (attrData.esig == true || attrData.esig == "true")){
					return true;
				}
	
				// if not in meta data already, check the esigAttribute resource (and update meta data)
				var esigAttrs = this.application.getResource('PlatformEsigAttributeResource');
				if (esigAttrs == null){
					return false;
				}
				var attrName = resourceAttribute.toUpperCase();
				//comment to roll back for defect 207968
				/*var attrOriginalName = attrName;
				if(attrData && attrData.remoteName){
					attrOriginalName = attrData.remoteName.toUpperCase().slice(attrData.remoteName.indexOf(':')+1,attrData.remoteName.lenght);
				}*/
				var objName = resource.getMetadata().name.toUpperCase();
				for(var i = 0; i < esigAttrs.data.length; i++){
					//console.log(i + ':  esigAttribute = ' + esigAttrs.data[i].get('objectname') + '.' + esigAttrs.data[i].get('attributename') + ', esigenabled=' + esigAttrs.data[i].get('esigenabled'));
					if (esigAttrs.data[i].get('objectname') == objName && esigAttrs.data[i].get('attributename') == attrName){
					/*if (esigAttrs.data[i].get('objectname') == objName 
							&& (esigAttrs.data[j].get('attributename') == attrName || esigAttrs.data[j].get('attributename') == attrOriginalName)){*/
						// if it's found, esig is enabled... resource only has attributes where esigenabled = true
						attrData._esigEnabled = true;
						return true;
					}
				}
				return false;
			} else {
				for (var i =0; resourceAttribute.length > i; i++){
					esigAttribute = resourceAttribute[i];
					
					// check to see if _esigEnabled = true in the attribute's meta data
					var attrData = resource.getMetadata().getField(resourceAttribute[i]);
					if (attrData._esigEnabled == true ||  (attrData.esig == true || attrData.esig == "true")){
						return true;
					}
		
					// if not in meta data already, check the esigAttribute resource (and update meta data)
					var esigAttrs = this.application.getResource('PlatformEsigAttributeResource');
					if (esigAttrs == null){
						return false;
					}
					var attrName = resourceAttribute[i].toUpperCase();
					//comment to roll back for defect 207968
					/*var attrOriginalName = attrName;
					if(attrData && attrData.remoteName){
						attrOriginalName = attrData.remoteName.toUpperCase().slice(attrData.remoteName.indexOf(':')+1,attrData.remoteName.lenght);
					}*/
					var objName = resource.getMetadata().name.toUpperCase();
					for(var j = 0; j < esigAttrs.data.length; j++){
						//console.log(i + ':  esigAttribute = ' + esigAttrs.data[i].get('objectname') + '.' + esigAttrs.data[i].get('attributename') + ', esigenabled=' + esigAttrs.data[i].get('esigenabled'));
						if (esigAttrs.data[j].get('objectname') == objName && esigAttrs.data[j].get('attributename') == attrName){
						/*if (esigAttrs.data[j].get('objectname') == objName 
								&& (esigAttrs.data[j].get('attributename') == attrName || esigAttrs.data[j].get('attributename') == attrOriginalName)){*/
							// if it's found, esig is enabled... resource only has attributes where esigenabled = true
							attrData._esigEnabled = true;
							return true;
						}
					}
					
				}
				return false;
			}
		},
		
		// show the esig view and set the callback function and it's parameters - to be called on submit
		// callback function parameters are an array or arguments
		showEsig: function(eventContext, callback, callbackParams){
			callbackContext = eventContext;
			callbackFunction = callback;
			callbackParameters = callbackParams;
			if(!this.application.getResource('PlatformLoginTrackingResource')){
				this.application.createResource(null, null, 'PlatformLoginTrackingResource', null, null)
				.then(function(){
					eventContext.ui.show("Platform.EsigLoginView");
				})
				.otherwise(function(error){
					console.log("could not load PlatformLoginTrackingResource");
					console.log(JSON.stringify(error));
				});
				}else{
					eventContext.ui.show("Platform.EsigLoginView");
				}
			
			
		},

		// cancel esig login
		cancelEsig: function(eventContext){	
			eventContext.ui.hideCurrentDialog();
			if (typeof callbackCancelFunc === "function"){
				callbackCancelFunc.apply(callbackCancelCtx, callbackCancelParams);
			}
			this._cleanup();
		},

		// submit esig login
		submitEsig: function(eventContext){
			eventContext.focus(); //Android 2.3 devices need special handling to set focus when button tapped
			var esigForm = this.application.getResource('PlatformEsigResource').getCurrentRecord();
			
			// if validation passes, execute callback (if it's a function)
			if (this.validateEsig(eventContext, esigForm)){
				eventContext.ui.hideCurrentDialog();
				if (typeof callbackFunction === "function"){
					callbackFunction.apply(callbackContext, callbackParameters);
					this._cleanup();
				}
			}
		},

		// sync validateEsig - check password against login credentials and check reason is not empty
		validateEsig: function(eventContext, esigForm){
			var loginForm = this.application.getResource('PlatformLoginResource').getCurrentRecord();
			var success = false;
			esigForm.set('success', success);

			// check password
			var esigPwd = esigForm.get('password');
			var loginPwd = loginForm.get('password');
			if (esigPwd != loginPwd){
				// log the failed esig attempt
				this._logEsigAttempt(eventContext, esigForm);
				throw new PlatformRuntimeWarning('invalidPassword'); 
			}

			// check reason
			var reason = esigForm.get('reason');
			if (!reason || reason == '' || reason.trim() == ''){
				throw new PlatformRuntimeWarning('emptyReasonForChange'); 
			}

			// validation passed
			success = true;
			esigForm.set('success', success);

			// log the successful esig attempt
			this._logEsigAttempt(eventContext, esigForm);
			
			return success;
		},
		
		_cleanup: function() {
			// clear callback function and parameter
			callbackContext = null;
			callbackFunction = null;
			callbackParameters = null;
			callbackCancelCtx = null;
			callbackCancelFunc = null;
			callbackCancelParams = null;
			this.esigResource = null;
			esigAttribute = null;
		},
		
		// the resources must be manually loaded in order to be used (they're in localStorage but are not in the app and are not required by the apps)
		_loadRequiredResources: function(eventContext){
			if (PlatformEsigAttributeResource_loaded == false 
					|| this.application.getResource('PlatformEsigAttributeResource') == null){
				this.application.createResource(null, null, 'PlatformEsigAttributeResource', null, null)
					.then(function(){
						PlatformEsigAttributeResource_loaded = true;
					})
					.otherwise(function(error){
						console.log("could not load PlatformEsigAttributeResource");
						console.log(JSON.stringify(error));
					});
			}
			if (PlatformLoginTrackingResource_loaded == false 
					|| this.application.getResource('PlatformLoginTrackingResource') == null){
				this.application.createResource(null, null, 'PlatformLoginTrackingResource', null, null)
					.then(function(){
						PlatformLoginTrackingResource_loaded = true;
					})
					.otherwise(function(error){
						console.log("could not load PlatformLoginTrackingResource");
						console.log(JSON.stringify(error));
					});
			}
		},
		
		_logEsigAttempt: function(eventContext, esigForm){
			var loginTrackingResource = this.application.getResource('PlatformLoginTrackingResource');
			var rec = loginTrackingResource.createNewRecord();

			rec.openPriorityChangeTransaction();
			rec.setDateValue('attemptdate', this.application.getCurrentDateTime());
			var attemptResultDomain = this.application.getResource('attemptResultDomain');
			var attemptResult = (esigForm.get('success') ? 'SUCCESS': 'FAILED');
			var externalAttemptResult = SynonymDomain.resolveToDefaultExternal(attemptResultDomain, attemptResult);
			rec.set("attemptresult", externalAttemptResult);
			rec.set("app", "MAXANYWH");
			rec.set("reason", esigForm.get('reason'));
			rec.set("userid", esigForm.get('userName'));
			rec.set("loginid", esigForm.get('userName'));	// username
			if (this.esigResource){
				// keyvalue1 is siteid
				var site = this.esigResource.get('siteid');
				if(!site){
					site = this.esigResource.getCurrentRecord().get('siteid'); 
				}
				rec.set("keyvalue1", site);
				// owner table is resource name
				rec.set("ownertable", this.esigResource.getMetadata().name.toUpperCase());	
				
				var identifier = this.esigResource.getMetadata().getFieldForRemoteName('oslc:shortTitle');
				if (!identifier || !identifier.name){
					identifier = this.esigResource.getMetadata().getFieldForRemoteName('dcterms:identifier');
				}
				if (identifier && identifier.name){
					recordId = (this.esigResource.getCurrentRecord().json?this.esigResource.getCurrentRecord().json[identifier.name]:this.esigResource.getCurrentRecord().get(identifier.name));
				}
				if (!recordId || !(typeof recordId == "string") || recordId.length == 0){
					//recordId = (rec.getId?rec.getId():rec._id);
					rec.setNullValue("keyvalue2");
				} else {
					rec.set("keyvalue2", recordId);
				}
			}
			
			
			/*if (esigAttribute){
				// keyvalue2 is the field with esig enabled
				rec.set("keyvalue2", esigAttribute.toUpperCase());
			}*/
			
			WL.Device.getNetworkInfo(function (networkInfo) {
				// networkinfo is not obtained for simulator
				rec.set("clienthost", networkInfo.ipAddress); // clienthost is not available from networkinfo
				rec.set("clientaddr", networkInfo.ipAddress);
				
				// close transaction and save record
				rec.closePriorityChangeTransaction();
				ModelService.save(rec.getOwner())
					.otherwise(function(error) { 
						console.log(JSON.stringify(error));
				});			
			});
		},
		
		plugCancelCallback: function(context, callback, params) {
			callbackCancelCtx = context;
			callbackCancelFunc = callback;
			callbackCancelParams = params;
		}

	});
});
