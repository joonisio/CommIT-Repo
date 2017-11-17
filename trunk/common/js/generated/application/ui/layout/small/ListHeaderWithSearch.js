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
define(   "generated/application/ui/layout/small/ListHeaderWithSearch", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.ListHeaderWithSearch", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout ListHeaderWithSearch ');

            var row = table.insertRow(-1);
            row.className  = 'ListHeaderWithSearch_row_0';

            var col_searchModifier = row.insertCell(-1);
            col_searchModifier.className  = 'ListHeaderWithSearch_searchModifier_column';
            col_searchModifier.colSpan = '5';
            col_searchModifier.style['vertical-align'] = 'middle';
            col_searchModifier.style['text-align'] = 'left';
            var div_searchModifier = domConstruct.create('div');
            col_searchModifier.appendChild(div_searchModifier);
            domClass.add(div_searchModifier, 'hideextra');
            this._storeAttachToDomReference('searchModifier', div_searchModifier);
            
            var col_searchField = row.insertCell(-1);
            col_searchField.className  = 'ListHeaderWithSearch_searchField_column';
            col_searchField.colSpan = '4';
            col_searchField.style['vertical-align'] = 'middle';
            col_searchField.style['text-align'] = 'right';
            var div_searchField = domConstruct.create('div');
            col_searchField.appendChild(div_searchField);
            domClass.add(div_searchField, 'hideextra');
            this._storeAttachToDomReference('searchField', div_searchField);
            
            var col_searchButton = row.insertCell(-1);
            col_searchButton.className  = 'ListHeaderWithSearch_searchButton_column';
            col_searchButton.colSpan = '1';
            col_searchButton.style['vertical-align'] = 'middle';
            col_searchButton.style['text-align'] = 'left';
            var div_searchButton = domConstruct.create('div');
            col_searchButton.appendChild(div_searchButton);
            domClass.add(div_searchButton, 'hideextra');
            this._storeAttachToDomReference('searchButton', div_searchButton);
            
            var col_count = row.insertCell(-1);
            col_count.className  = 'ListHeaderWithSearch_count_column';
            col_count.colSpan = '2';
            col_count.style['vertical-align'] = 'middle';
            col_count.style['text-align'] = 'right';
            var div_count = domConstruct.create('div');
            col_count.appendChild(div_count);
            domClass.add(div_count, 'hideextra');
            this._storeAttachToDomReference('count', div_count);
            
            this.domNode = table;
         }
      });
});
