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
// Build: 2017-11-30 17:02:56
//----------------------------------------------------------------//
define(   "generated/application/ui/layout/small/ScanHeader", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.ScanHeader", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout ScanHeader ');

            var row = table.insertRow(-1);
            row.className  = 'ScanHeader_row_0';

            var col_label = row.insertCell(-1);
            col_label.className  = 'ScanHeader_label_column';
            col_label.colSpan = '10';
            col_label.style['vertical-align'] = 'middle';
            col_label.style['text-align'] = 'left';
            var div_label = domConstruct.create('div');
            col_label.appendChild(div_label);
            domClass.add(div_label, 'hideextra');
            this._storeAttachToDomReference('label', div_label);
            
            var col_cancel = row.insertCell(-1);
            col_cancel.className  = 'ScanHeader_cancel_column';
            col_cancel.colSpan = '2';
            col_cancel.style['vertical-align'] = 'middle';
            col_cancel.style['text-align'] = 'right';
            var div_cancel = domConstruct.create('div');
            col_cancel.appendChild(div_cancel);
            domClass.add(div_cancel, 'hideextra');
            this._storeAttachToDomReference('cancel', div_cancel);
            
            this.domNode = table;
         }
      });
});
