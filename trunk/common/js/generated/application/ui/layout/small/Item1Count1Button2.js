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
// Build: 2017-11-17 09:13:15
//----------------------------------------------------------------//
define(   "generated/application/ui/layout/small/Item1Count1Button2", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.Item1Count1Button2", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout Item1Count1Button2 ');

            var row = table.insertRow(-1);
            row.className  = 'Item1Count1Button2_row_0';

            var col_item1 = row.insertCell(-1);
            col_item1.className  = 'Item1Count1Button2_item1_column';
            col_item1.colSpan = '6';
            var div_item1 = domConstruct.create('div');
            col_item1.appendChild(div_item1);
            domClass.add(div_item1, 'hideextra');
            this._storeAttachToDomReference('item1', div_item1);
            
            var col_count1 = row.insertCell(-1);
            col_count1.className  = 'Item1Count1Button2_count1_column';
            col_count1.colSpan = '2';
            col_count1.style['text-align'] = 'left';
            var div_count1 = domConstruct.create('div');
            col_count1.appendChild(div_count1);
            domClass.add(div_count1, 'hideextra');
            this._storeAttachToDomReference('count1', div_count1);
            
            var col_button2 = row.insertCell(-1);
            col_button2.className  = 'Item1Count1Button2_button2_column';
            col_button2.colSpan = '2';
            col_button2.style['text-align'] = 'right';
            var div_button2 = domConstruct.create('div');
            col_button2.appendChild(div_button2);
            domClass.add(div_button2, 'hideextra');
            this._storeAttachToDomReference('button2', div_button2);
            
            var col_button1 = row.insertCell(-1);
            col_button1.className  = 'Item1Count1Button2_button1_column';
            col_button1.colSpan = '2';
            col_button1.style['text-align'] = 'right';
            var div_button1 = domConstruct.create('div');
            col_button1.appendChild(div_button1);
            domClass.add(div_button1, 'hideextra');
            this._storeAttachToDomReference('button1', div_button1);
            
            this.domNode = table;
         }
      });
});
