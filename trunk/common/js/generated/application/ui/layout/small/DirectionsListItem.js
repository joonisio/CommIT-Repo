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
// Build: 2017-11-30 17:02:55
//----------------------------------------------------------------//
define(   "generated/application/ui/layout/small/DirectionsListItem", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.DirectionsListItem", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout DirectionsListItem ');

            var row = table.insertRow(-1);
            row.className  = 'DirectionsListItem_row_0';

            var col_step = row.insertCell(-1);
            col_step.className  = 'DirectionsListItem_step_column';
            col_step.colSpan = '12';
            col_step.style['vertical-align'] = 'middle';
            var div_step = domConstruct.create('div');
            col_step.appendChild(div_step);
            domClass.add(div_step, 'hideextra');
            this._storeAttachToDomReference('step', div_step);
            
            this.domNode = table;
         }
      });
});
