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
// Build: 2017-12-06 10:34:17
//----------------------------------------------------------------//
define(   "generated/application/ui/layout/small/Item2Desc2", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.Item2Desc2", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout Item2Desc2 ');

            var row = table.insertRow(-1);
            row.className  = 'Item2Desc2_row_0';

            var col_item1 = row.insertCell(-1);
            col_item1.className  = 'Item2Desc2_item1_column';
            col_item1.colSpan = '4';
            var div_item1 = domConstruct.create('div');
            col_item1.appendChild(div_item1);
            domClass.add(div_item1, 'hideextra');
            this._storeAttachToDomReference('item1', div_item1);
            
            var col_desc1 = row.insertCell(-1);
            col_desc1.className  = 'Item2Desc2_desc1_column';
            col_desc1.colSpan = '8';
            var div_desc1 = domConstruct.create('div');
            col_desc1.appendChild(div_desc1);
            domClass.add(div_desc1, 'hideextra');
            this._storeAttachToDomReference('desc1', div_desc1);
            
            var row = table.insertRow(-1);
            row.className  = 'Item2Desc2_row_1';

            var col_item2 = row.insertCell(-1);
            col_item2.className  = 'Item2Desc2_item2_column';
            col_item2.colSpan = '4';
            var div_item2 = domConstruct.create('div');
            col_item2.appendChild(div_item2);
            domClass.add(div_item2, 'hideextra');
            this._storeAttachToDomReference('item2', div_item2);
            
            var col_desc2 = row.insertCell(-1);
            col_desc2.className  = 'Item2Desc2_desc2_column';
            col_desc2.colSpan = '8';
            var div_desc2 = domConstruct.create('div');
            col_desc2.appendChild(div_desc2);
            domClass.add(div_desc2, 'hideextra');
            this._storeAttachToDomReference('desc2', div_desc2);
            
            this.domNode = table;
         }
      });
});
