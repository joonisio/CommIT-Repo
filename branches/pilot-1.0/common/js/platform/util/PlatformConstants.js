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

define("platform/util/PlatformConstants", [], 
function(){
	/**
	 * Constants used throughout the platform
	 */
	var result = {
		/**@memberOf platform.util.PlatformConstants */
		IS_FULLY_LOADED_ATTRIBUTE: '__isFullRecordLoaded',
		REMOTE_UNIQUEID_ATTRIBUTE: 'rdf:about',
		LOCAL_UNIQUEID_ATTRIBUTE: 'remoteid',
		REMOTE_NAME_ATTRIBUTE: 'remoteName',
		DISPLAY_VALUE_REMOTE_NAME_ATTRIBUTE: 'displayValueRemoteName',
		COMPLEX_ATTRS_FETCHED_ATTRIBUTE: '__complexAttributesFetched',
		NEXT_PAGE_URL: 'nextPageURL',
		NEXT_PAGE_NUM: 'nextRemotePageNum',
		ERRORED_ATTRIBUTE: '_errored',
		ERRORED_ATTRIBUTE_MSG: '_errorMessage',
		ERRORED_QUERYBASE: '__errored__',
		CHANGED_QUERYBASE: '__changed__',
		CREATED_QUERYBASE: '__created__',
		SEARCH_RESULT_QUERYBASE: '__search_result__',
		ISCHANGED_ATTRIBUTE: '_isChanged',
		LOCAL_VERSION_WINS: '_keep',
		LAST_CHANGED_TS_ATTRIBUTE: '_lastChangedTimeStamp',
		LAST_UPDATED_DT_ATTRIBUTE: '_lastUpdatedDateTime',
		SYS_DATA_DOWNLOADED_FLAG: 'systemDataDownloaded',
		LOG_TRACE : '[TRACE] ',
		LOG_TIMER : '[TIMER] ',
		LOG_HANDLER : '[HANDLER] ',
		LOG_PROFILE : '[PROFILE] ',
		SYNTHETIC_EVENTS : ['cleanup','initialize','render','validate','datachange','changestate'],
		TEMPID_ATTR_NAME: '__tempId',
		TEMPID_ATTR_DEF: {
			'name': '__tempId',
			'dataType': 'integer',
			'precision': 0,
			'index': true,
			'local': true
		},
		CHANGED_ATTRS: '__changedAttributes',
		ISNEW_ATTR: '_isNew',
		ID: '_id',
		READONLY: '_isReadOnly',
		MAX_PUSH_ATTEMPT_UPON_DISCONNECTION: 3,
		PUSH_COMPLETED_EVENT: 'PersistenceManager/PUSH_COMPLETED',
		EMPTY_COMPLEX_FIELD: "-@@EmptyComplexField@@-",
		REQUESTED_COMPLEX_ATTR_NAMES: 'requestedComplexAttributeNames',
		DATA_REFRESH_TOPIC: 'PersistenceManager/REPLACE_COMPLETED',
		BMX_LENGTH: 10,
		BMX_PADDING: 3,
		CLEANUP: true,
		LONGPRESS_RESOURCE : 'PlatformLongPressResource',
		EMPTY_VIEW : 'Platform.emptyview',
		QUERYBASES_LIST_ATTR: '_querybases',
		JSONSTORE_INDEX_MISMATCH_TOPIC: 'JSONStore/indexMismatch',
		ORIGINAL_STATE_ATTRIBUTE: '_originalState',
		DONOT_MERGE_THIS_LEVEL: '_ignoreMergingThisLevelOnly',
		TRANSACTION_ISOPEN_ATTR: '__isOpen',
		TRANSACTION_TYPE_ATTR: '__transactionType__',
		TRANSACTION_TYPE_NORMAL: 'normal',
		TRANSACTION_TYPE_PRIORITY: 'priority',
		TRANSACTION_LOCK_FORUPDATE: '__lockedForAnyUpdate',
		VIEW_MODE_DEFAULT: 'default',
		VIEW_MODE_OVERRIDE_EDIT: 'overideEdit',
		CLEANUP_TOKEN_ATTR: '_cleanupTokens',
		REF_ID_ATTR: 'anywhereRefId',
		TRANSLATE_AS_TOP_RECORDS: '==translate-as-top-records==',
		TRANSLATION_COMPLETION_CALLBACK: '==TRANSLATION_COMPLETION_CALLBACK==',		
		ATTACH_LOCATION_ATTR: 'anywhereAttachPath',
		ATTACH_DESCRIPTION_ATTR: 'anywhereAttachDescription',
		ATTACH_NAME_ATTR: 'anywhereAttachName',
		ATTACH_CATEGORY_ATTR: 'anywhereAttachCategory',
		ATTACH_SIZE_ATTR: 'anywhereAttachSize',
		ATTACH_IS_DOWNLOADED: 'anywhereAttachDownloaded',
		ATTACH_CREATION_DATE: 'anywhereCreationDate',
		ATTACH_UPLOAD_PATH: 'anywhereUploadPath',
		REFRESH_DATA_ON_LOGIN_FLAG: 'refreshDataOnLoginDownloaded',
		META_DATA_UPDATED:'wasMetaDataUpdated',
		BULK_ATTACH_DOWNLOAD: 'si.device.downloadAttachmentsWithBulkDownload',
		TOO_LARGE_DATA: '_isTooLarge'
		
	};
	
	//Try our best to make it a real constants object
	Object.freeze = (Object.freeze || function(obj){return obj;});
	
	return Object.freeze(result);
});
