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
// Build: 2017-11-17 09:13:18
//----------------------------------------------------------------//
define(   "generated/application/ui/layout/small/ServiceAddressLookup", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.ServiceAddressLookup", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout ServiceAddressLookup ');

            var row = table.insertRow(-1);
            row.className  = 'ServiceAddressLookup_row_0';

            var col_addrcode = row.insertCell(-1);
            col_addrcode.className  = 'ServiceAddressLookup_addrcode_column';
            col_addrcode.colSpan = '4';
            col_addrcode.style['text-align'] = 'left';
            var div_addrcode = domConstruct.create('div');
            col_addrcode.appendChild(div_addrcode);
            domClass.add(div_addrcode, 'hideextra');
            this._storeAttachToDomReference('addrcode', div_addrcode);
            
            var col_description = row.insertCell(-1);
            col_description.className  = 'ServiceAddressLookup_description_column';
            col_description.colSpan = '8';
            col_description.style['text-align'] = 'right';
            var div_description = domConstruct.create('div');
            col_description.appendChild(div_description);
            domClass.add(div_description, 'hideextra');
            this._storeAttachToDomReference('description', div_description);
            
            var row = table.insertRow(-1);
            row.className  = 'ServiceAddressLookup_row_1';

            var col_formattedaddr = row.insertCell(-1);
            col_formattedaddr.className  = 'ServiceAddressLookup_formattedaddr_column';
            col_formattedaddr.colSpan = '12';
            var div_formattedaddr = domConstruct.create('div');
            col_formattedaddr.appendChild(div_formattedaddr);
            domClass.add(div_formattedaddr, 'hideextra');
            this._storeAttachToDomReference('formattedaddr', div_formattedaddr);
            
            this.domNode = table;
         }
      });
});
