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
// Build: 2017-11-14 11:40:35
//----------------------------------------------------------------//
define(   "generated/application/ui/layout/small/Item1Button2list", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.Item1Button2list", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout Item1Button2list ');

            var row = table.insertRow(-1);
            row.className  = 'Item1Button2list_row_0';

            var col_item1 = row.insertCell(-1);
            col_item1.className  = 'Item1Button2list_item1_column';
            col_item1.colSpan = '8';
            var div_item1 = domConstruct.create('div');
            col_item1.appendChild(div_item1);
            domClass.add(div_item1, 'hideextra');
            this._storeAttachToDomReference('item1', div_item1);
            
            var col_button1 = row.insertCell(-1);
            col_button1.className  = 'Item1Button2list_button1_column';
            col_button1.colSpan = '4';
            col_button1.style['text-align'] = 'right';
            var div_button1 = domConstruct.create('div');
            col_button1.appendChild(div_button1);
            domClass.add(div_button1, 'hideextra');
            this._storeAttachToDomReference('button1', div_button1);
            
            var row = table.insertRow(-1);
            row.className  = 'Item1Button2list_row_1';

            var col_button2 = row.insertCell(-1);
            col_button2.className  = 'Item1Button2list_button2_column';
            col_button2.colSpan = '12';
            col_button2.style['text-align'] = 'left';
            var div_button2 = domConstruct.create('div');
            col_button2.appendChild(div_button2);
            domClass.add(div_button2, 'hideextra');
            this._storeAttachToDomReference('button2', div_button2);
            
            this.domNode = table;
         }
      });
});
