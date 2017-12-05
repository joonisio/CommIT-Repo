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
// Build: 2017-12-05 15:21:15
//----------------------------------------------------------------//
define(   "generated/application/ui/layout/small/ListItem5Button1", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.ListItem5Button1", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout ListItem5Button1 ');

            var row = table.insertRow(-1);
            row.className  = 'ListItem5Button1_row_0';

            var col_item1 = row.insertCell(-1);
            col_item1.className  = 'ListItem5Button1_item1_column';
            col_item1.colSpan = '5';
            var div_item1 = domConstruct.create('div');
            col_item1.appendChild(div_item1);
            domClass.add(div_item1, 'hideextra');
            this._storeAttachToDomReference('item1', div_item1);
            
            var col_item2 = row.insertCell(-1);
            col_item2.className  = 'ListItem5Button1_item2_column';
            col_item2.colSpan = '5';
            col_item2.style['vertical-align'] = 'top';
            var div_item2 = domConstruct.create('div');
            col_item2.appendChild(div_item2);
            domClass.add(div_item2, 'hideextra');
            this._storeAttachToDomReference('item2', div_item2);
            
            var col_button1 = row.insertCell(-1);
            col_button1.className  = 'ListItem5Button1_button1_column';
            col_button1.colSpan = '2';
            col_button1.rowSpan = '3';
            col_button1.style['vertical-align'] = 'middle';
            col_button1.style['text-align'] = 'right';
            var div_button1 = domConstruct.create('div');
            col_button1.appendChild(div_button1);
            domClass.add(div_button1, 'hideextra');
            this._storeAttachToDomReference('button1', div_button1);
            
            var row = table.insertRow(-1);
            row.className  = 'ListItem5Button1_row_1';

            var col_item3 = row.insertCell(-1);
            col_item3.className  = 'ListItem5Button1_item3_column';
            col_item3.colSpan = '10';
            var div_item3 = domConstruct.create('div');
            col_item3.appendChild(div_item3);
            domClass.add(div_item3, 'hideextra');
            this._storeAttachToDomReference('item3', div_item3);
            
            var row = table.insertRow(-1);
            row.className  = 'ListItem5Button1_row_2';

            var col_item4 = row.insertCell(-1);
            col_item4.className  = 'ListItem5Button1_item4_column';
            col_item4.colSpan = '5';
            var div_item4 = domConstruct.create('div');
            col_item4.appendChild(div_item4);
            domClass.add(div_item4, 'hideextra');
            this._storeAttachToDomReference('item4', div_item4);
            
            var col_item5 = row.insertCell(-1);
            col_item5.className  = 'ListItem5Button1_item5_column';
            col_item5.colSpan = '5';
            var div_item5 = domConstruct.create('div');
            col_item5.appendChild(div_item5);
            domClass.add(div_item5, 'hideextra');
            this._storeAttachToDomReference('item5', div_item5);
            
            this.domNode = table;
         }
      });
});
