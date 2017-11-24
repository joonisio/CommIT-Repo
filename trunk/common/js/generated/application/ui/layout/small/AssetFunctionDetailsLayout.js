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
// Build: 2017-11-23 18:08:47
//----------------------------------------------------------------//
define(   "generated/application/ui/layout/small/AssetFunctionDetailsLayout", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.AssetFunctionDetailsLayout", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout AssetFunctionDetailsLayout ');

            var row = table.insertRow(-1);
            row.className  = 'AssetFunctionDetailsLayout_row_0';

            var col_label1 = row.insertCell(-1);
            col_label1.className  = 'AssetFunctionDetailsLayout_label1_column';
            col_label1.colSpan = '2';
            var div_label1 = domConstruct.create('div');
            col_label1.appendChild(div_label1);
            domClass.add(div_label1, 'hideextra');
            this._storeAttachToDomReference('label1', div_label1);
            
            var col_value1 = row.insertCell(-1);
            col_value1.className  = 'AssetFunctionDetailsLayout_value1_column';
            col_value1.colSpan = '5';
            col_value1.style['text-align'] = 'left';
            var div_value1 = domConstruct.create('div');
            col_value1.appendChild(div_value1);
            domClass.add(div_value1, 'hideextra');
            this._storeAttachToDomReference('value1', div_value1);
            
            var col_label2 = row.insertCell(-1);
            col_label2.className  = 'AssetFunctionDetailsLayout_label2_column';
            col_label2.colSpan = '5';
            col_label2.style['text-align'] = 'left';
            var div_label2 = domConstruct.create('div');
            col_label2.appendChild(div_label2);
            domClass.add(div_label2, 'hideextra');
            this._storeAttachToDomReference('label2', div_label2);
            
            this.domNode = table;
         }
      });
});
