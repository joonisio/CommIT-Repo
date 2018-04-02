/**
 * View Handler for Asset Function Details
 */

define("application/handlers/AssetFunctionDetailsViewHandler", 
	   [ "dojo/_base/declare",
	     "dojo/_base/lang",
	     "dojo/_base/array",
	     "platform/handlers/_ApplicationHandlerBase",
	     "platform/exception/PlatformRuntimeException",
	     "platform/warning/PlatformRuntimeWarning",
	     "application/handlers/CommonHandler",
	     "platform/util/PlatformConstants",
	     "platform/logging/Logger",
	     "dojo/Deferred"
	     ],
function(declare,lang, array, ApplicationHandlerBase, PlatformRuntimeException, PlatformRuntimeWarning, CommonHandler, PlatformConstants, Logger, Deferred) {
	return declare( ApplicationHandlerBase, {
		
		section_end_items: ['tol4sumdirection', 'tol3sumdirection', 'tol2sumdirection', 'tol1sumdirection'],
		
		show_section: 0,
		
/**@memberOf application.handlers.AssetFunctionDetailsViewHandler */
		hideOnRender: function(eventContext){
			eventContext.setDisplay(false);
		},
		
		headerClicked: function(eventContext){
			var nextContainer = eventContext.parentControl.baseWidget.domNode.nextSibling;
			if(nextContainer.style.display == "none")
				nextContainer.style.display = "block";
			else
				nextContainer.style.display = "none";
		},
		
		yornRender: function(eventContext){
			var assetfunction = eventContext.application.getResource('dataSheetResource.assetfunctionlist').getCurrentRecord();
			var yorn = assetfunction.get(eventContext.resourceAttribute) ? 'Yes' : 'No';
			eventContext.textWidget.domNode.textContent = yorn;

		},
		
		itemRender: function(eventContext){
			var assetfunction = eventContext.application.getResource('dataSheetResource.assetfunctionlist').getCurrentRecord();
			if(!assetfunction.get(eventContext.resourceAttribute))
				eventContext.parentControl.setDisplay(false);
				
		},
		
		/*
		 * Hides the current container holding the items and its header container.
		 */
		hideSection: function(eventContext){
			
				//Seting the previous container-> the Header section to no display
				var header_container = eventContext.parentControl.parentControl.parentControl.baseWidget.domNode.previousSibling;
				header_container.style.display = "none";
				
				//Setting the current container -> data fields container displayto false
				eventContext.parentControl.parentControl.parentControl.setDisplay(false);
			
		},
		
		/*This function checks to see if a field has data. If not it hides the field
		 * Additionally it also votes to hide the main section it belongs to based on data availability
		 * i.e it votes true to show section if data is available.
		 * When the last field in section calls this render, the votes are checked to see if the 
		 * section should still be displayed or not.
		 * **Usage: Add this handler if the section should be hidden if all the fields are empty
		 * **The last item in the section should be added to tthis.section_end_items
		 */
		sectionizedItemRender: function(eventContext){
			var assetfunction = eventContext.application.getResource('dataSheetResource.assetfunctionlist').getCurrentRecord();
			if(!assetfunction.get(eventContext.resourceAttribute)){
				eventContext.parentControl.setDisplay(false);
				
			}
			else //Each field votes based on its data availability; to display the whole section or not
				this.show_section++;
			
			var isLastItem = this.section_end_items.indexOf(eventContext.resourceAttribute) > -1?true:false;
			
			//When we get to last item field of a section, we round up the votes to see, if the section 
			//section should be displayed or not. Even if one member reported that it has data
			//the section will be displayed.
			if(isLastItem){
				
				//If nobody voted to show section, hide the section
				if(this.show_section == 0){
					this.hideSection(eventContext);
				}
				//reset votes for next section
				this.show_section = 0;
			}
			
		},

	});
});
