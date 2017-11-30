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
// Build: 2017-11-30 17:02:57
//----------------------------------------------------------------//
define(   "generated/application/ui/layout/small/AttachmentsListItem", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.AttachmentsListItem", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout AttachmentsListItem ');

            var row = table.insertRow(-1);
            row.className  = 'AttachmentsListItem_row_0';

            var col_item1 = row.insertCell(-1);
            col_item1.className  = 'AttachmentsListItem_item1_column';
            col_item1.colSpan = '12';
            var div_item1 = domConstruct.create('div');
            col_item1.appendChild(div_item1);
            domClass.add(div_item1, 'hideextra');
            this._storeAttachToDomReference('item1', div_item1);
            
            var row = table.insertRow(-1);
            row.className  = 'AttachmentsListItem_row_1';

            var col_item2 = row.insertCell(-1);
            col_item2.className  = 'AttachmentsListItem_item2_column';
            col_item2.colSpan = '5';
            var div_item2 = domConstruct.create('div');
            col_item2.appendChild(div_item2);
            domClass.add(div_item2, 'hideextra');
            this._storeAttachToDomReference('item2', div_item2);
            
            var col_item3 = row.insertCell(-1);
            col_item3.className  = 'AttachmentsListItem_item3_column';
            col_item3.colSpan = '5';
            var div_item3 = domConstruct.create('div');
            col_item3.appendChild(div_item3);
            domClass.add(div_item3, 'hideextra');
            this._storeAttachToDomReference('item3', div_item3);
            
            var row = table.insertRow(-1);
            row.className  = 'AttachmentsListItem_row_2';

            var col_icon = row.insertCell(-1);
            col_icon.className  = 'AttachmentsListItem_icon_column';
            col_icon.colSpan = '5';
            var div_icon = domConstruct.create('div');
            col_icon.appendChild(div_icon);
            domClass.add(div_icon, 'hideextra');
            this._storeAttachToDomReference('icon', div_icon);
            
            var col_item4 = row.insertCell(-1);
            col_item4.className  = 'AttachmentsListItem_item4_column';
            col_item4.colSpan = '7';
            var div_item4 = domConstruct.create('div');
            col_item4.appendChild(div_item4);
            domClass.add(div_item4, 'hideextra');
            this._storeAttachToDomReference('item4', div_item4);
            
            var row = table.insertRow(-1);
            row.className  = 'AttachmentsListItem_row_3';

            var col_item5 = row.insertCell(-1);
            col_item5.className  = 'AttachmentsListItem_item5_column';
            col_item5.colSpan = '5';
            var div_item5 = domConstruct.create('div');
            col_item5.appendChild(div_item5);
            domClass.add(div_item5, 'hideextra');
            this._storeAttachToDomReference('item5', div_item5);
            
            var col_item6 = row.insertCell(-1);
            col_item6.className  = 'AttachmentsListItem_item6_column';
            col_item6.colSpan = '5';
            var div_item6 = domConstruct.create('div');
            col_item6.appendChild(div_item6);
            domClass.add(div_item6, 'hideextra');
            this._storeAttachToDomReference('item6', div_item6);
            
            this.domNode = table;
         }
      });
});
