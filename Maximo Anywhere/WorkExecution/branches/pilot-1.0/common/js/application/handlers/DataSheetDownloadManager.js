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

define("application/handlers/DataSheetDownloadManager",
["exports",
 "dojo/_base/lang",
 "dojo/Deferred",
 "platform/logging/Logger",
 "platform/store/SystemProperties",
 "platform/comm/_ConnectivityChecker",
 "platform/model/ResourceDownloadManager",
 "platform/store/_ResourceMetadataContext"], 
function(thisModule, lang, Deferred, Logger, SystemProperties, ConnectivityChecker, ResourceDownloadManager, ResourceMetadataContext) {

	var ttDownloadAllDataForWorklistResourceAndQueryBase = new TrackTime("DataSheetDownloadManager", "downloadDataSheet", "Data Sheet download", false);

	var classBody = lang.mixin(thisModule, {

/**@memberOf application.handlers.DataSheetDownloadManager */
		_initClassIfNeeded: function() {
			if (!this.init && ResourceDownloadManager.init){
				lang.mixin(this, ResourceDownloadManager);
				this.init();
			}
		},

		downloadResource: function(resourceName, queryBase){
			this._initClassIfNeeded();

			var self = this;

			ttDownloadAllDataForWorklistResourceAndQueryBase.startTracking();

			this._overallProcessing = new Deferred();

			var resourceMetadata = ResourceMetadataContext.getResourceMetadata(resourceName);

			this.needRecordLevelProgressInfo = true;			

			this.resourcesCount = 1;
			this.resourcesQueryBaseCount[resourceMetadata.name] = 1;
			this.sendRequestForAllResourceData(resourceMetadata, queryBase);
			this._overallProcessing.promise.
			always(function(){
				resourceMetadata.setWhereClause(null);
				ttDownloadAllDataForWorklistResourceAndQueryBase.stopTracking();
				self.cleanUp();
			});

			return this.progressInfo;
		},

		downloadDataSheet: function() {
			return this.downloadResource('dataSheetResourceMax', 'getWODataSheet');
		},

		downloadDataSheetConfig: function() {
			return this.downloadResource('transactiondatasheetconfig', 'getdatasheetconfig');
		},

		downloadDataSheetAssetLink: function() {
			return this.downloadResource('additionaldatasheetassetlink', 'getdatasheetassetlink');
		},

		downloadDataSheetTemplate: function() {
			return this.downloadResource('dataSheetTemplateResource', 'getWODataSheetTemplate');
		},

	}, ResourceDownloadManager);

	//For some wonky reason sometimes UTs load this class before ResourceDownloadManager.
	//In such cases method init didn't get added so defer the init to call when needed
	if (classBody.init){
		classBody.init();
	}

});
