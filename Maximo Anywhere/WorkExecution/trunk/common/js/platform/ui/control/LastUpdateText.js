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

define("platform/ui/control/LastUpdateText",
	   [ "dojo/_base/declare",
	     "platform/ui/control/Text",
	     "platform/ui/widget/Label",
	     "platform/translation/MessageService"
	     ],
function(declare, Text, Label, MessageService) {
	return declare( [ Text ], {
		/**@memberOf platform.ui.control.LastUpdateText */
    	editable: false,
    	hasLookup: false,
    	
		constructor : function(options) {
			this.resourceAttribute = '_lastUpdatedDateTime';
			this.labelClassName += ' lastUpdateText textappearance-small';
			this.cssClass = ' lastUpdateText textappearance-small';
/*			this.label = (new Label(
					{
						control: this, 
						labelClassName: ' lastUpdateText textappearance-small', 
						label: MessageService.createStaticMessage('lastupdatetext','configuration').getMessage()
					}
				)).build();
				*/
			this.label = MessageService.createStaticMessage('lastupdatetext').getMessage();
		},

	});
});
