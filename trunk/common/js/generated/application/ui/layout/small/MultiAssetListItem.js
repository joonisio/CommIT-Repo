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
// Build: 2017-12-05 15:21:18
//----------------------------------------------------------------//
define(   "generated/application/ui/layout/small/MultiAssetListItem", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.MultiAssetListItem", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout MultiAssetListItem ');

            var row = table.insertRow(-1);
            row.className  = 'MultiAssetListItem_row_0';

            var col_item1 = row.insertCell(-1);
            col_item1.className  = 'MultiAssetListItem_item1_column';
            col_item1.colSpan = '10';
            col_item1.style['text-align'] = 'left';
            var div_item1 = domConstruct.create('div');
            col_item1.appendChild(div_item1);
            domClass.add(div_item1, 'hideextra');
            this._storeAttachToDomReference('item1', div_item1);
            
            var col_checkbox1 = row.insertCell(-1);
            col_checkbox1.className  = 'MultiAssetListItem_checkbox1_column';
            col_checkbox1.colSpan = '2';
            col_checkbox1.rowSpan = '4';
            col_checkbox1.style['vertical-align'] = 'middle';
            col_checkbox1.style['text-align'] = 'right';
            var div_checkbox1 = domConstruct.create('div');
            col_checkbox1.appendChild(div_checkbox1);
            domClass.add(div_checkbox1, 'hideextra');
            this._storeAttachToDomReference('checkbox1', div_checkbox1);
            
            var row = table.insertRow(-1);
            row.className  = 'MultiAssetListItem_row_1';

            var col_item2 = row.insertCell(-1);
            col_item2.className  = 'MultiAssetListItem_item2_column';
            col_item2.colSpan = '10';
            var div_item2 = domConstruct.create('div');
            col_item2.appendChild(div_item2);
            domClass.add(div_item2, 'hideextra');
            this._storeAttachToDomReference('item2', div_item2);
            
            var row = table.insertRow(-1);
            row.className  = 'MultiAssetListItem_row_2';

            var col_item3 = row.insertCell(-1);
            col_item3.className  = 'MultiAssetListItem_item3_column';
            col_item3.colSpan = '10';
            var div_item3 = domConstruct.create('div');
            col_item3.appendChild(div_item3);
            domClass.add(div_item3, 'hideextra');
            this._storeAttachToDomReference('item3', div_item3);
            
            var row = table.insertRow(-1);
            row.className  = 'MultiAssetListItem_row_3';

            var col_button1 = row.insertCell(-1);
            col_button1.className  = 'MultiAssetListItem_button1_column';
            col_button1.colSpan = '3';
            col_button1.style['text-align'] = 'left';
            var div_button1 = domConstruct.create('div');
            col_button1.appendChild(div_button1);
            domClass.add(div_button1, 'hideextra');
            this._storeAttachToDomReference('button1', div_button1);
            
            var col_button2 = row.insertCell(-1);
            col_button2.className  = 'MultiAssetListItem_button2_column';
            col_button2.colSpan = '3';
            col_button2.style['text-align'] = 'left';
            var div_button2 = domConstruct.create('div');
            col_button2.appendChild(div_button2);
            domClass.add(div_button2, 'hideextra');
            this._storeAttachToDomReference('button2', div_button2);
            
            var col_button3 = row.insertCell(-1);
            col_button3.className  = 'MultiAssetListItem_button3_column';
            col_button3.colSpan = '3';
            col_button3.style['text-align'] = 'left';
            var div_button3 = domConstruct.create('div');
            col_button3.appendChild(div_button3);
            domClass.add(div_button3, 'hideextra');
            this._storeAttachToDomReference('button3', div_button3);
            
            this.domNode = table;
         }
      });
});
