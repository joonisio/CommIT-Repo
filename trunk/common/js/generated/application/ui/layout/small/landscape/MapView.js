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
// Build: 2017-12-06 10:34:18
//----------------------------------------------------------------//
define(   "generated/application/ui/layout/small/landscape/MapView", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.landscape.MapView", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout MapView ');

            var row = table.insertRow(-1);
            row.className  = 'MapView_row_0';

            var col_map = row.insertCell(-1);
            col_map.className  = 'MapView_map_column';
            col_map.colSpan = '6';
            var div_map = domConstruct.create('div');
            col_map.appendChild(div_map);
            domClass.add(div_map, 'hideextra');
            this._storeAttachToDomReference('map', div_map);
            
            var col_mapdetail = row.insertCell(-1);
            col_mapdetail.className  = 'MapView_mapdetail_column';
            col_mapdetail.colSpan = '6';
            col_mapdetail.style['vertical-align'] = 'middle';
            col_mapdetail.style['text-align'] = 'center';
            var div_mapdetail = domConstruct.create('div');
            col_mapdetail.appendChild(div_mapdetail);
            domClass.add(div_mapdetail, 'hideextra');
            this._storeAttachToDomReference('mapdetail', div_mapdetail);
            
            this.domNode = table;
         }
      });
});
