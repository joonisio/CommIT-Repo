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
define(   "generated/application/ui/layout/small/Button2", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.Button2", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout Button2 ');

            var row = table.insertRow(-1);
            row.className  = 'Button2_row_0';

            var col_col_0_0 = row.insertCell(-1);
            col_col_0_0.className  = 'Button2_col_0_0_column';
            col_col_0_0.colSpan = '3';
            var div_col_0_0 = domConstruct.create('div');
            col_col_0_0.appendChild(div_col_0_0);
            domClass.add(div_col_0_0, 'hideextra');
            this._storeAttachToDomReference('col_0_0', div_col_0_0);
            
            var col_button1 = row.insertCell(-1);
            col_button1.className  = 'Button2_button1_column';
            col_button1.colSpan = '2';
            col_button1.style['text-align'] = 'center';
            var div_button1 = domConstruct.create('div');
            col_button1.appendChild(div_button1);
            domClass.add(div_button1, 'hideextra');
            this._storeAttachToDomReference('button1', div_button1);
            
            var col_col_0_1 = row.insertCell(-1);
            col_col_0_1.className  = 'Button2_col_0_1_column';
            col_col_0_1.colSpan = '2';
            var div_col_0_1 = domConstruct.create('div');
            col_col_0_1.appendChild(div_col_0_1);
            domClass.add(div_col_0_1, 'hideextra');
            this._storeAttachToDomReference('col_0_1', div_col_0_1);
            
            var col_button2 = row.insertCell(-1);
            col_button2.className  = 'Button2_button2_column';
            col_button2.colSpan = '2';
            col_button2.style['text-align'] = 'center';
            var div_button2 = domConstruct.create('div');
            col_button2.appendChild(div_button2);
            domClass.add(div_button2, 'hideextra');
            this._storeAttachToDomReference('button2', div_button2);
            
            var col_col_0_2 = row.insertCell(-1);
            col_col_0_2.className  = 'Button2_col_0_2_column';
            col_col_0_2.colSpan = '3';
            var div_col_0_2 = domConstruct.create('div');
            col_col_0_2.appendChild(div_col_0_2);
            domClass.add(div_col_0_2, 'hideextra');
            this._storeAttachToDomReference('col_0_2', div_col_0_2);
            
            this.domNode = table;
         }
      });
});
