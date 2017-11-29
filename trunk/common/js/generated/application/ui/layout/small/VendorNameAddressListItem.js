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
// Build: 2017-11-29 14:35:02
//----------------------------------------------------------------//
define(   "generated/application/ui/layout/small/VendorNameAddressListItem", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.VendorNameAddressListItem", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout VendorNameAddressListItem ');

            var row = table.insertRow(-1);
            row.className  = 'VendorNameAddressListItem_row_0';

            var col_name = row.insertCell(-1);
            col_name.className  = 'VendorNameAddressListItem_item1_column';
            col_name.colSpan = '10';
            var div_name = domConstruct.create('div');
            col_name.appendChild(div_name);
            domClass.add(div_name, 'hideextra');
            this._storeAttachToDomReference('name', div_name);
            
            var row = table.insertRow(-1);
            row.className  = 'VendorNameAddressListItem_row_1';

            var col_address = row.insertCell(-1);
            col_address.className  = 'VendorNameAddressListItem_item2_column';
            col_address.colSpan = '5';
            var div_address = domConstruct.create('div');
            col_address.appendChild(div_address);
            domClass.add(div_address, 'hideextra');
            this._storeAttachToDomReference('address', div_address);
            
            var col_city = row.insertCell(-1);
            col_city.className  = 'VendorNameAddressListItem_item3_column';
            col_city.colSpan = '2';
            col_city.style['text-align'] = 'right';
            var div_city = domConstruct.create('div');
            col_city.appendChild(div_city);
            domClass.add(div_city, 'hideextra');
            this._storeAttachToDomReference('city', div_city);
            
            var col_state = row.insertCell(-1);
            col_state.className  = 'VendorNameAddressListItem_item4_column';
            col_state.colSpan = '2';
            col_state.style['text-align'] = 'right';
            var div_state = domConstruct.create('div');
            col_state.appendChild(div_state);
            domClass.add(div_state, 'hideextra');
            this._storeAttachToDomReference('state', div_state);
            
            this.domNode = table;
         }
      });
});
