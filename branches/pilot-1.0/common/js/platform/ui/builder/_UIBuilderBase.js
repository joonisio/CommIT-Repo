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

define("platform/ui/builder/_UIBuilderBase", [ "dojo/_base/declare", "dojo/_base/window", "dojo/dom-construct" ], function(declare, baseWindow, domConstruct) {
	return declare("platform.ui.builder._UIBuilderBase", null, {
	    // TODO Add any logic common to application specific UIBuilder

/**@memberOf platform.ui.builder._UIBuilderBase */
	    build : function() {
		    // To be implemented by the generated application UIBuilder
		    // to build all the screen components
	    },

	    _addView : function(viewId, viewObj) {
		    // Add the viewObj to a sort of list
	    },

	    _buildUI : function() {
		    // Take all added views and build the whole app UI
	    },

	    addApplication : function(application) {
	    	application.log('Building App', 2, null);
		    application.ui.build();
		    application.log('Done building App', 2, null);
		    domConstruct.place(application.ui.baseWidget.domNode, baseWindow.body());
		    application.log('Done placing app DOM', 2, null);
		    
		    //Send application initialize events, so SSO customizers can provide their own custom initialization
		    application.initialize();
		 
	    }
	});
});
