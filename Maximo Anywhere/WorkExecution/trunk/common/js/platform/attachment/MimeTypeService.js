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

define("platform/attachment/MimeTypeService",
[], 
function() {
	"use strict";
	// source: http://reference.sitepoint.com/html/mime-types-full
	var mimeMapping = {
		"pdf" : "application/pdf",
		"png" : "image/png",
		"jpg" : "image/jpeg",
		"jpeg" : "image/jpeg",
		"txt" : "text/plain",
		"doc" : "application/msword",
		"m4a" : "audio/mpeg",
		"mp4" : "video/mpeg"
	};
	
	return {		
/**@memberOf platform.attachment.MimeTypeService */
		mimeTypeForExtension: function(extension){
			extension = extension || "";
			extension = extension.toLowerCase();
			return mimeMapping[extension] || "application/octet-stream";
		}
	};
});
