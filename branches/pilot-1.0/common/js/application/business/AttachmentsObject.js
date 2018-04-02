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

define("application/business/AttachmentsObject", 
		["platform/util/PlatformConstants",
		  "platform/translation/MessageService",
		     "platform/model/ModelService",
		     "platform/store/SystemProperties",
		     "platform/auth/UserManager",
		     "platform/format/FormatterService"], 
		 function(PlatformConstants, MessageService, ModelService, SystemProperties, UserManager, FormatterService) {
	return {
/**@memberOf application.business.AttachmentsObject */
		onInitialize : function(attachment) {
			
		},
		
		extensionOf : function(filePath, splitChar){
			if(splitChar == 'undefined' || splitChar == null){
				splitChar = ".";
			}
			var pos = filePath.lastIndexOf(splitChar);
			if(pos >= 0){
				return filePath.substring(pos + 1, filePath.length).toLowerCase();
			}
			else return "";
		},
	      beforeSave : function(attachment) {
	    	  if(!attachment.get('fileName') && attachment.get(PlatformConstants.ATTACH_NAME_ATTR)){
					attachment.set('fileName',attachment.get(PlatformConstants.ATTACH_NAME_ATTR));
				}
				
				if(!attachment.get('description') && attachment.get(PlatformConstants.ATTACH_DESCRIPTION_ATTR)){
					attachment.set('description',attachment.get(PlatformConstants.ATTACH_DESCRIPTION_ATTR));
				}
				//Unfortunately, we have to pull our doclink attach path of anywheredoclinks from a system property
				//Because it is not exposed in the RDF from OSLC
				attachment.set('anywhereUploadPath', "created/" + SystemProperties.getProperty('si.attach.doclink.doctypes.defpath') );
				
				attachment.set('createby',UserManager.getCurrentUser());
				attachment.set('docType',attachment.get(PlatformConstants.ATTACH_CATEGORY_ATTR));
				
				attachment.set('displayFileName',attachment.get('anywhereAttachName'));
				attachment.set('displayDescription',attachment.get('anywhereAttachDescription'));
				
				attachment.setDateValue('displayCreationDate',attachment.getAsDateOrNull('anywhereCreationDate'));
				
				var fullFileName = attachment.get('anywhereAttachPath');
					if(fullFileName){
						attachment.set('displayFileType',this.extensionOf(fullFileName));
					}
					
				var userLocale = (WL && WL.App && WL.App.getDeviceLocale() || 'en-US');
				userLocale = userLocale.replace('_','-');
				attachment.set('displaySize',FormatterService.toDisplayableValue(attachment.get('anywhereAttachSize'), "double", userLocale) + ' ' + MessageService.createStaticMessage('measure').getMessage());
				//ModelService.save(attachment.getOwner().getParent().getOwner());
	       },
		
	}
});
