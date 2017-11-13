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
// Build: 2017-11-13 09:36:41
//----------------------------------------------------------------//
define(   "generated/application/ui/layout/small/ListItem3Input1", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.ListItem3Input1", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout ListItem3Input1 ');

            var row = table.insertRow(-1);
            row.className  = 'ListItem3Input1_row_0';

            var col_item1 = row.insertCell(-1);
            col_item1.className  = 'ListItem3Input1_col0_0';
            col_item1.colSpan = '4';
            var div_item1 = domConstruct.create('div');
            col_item1.appendChild(div_item1);
            domClass.add(div_item1, 'hideextra');
            this._storeAttachToDomReference('item1', div_item1);
            
            var col_desc1 = row.insertCell(-1);
            col_desc1.className  = 'ListItem3Input1_col1_0';
            col_desc1.colSpan = '8';
            var div_desc1 = domConstruct.create('div');
            col_desc1.appendChild(div_desc1);
            domClass.add(div_desc1, 'hideextra');
            this._storeAttachToDomReference('desc1', div_desc1);
            
            var row = table.insertRow(-1);
            row.className  = 'ListItem3Input1_row_1';

            var col_item2 = row.insertCell(-1);
            col_item2.className  = 'ListItem3Input1_col0_1';
            col_item2.colSpan = '10';
            var div_item2 = domConstruct.create('div');
            col_item2.appendChild(div_item2);
            domClass.add(div_item2, 'hideextra');
            this._storeAttachToDomReference('item2', div_item2);
            
            var row = table.insertRow(-1);
            row.className  = 'ListItem3Input1_row_2';

            var col_input1 = row.insertCell(-1);
            col_input1.className  = 'ListItem3Input1_col0_2';
            col_input1.colSpan = '10';
            var div_input1 = domConstruct.create('div');
            col_input1.appendChild(div_input1);
            domClass.add(div_input1, 'hideextra');
            this._storeAttachToDomReference('input1', div_input1);
            
            this.domNode = table;
         }
      });
});
