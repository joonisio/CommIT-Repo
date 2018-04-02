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

define("platform/ui/control/BusyIndicator", ["platform/logging/Logger"], function(Logger){
	var showedByApplication = false;
	var hiddenByApplication = false;
	WL.BusyIndicator.prototype._show = WL.BusyIndicator.prototype.show;
	WL.BusyIndicator.prototype._hide = WL.BusyIndicator.prototype.hide;
	
	WL.BusyIndicator.prototype.show = function() {
		Logger.trace("Loading message showed by application = " + showedByApplication);
		this._show();
	};
	WL.BusyIndicator.prototype.hide = function() {
		Logger.trace("Loading message hidden by application = " + hiddenByApplication);
		if (hiddenByApplication ||
			showedByApplication === hiddenByApplication){
			Logger.trace("Loading message hidden");
			this._hide();
		}
	};
	var busyIcon = new WL.BusyIndicator('content', {text: WL.ClientMessages.loading});
	return {
/**@memberOf platform.ui.control.BusyIndicator */
		show: function(){
			showedByApplication = true;
			busyIcon.show();
		},
		
		hide: function(){
			hiddenByApplication = true;
			//hack to force busy indicator to hide in preview
			busyIcon.__busyOverlay = true;
			busyIcon.hide();
			showedByApplication = hiddenByApplication = false;
			
			if (window.WL && WL.application){
				WL.application.showBusyState = false;
			}			
		},
		
		isVisible: function() {
			return busyIcon.isVisible();
		}
	};
});
