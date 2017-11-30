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
// Build: 2017-11-30 17:02:57
//----------------------------------------------------------------//
define(   "generated/application/ui/layout/small/CalibrationRange", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.CalibrationRange", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout CalibrationRange ');

            var row = table.insertRow(-1);
            row.className  = 'CalibrationRange_row_0';

            var col_rangeLabel = row.insertCell(-1);
            col_rangeLabel.className  = 'CalibrationRange_rangeLabel_column';
            col_rangeLabel.colSpan = '4';
            var div_rangeLabel = domConstruct.create('div');
            col_rangeLabel.appendChild(div_rangeLabel);
            domClass.add(div_rangeLabel, 'hideextra');
            this._storeAttachToDomReference('rangeLabel', div_rangeLabel);
            
            var col_from = row.insertCell(-1);
            col_from.className  = 'CalibrationRange_from_column';
            col_from.colSpan = '2';
            var div_from = domConstruct.create('div');
            col_from.appendChild(div_from);
            domClass.add(div_from, 'hideextra');
            this._storeAttachToDomReference('from', div_from);
            
            var col_toLabel = row.insertCell(-1);
            col_toLabel.className  = 'CalibrationRange_toLabel_column';
            col_toLabel.colSpan = '1';
            var div_toLabel = domConstruct.create('div');
            col_toLabel.appendChild(div_toLabel);
            domClass.add(div_toLabel, 'hideextra');
            this._storeAttachToDomReference('toLabel', div_toLabel);
            
            var col_to = row.insertCell(-1);
            col_to.className  = 'CalibrationRange_to_column';
            col_to.colSpan = '5';
            var div_to = domConstruct.create('div');
            col_to.appendChild(div_to);
            domClass.add(div_to, 'hideextra');
            this._storeAttachToDomReference('to', div_to);
            
            this.domNode = table;
         }
      });
});
