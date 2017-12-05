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
define(   "generated/application/ui/layout/small/MapEndPoint", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.MapEndPoint", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout MapEndPoint ');

            var row = table.insertRow(-1);
            row.className  = 'MapEndPoint_row_0';

            var col_marker = row.insertCell(-1);
            col_marker.className  = 'MapEndPoint_marker_column';
            col_marker.colSpan = '2';
            col_marker.style['vertical-align'] = 'middle';
            var div_marker = domConstruct.create('div');
            col_marker.appendChild(div_marker);
            domClass.add(div_marker, 'hideextra');
            this._storeAttachToDomReference('marker', div_marker);
            
            var col_address = row.insertCell(-1);
            col_address.className  = 'MapEndPoint_address_column';
            col_address.colSpan = '10';
            col_address.style['vertical-align'] = 'top';
            var div_address = domConstruct.create('div');
            col_address.appendChild(div_address);
            domClass.add(div_address, 'hideextra');
            this._storeAttachToDomReference('address', div_address);
            
            this.domNode = table;
         }
      });
});
