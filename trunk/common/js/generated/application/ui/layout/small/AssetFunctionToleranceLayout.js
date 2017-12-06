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
// Build: 2017-12-06 10:34:19
//----------------------------------------------------------------//
define(   "generated/application/ui/layout/small/AssetFunctionToleranceLayout", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.AssetFunctionToleranceLayout", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout AssetFunctionToleranceLayout ');

            var row = table.insertRow(-1);
            row.className  = 'AssetFunctionToleranceLayout_row_0';

            var col_label1 = row.insertCell(-1);
            col_label1.className  = 'AssetFunctionToleranceLayout_label1_column';
            col_label1.colSpan = '2';
            var div_label1 = domConstruct.create('div');
            col_label1.appendChild(div_label1);
            domClass.add(div_label1, 'hideextra');
            this._storeAttachToDomReference('label1', div_label1);
            
            var col_value1 = row.insertCell(-1);
            col_value1.className  = 'AssetFunctionToleranceLayout_value1_column';
            col_value1.colSpan = '1';
            var div_value1 = domConstruct.create('div');
            col_value1.appendChild(div_value1);
            domClass.add(div_value1, 'hideextra');
            this._storeAttachToDomReference('value1', div_value1);
            
            var col_label2 = row.insertCell(-1);
            col_label2.className  = 'AssetFunctionToleranceLayout_label2_column';
            col_label2.colSpan = '1';
            col_label2.style['text-align'] = 'center';
            var div_label2 = domConstruct.create('div');
            col_label2.appendChild(div_label2);
            domClass.add(div_label2, 'hideextra');
            this._storeAttachToDomReference('label2', div_label2);
            
            var col_value2 = row.insertCell(-1);
            col_value2.className  = 'AssetFunctionToleranceLayout_value2_column';
            col_value2.colSpan = '1';
            col_value2.style['text-align'] = 'left';
            var div_value2 = domConstruct.create('div');
            col_value2.appendChild(div_value2);
            domClass.add(div_value2, 'hideextra');
            this._storeAttachToDomReference('value2', div_value2);
            
            var col_label3 = row.insertCell(-1);
            col_label3.className  = 'AssetFunctionToleranceLayout_label3_column';
            col_label3.colSpan = '1';
            col_label3.style['text-align'] = 'center';
            var div_label3 = domConstruct.create('div');
            col_label3.appendChild(div_label3);
            domClass.add(div_label3, 'hideextra');
            this._storeAttachToDomReference('label3', div_label3);
            
            var col_value3 = row.insertCell(-1);
            col_value3.className  = 'AssetFunctionToleranceLayout_value3_column';
            col_value3.colSpan = '6';
            col_value3.style['text-align'] = 'left';
            var div_value3 = domConstruct.create('div');
            col_value3.appendChild(div_value3);
            domClass.add(div_value3, 'hideextra');
            this._storeAttachToDomReference('value3', div_value3);
            
            this.domNode = table;
         }
      });
});
