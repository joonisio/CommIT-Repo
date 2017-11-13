/* 
 * Licensed Materials - Property of IBM
 * "Restricted Materials of IBM"
 *
 * 5725-M39
 *
 * (C) COPYRIGHT IBM CORP. 2017 All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp. 
 *
 */
 
//----------------------------------------------------------------//
// This is auto generated code. Do not modify it manually.
// Product and Version: IBM Maximo Anywhere Version 7.5
// Build: 2017-11-13 09:36:42
//----------------------------------------------------------------//
define(   "generated/application/ui/layout/small/NotificationList", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.NotificationList", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout NotificationList ');

            var row = table.insertRow(-1);
            row.className  = 'NotificationList_row_0';

            var col_date1 = row.insertCell(-1);
            col_date1.className  = 'NotificationList_col0_0';
            col_date1.colSpan = '12';
            var div_date1 = domConstruct.create('div');
            col_date1.appendChild(div_date1);
            domClass.add(div_date1, 'hideextra');
            this._storeAttachToDomReference('date1', div_date1);
            
            var row = table.insertRow(-1);
            row.className  = 'NotificationList_row_1';

            var col_item1 = row.insertCell(-1);
            col_item1.className  = 'NotificationList_col0_1';
            col_item1.colSpan = '4';
            var div_item1 = domConstruct.create('div');
            col_item1.appendChild(div_item1);
            domClass.add(div_item1, 'hideextra');
            this._storeAttachToDomReference('item1', div_item1);
            
            var col_item2 = row.insertCell(-1);
            col_item2.className  = 'NotificationList_col1_1';
            col_item2.colSpan = '8';
            var div_item2 = domConstruct.create('div');
            col_item2.appendChild(div_item2);
            domClass.add(div_item2, 'hideextra');
            this._storeAttachToDomReference('item2', div_item2);
            
            this.domNode = table;
         }
      });
});
