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

define("application/handlers/WOCreateQueryBaseHandler", 
      [ "dojo/_base/declare",
        "platform/handlers/CreateQueryBaseHandler"],
        function(declare, CreateQueryBaseHandler) {
   return declare( CreateQueryBaseHandler, {
      name: 'WOCreateQueryBaseHandler',

/**@memberOf application.handlers.WOCreateQueryBaseHandler */
      getResourceName : function() {
         return 'workOrder';
      }

   });
});
