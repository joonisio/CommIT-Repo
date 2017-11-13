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

//>>built
define("platform/ui/widget/EdgeToEdgeStoreList", [
	"dojo/_base/declare",
	"dojox/mobile/EdgeToEdgeStoreList",
	"platform/ui/widget/_StoreListMixin"
], function(declare, EdgeToEdgeStoreList, StoreListMixin){

/*=====
	var EdgeToEdgeList = dojox.mobile.EdgeToEdgeList;
	var StoreListMixin = dojox.mobile._StoreListMixin;
=====*/

	// module:
	//		dojox/mobile/EdgeToEdgeStoreList
	// summary:
	//		An enhanced version of EdgeToEdgeList.

	return declare([EdgeToEdgeStoreList, StoreListMixin],{
		// summary:
		//		An enhanced version of EdgeToEdgeList.
		// description:
		//		EdgeToEdgeStoreList is an enhanced version of EdgeToEdgeList. It
		//		can generate ListItems according to the given dojo.store store.
	});
});
