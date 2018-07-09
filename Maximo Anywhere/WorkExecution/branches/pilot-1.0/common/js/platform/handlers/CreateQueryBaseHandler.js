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

define("platform/handlers/CreateQueryBaseHandler", 
      [ "dojo/_base/declare",
        "platform/handlers/_ApplicationHandlerBase",
        "platform/model/ModelService", 
        "platform/model/ModelData",
        "platform/model/ModelDataSet",
        "platform/logging/Logger",
        "platform/util/PlatformConstants"],
        function(declare, ApplicationHandlerBase, ModelService, ModelData, ModelDataSet, Logger, PlatformConstants) {
   return declare( ApplicationHandlerBase, {
      name: 'CreateQueryBaseHandler',

/**@memberOf platform.handlers.CreateQueryBaseHandler */
      renderRemoveRecordFromList : function(eventContext) {
         Logger.log(eventContext.getCurrentRecord());
         var shouldDisplay = false;
         if (PlatformConstants.CREATED_QUERYBASE == eventContext.getResource()._queryBaseName) {
            /*
             * (isModified() == false) means it HAS been sent to the server
             */
            var createdRecord = eventContext.getCurrentRecord();
            shouldDisplay = (createdRecord.wasCommittedToServer() && (!createdRecord[PlatformConstants.ORIGINAL_STATE_ATTRIBUTE] || createdRecord[PlatformConstants.ORIGINAL_STATE_ATTRIBUTE]=='null'));
         }
         eventContext.setDisplay(shouldDisplay);
      },

      yesRemoveRecordFromList : function(eventContext) {
         var currentRecord = eventContext.application.getResource(this.getResourceName()).getCurrentRecord();
         currentRecord.removeFromCreatedList();
         var ui = this.ui;
         ModelService.save(currentRecord.getOwner()).always(function() {
        	 ui.hideCurrentDialog();
             ui.getCurrentViewControl().refresh();
		});
         
      },
      
      noRemoveRecordFromList : function(eventContext) {
         this.ui.hideCurrentDialog();
      },

      renderDeleteRecordFromList : function(eventContext) {
         var shouldDisplay = false;
         if (PlatformConstants.CREATED_QUERYBASE == eventContext.getResource()._queryBaseName) {            
            /*
             * (isModified() == true) means it has NOT been sent to the server
             */
            var createdRecord = eventContext.getCurrentRecord();
            shouldDisplay = !createdRecord.wasCommittedToServer();
         }
         eventContext.setDisplay(shouldDisplay);
      },

      yesDeleteRecordFromList : function(eventContext) {
         var currentRecord = eventContext.application.getResource(this.getResourceName()).getCurrentRecord();
         var ui = this.ui;
         currentRecord.deleteLocalAndPendingTransactionsWithPromise().always(function() {
        	 ui.hideCurrentDialog();
             ui.getCurrentViewControl().refresh();
		});
      },
      
      noDeleteRecordFromList : function(eventContext) {
         this.ui.hideCurrentDialog();
      },
      
      getResourceName : function() {
         return "extend_class_and_override_me";
      }

   });
});
