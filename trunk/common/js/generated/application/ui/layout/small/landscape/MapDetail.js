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
// Build: 2017-11-17 09:13:16
//----------------------------------------------------------------//
define(   "generated/application/ui/layout/small/landscape/MapDetail", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.landscape.MapDetail", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout MapDetail ');

            var row = table.insertRow(-1);
            row.className  = 'MapDetail_row_0';

            var col_previous = row.insertCell(-1);
            col_previous.className  = 'MapDetail_previous_column';
            col_previous.colSpan = '3';
            col_previous.style['vertical-align'] = 'middle';
            col_previous.style['text-align'] = 'right';
            var div_previous = domConstruct.create('div');
            col_previous.appendChild(div_previous);
            domClass.add(div_previous, 'hideextra');
            this._storeAttachToDomReference('previous', div_previous);
            
            var col_marker = row.insertCell(-1);
            col_marker.className  = 'MapDetail_marker_column';
            col_marker.colSpan = '3';
            col_marker.style['vertical-align'] = 'middle';
            col_marker.style['text-align'] = 'center';
            var div_marker = domConstruct.create('div');
            col_marker.appendChild(div_marker);
            domClass.add(div_marker, 'hideextra');
            this._storeAttachToDomReference('marker', div_marker);
            
            var col_startstop = row.insertCell(-1);
            col_startstop.className  = 'MapDetail_startstop_column';
            col_startstop.colSpan = '3';
            col_startstop.style['vertical-align'] = 'middle';
            col_startstop.style['text-align'] = 'center';
            var div_startstop = domConstruct.create('div');
            col_startstop.appendChild(div_startstop);
            domClass.add(div_startstop, 'hideextra');
            this._storeAttachToDomReference('startstop', div_startstop);
            
            var col_next = row.insertCell(-1);
            col_next.className  = 'MapDetail_next_column';
            col_next.colSpan = '3';
            col_next.style['vertical-align'] = 'middle';
            col_next.style['text-align'] = 'left';
            var div_next = domConstruct.create('div');
            col_next.appendChild(div_next);
            domClass.add(div_next, 'hideextra');
            this._storeAttachToDomReference('next', div_next);
            
            var row = table.insertRow(-1);
            row.className  = 'MapDetail_row_1';

            var col_address = row.insertCell(-1);
            col_address.className  = 'MapDetail_address_column';
            col_address.colSpan = '12';
            col_address.style['text-align'] = 'center';
            var div_address = domConstruct.create('div');
            col_address.appendChild(div_address);
            domClass.add(div_address, 'hideextra');
            this._storeAttachToDomReference('address', div_address);
            
            var row = table.insertRow(-1);
            row.className  = 'MapDetail_row_2';

            var col_directions = row.insertCell(-1);
            col_directions.className  = 'MapDetail_directions_column';
            col_directions.colSpan = '12';
            col_directions.style['text-align'] = 'center';
            var div_directions = domConstruct.create('div');
            col_directions.appendChild(div_directions);
            domClass.add(div_directions, 'hideextra');
            this._storeAttachToDomReference('directions', div_directions);
            
            this.domNode = table;
         }
      });
});
