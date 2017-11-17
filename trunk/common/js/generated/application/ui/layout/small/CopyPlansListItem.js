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
// Build: 2017-11-17 09:13:17
//----------------------------------------------------------------//
define(   "generated/application/ui/layout/small/CopyPlansListItem", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.CopyPlansListItem", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout CopyPlansListItem ');

            var row = table.insertRow(-1);
            row.className  = 'CopyPlansListItem_row_0';

            var col_item15 = row.insertCell(-1);
            col_item15.className  = 'CopyPlansListItem_item15_column';
            col_item15.colSpan = '6';
            col_item15.style['text-align'] = 'left';
            var div_item15 = domConstruct.create('div');
            col_item15.appendChild(div_item15);
            domClass.add(div_item15, 'hideextra');
            this._storeAttachToDomReference('item15', div_item15);
            
            var col_item3 = row.insertCell(-1);
            col_item3.className  = 'CopyPlansListItem_item3_column';
            col_item3.colSpan = '3';
            col_item3.rowSpan = '5';
            col_item3.style['vertical-align'] = 'middle';
            col_item3.style['text-align'] = 'right';
            var div_item3 = domConstruct.create('div');
            col_item3.appendChild(div_item3);
            domClass.add(div_item3, 'hideextra');
            this._storeAttachToDomReference('item3', div_item3);
            
            var col_item1 = row.insertCell(-1);
            col_item1.className  = 'CopyPlansListItem_item1_column';
            col_item1.colSpan = '3';
            col_item1.rowSpan = '5';
            col_item1.style['vertical-align'] = 'middle';
            col_item1.style['text-align'] = 'right';
            var div_item1 = domConstruct.create('div');
            col_item1.appendChild(div_item1);
            domClass.add(div_item1, 'hideextra');
            this._storeAttachToDomReference('item1', div_item1);
            
            var row = table.insertRow(-1);
            row.className  = 'CopyPlansListItem_row_1';

            var col_item5 = row.insertCell(-1);
            col_item5.className  = 'CopyPlansListItem_item5_column';
            col_item5.colSpan = '6';
            var div_item5 = domConstruct.create('div');
            col_item5.appendChild(div_item5);
            domClass.add(div_item5, 'hideextra');
            this._storeAttachToDomReference('item5', div_item5);
            
            var row = table.insertRow(-1);
            row.className  = 'CopyPlansListItem_row_2';

            var col_item8 = row.insertCell(-1);
            col_item8.className  = 'CopyPlansListItem_item8_column';
            col_item8.colSpan = '6';
            var div_item8 = domConstruct.create('div');
            col_item8.appendChild(div_item8);
            domClass.add(div_item8, 'hideextra');
            this._storeAttachToDomReference('item8', div_item8);
            
            var row = table.insertRow(-1);
            row.className  = 'CopyPlansListItem_row_3';

            var col_item11 = row.insertCell(-1);
            col_item11.className  = 'CopyPlansListItem_item11_column';
            col_item11.colSpan = '6';
            var div_item11 = domConstruct.create('div');
            col_item11.appendChild(div_item11);
            domClass.add(div_item11, 'hideextra');
            this._storeAttachToDomReference('item11', div_item11);
            
            var row = table.insertRow(-1);
            row.className  = 'CopyPlansListItem_row_4';

            var col_item14 = row.insertCell(-1);
            col_item14.className  = 'CopyPlansListItem_item14_column';
            col_item14.colSpan = '6';
            var div_item14 = domConstruct.create('div');
            col_item14.appendChild(div_item14);
            domClass.add(div_item14, 'hideextra');
            this._storeAttachToDomReference('item14', div_item14);
            
            this.domNode = table;
         }
      });
});
