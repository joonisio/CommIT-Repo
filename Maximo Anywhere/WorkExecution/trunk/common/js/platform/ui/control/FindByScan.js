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

define("platform/ui/control/FindByScan", 
		[ "dojo/_base/declare",
		  "platform/ui/control/_ControlBase",
		  "platform/handlers/CodeScannerHandler",
		  "platform/ui/control/Container",
          "platform/translation/MessageService", 
		  "platform/ui/control/Text",
		  "platform/ui/control/Button",
		  "dojo/dom-style",
		  "platform/model/ModelService",
		  "dojo/Deferred",
		  "platform/store/_ResourceMetadataContext",
		  "dojo/_base/lang",
		  "dojox/json/query",
	      "platform/logging/Logger"
		  ],
		  function(declare, ControlBase, CodeScanHandler, Container, MessageService, Text, Button, domStyle, ModelService, Deferred, ResourceMetadataContext, lang, jsonQuery, logger) {
	return declare( [ControlBase], {

		scanResult: null,

		scanFilter : null,

		scanHandler : null,
		
		constructor : function(options) {
			this._controlType = 'findByScan';
		},

/**@memberOf platform.ui.control.FindByScan */
		_ensureScanHandler: function(){
			if (!this.scanHandler){
				if (this.viewControl.actions){
					//See if there is a findByScan action on the view and get the handler class it uses
					//and make that the scanHandler used by this control
					var jsonQueryString = "..[?method='findByScan']";
					var args = [jsonQueryString,this.viewControl.actions.children];
					var findByScanAction = jsonQuery.apply(null, args);
					if (findByScanAction && findByScanAction['class']){
						logger.trace("[FindByScan._ensureScanHandler] found findByScan action on the view and using the assoicated handler: " + findByScanAction['class']);
						this.scanHandler = this.application[findByScanAction['class']];
					}
				}
				if (!this.scanHandler){
					//Still no scan handler so defaul to the CodeScannerHandler
					this.scanHandler = this.application['platform.handlers.CodeScannerHandler'];
					if (!this.scanHandler){
						this.scanHandler = new CodeScanHandler();
						this.application.addHandler({name : 'platform.handlers.CodeScannerHandler', 'class': this.scanHandler});
					}
					logger.trace("[FindByScan._ensureScanHandler] is defaulting handler to CodeScannerHandler.");
				}
			}
		},
		
		build: function(){
			this._ensureScanHandler();
			this.scanHandler.registerScanListener(this);
			var controlId = this.getId();
			this.scanHeader = new Container({
				id: controlId,
				'cssClass': 'scanHeader',
				layout: 'ScanHeader'
			});
			this.scanHeader.setParentReference(this); 
			var resource = this.getResource();
			//See if there is a current scan filter for this resource and querybase
			var metrics = resource.getMetadata().getResourceMetrics(resource.getQueryBase());
			if (metrics){
				this.scanResult = metrics.getScanValues();
			}
			this.headerLabel = 'itemsforscan';
			this.scanHeaderLabel = new Text({
				id: controlId + '_lbl',
				control: this, 
				layoutInsertAt: 'label',
				label: MessageService.createResolvedMessage(this.headerLabel, this.scanHandler.resolveLabelWithScan()),
				'labelClassName': 'scanHeaderLabel',
				editable : false,
			});
			this.scanHeader.addChild(this.scanHeaderLabel);
			var clearlButton = new Button({
				id: controlId + '_btn',
				parentControl : this,
				application : this.application,
				ui : this.ui,
				cssClass : 'cancelScanIcon',
				layoutInsertAt : 'cancel',
				eventHandlers : [ {
					event : 'click',
					method : 'clearScan',
					'class' : 'platform.handlers.CodeScannerHandler'
				} ]
			});
			this.scanHeader.addChild(clearlButton);
			
			this.baseWidget = this.scanHeader.build();
			return this.inherited(arguments);
		},

		hideShowFindByScan: function(){
			//Hides and shows the findbyscan control if there is a scanResult
			if (this.scanResult){
				this.scanHeaderLabel.setLabel(MessageService.createResolvedMessage(this.headerLabel, this.scanHandler.resolveLabelWithScan()));
				domStyle.set(this.baseWidget.domNode, 'display', '');
				return true;
			}
			domStyle.set(this.baseWidget.domNode, 'display', 'none');
			return false;
			
		},
		
		handleScan: function(scanResult){
			var filter = null;
			//Because of RFID, multiple vales can be scanned in so need to account for that
			if (scanResult instanceof Array){
				filter = [];
				var self = this;
				scanResult.forEach(function(filterValue){
					var filterPart = {};
					filterPart[self.resourceAttribute] = filterValue;
					filter.push(filterPart);
				});
				scanResult = scanResult.toString();
			}
			else{
				filter = {};
				filter[this.resourceAttribute] = scanResult;
			}
			
			var resource = this.getResource();
			var resourceName = resource.getResourceName();
			var queryBaseName = resource.getQueryBase();
			var matrixFilterObject = {'filter': lang.clone(filter), 'scanValues' : scanResult};
			
			var self = this;
			logger.trace("[FindByScan.handleScan] is calling ModelService scan on the resource " + resourceName + " with querybase " + queryBaseName + " and this filter: " + JSON.stringify(filter));
			return ModelService.scan(resourceName, queryBaseName, filter).then(function(resultSet){
				if(!resultSet.resourceID){
					resultSet.resourceID = resultSet.name;
				}
				logger.trace("[FindByScan.handleScan] call to ModelService scan returned a set with a record count of: " + resultSet.count());
				self.application.addResource(resultSet);
				var metrics = resource.getMetadata().getResourceMetrics(resource.getQueryBase());
				if (metrics){
					//Store of the values to be retrived when coming back to the view
					metrics.setScanFilter(matrixFilterObject);
				}
				if (resultSet.count() == 1) {
					self.scanResult = null;
					self.scanFilter = null;
					var detailView = self.detailsView;
					if (!detailView) {
						detailView = self.getParent().transitionTo;
					}
					resultSet.setCurrentIndex(0);
					self.ui.show(detailView);

				}else {
					self.scanFilter = matrixFilterObject.filter;
					self.scanResult = scanResult;
					self.getParent().build_scan_list(resultSet);  
				}
			});
		},

		clearScan : function() {
			var self = this;
	    	this.application.showBusy();
	    	var resource = this.getResource();
			var metrics = resource.getMetadata().getResourceMetrics(resource.getQueryBase());
			if (metrics){
				metrics.clearScanFilter();
			}
			this.scanResult=null;
			this.scanFilter=null;
			var list = this.getParent();
			ModelService.allLoadedWithLimitCheck(resource.getResourceName(), resource.getQueryBase()).then(function(dataSet){
				if(!dataSet.resourceID){
					dataSet.resourceID = dataSet.name;
				}
				self.application.addResource(dataSet);
				list.setMyResourceObject(dataSet);
				list.refresh();
				self.application.hideBusy();
			}).otherwise(function(error){
				list.refresh();
				self.application.hideBusy();
			});
		},
		
		destroy : function() {
			this.scanHandler().removeScanListener();
		}

	});
});
