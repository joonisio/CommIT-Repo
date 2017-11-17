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
// Build: 2017-11-17 09:13:17
//----------------------------------------------------------------//
define(   "generated/application/ui/layout/small/CalibrationTolError", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.CalibrationTolError", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout CalibrationTolError ');

            var row = table.insertRow(-1);
            row.className  = 'CalibrationTolError_row_0';

            var col_rangeLabel = row.insertCell(-1);
            col_rangeLabel.className  = 'CalibrationTolError_rangeLabel_column';
            col_rangeLabel.colSpan = '3';
            var div_rangeLabel = domConstruct.create('div');
            col_rangeLabel.appendChild(div_rangeLabel);
            domClass.add(div_rangeLabel, 'hideextra');
            this._storeAttachToDomReference('rangeLabel', div_rangeLabel);
            
            var col_from = row.insertCell(-1);
            col_from.className  = 'CalibrationTolError_from_column';
            col_from.colSpan = '3';
            var div_from = domConstruct.create('div');
            col_from.appendChild(div_from);
            domClass.add(div_from, 'hideextra');
            this._storeAttachToDomReference('from', div_from);
            
            var col_toLabel = row.insertCell(-1);
            col_toLabel.className  = 'CalibrationTolError_toLabel_column';
            col_toLabel.colSpan = '1';
            var div_toLabel = domConstruct.create('div');
            col_toLabel.appendChild(div_toLabel);
            domClass.add(div_toLabel, 'hideextra');
            this._storeAttachToDomReference('toLabel', div_toLabel);
            
            var col_to = row.insertCell(-1);
            col_to.className  = 'CalibrationTolError_to_column';
            col_to.colSpan = '3';
            var div_to = domConstruct.create('div');
            col_to.appendChild(div_to);
            domClass.add(div_to, 'hideextra');
            this._storeAttachToDomReference('to', div_to);
            
            var col_errorLabel = row.insertCell(-1);
            col_errorLabel.className  = 'CalibrationTolError_errorLabel_column';
            col_errorLabel.colSpan = '2';
            var div_errorLabel = domConstruct.create('div');
            col_errorLabel.appendChild(div_errorLabel);
            domClass.add(div_errorLabel, 'hideextra');
            this._storeAttachToDomReference('errorLabel', div_errorLabel);
            
            var col_error = row.insertCell(-1);
            col_error.className  = 'CalibrationTolError_error_column';
            col_error.colSpan = '3';
            var div_error = domConstruct.create('div');
            col_error.appendChild(div_error);
            domClass.add(div_error, 'hideextra');
            this._storeAttachToDomReference('error', div_error);
            
            this.domNode = table;
         }
      });
});
