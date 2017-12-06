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
define(   "generated/application/ui/layout/small/ListHeader", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.ListHeader", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout ListHeader ');

            var row = table.insertRow(-1);
            row.className  = 'ListHeader_row_0';

            var col_sortLabel = row.insertCell(-1);
            col_sortLabel.className  = 'ListHeader_sortLabel_column';
            col_sortLabel.colSpan = '6';
            col_sortLabel.style['vertical-align'] = 'middle';
            col_sortLabel.style['text-align'] = 'left';
            var div_sortLabel = domConstruct.create('div');
            col_sortLabel.appendChild(div_sortLabel);
            domClass.add(div_sortLabel, 'hideextra');
            this._storeAttachToDomReference('sortLabel', div_sortLabel);
            
            var col_refreshIcon = row.insertCell(-1);
            col_refreshIcon.className  = 'ListHeader_refreshIcon_column';
            col_refreshIcon.colSpan = '1';
            col_refreshIcon.style['vertical-align'] = 'middle';
            col_refreshIcon.style['text-align'] = 'right';
            var div_refreshIcon = domConstruct.create('div');
            col_refreshIcon.appendChild(div_refreshIcon);
            domClass.add(div_refreshIcon, 'hideextra');
            this._storeAttachToDomReference('refreshIcon', div_refreshIcon);
            
            var col_errorImage = row.insertCell(-1);
            col_errorImage.className  = 'ListHeader_errorImage_column';
            col_errorImage.colSpan = '1';
            col_errorImage.style['vertical-align'] = 'middle';
            col_errorImage.style['text-align'] = 'right';
            var div_errorImage = domConstruct.create('div');
            col_errorImage.appendChild(div_errorImage);
            domClass.add(div_errorImage, 'hideextra');
            this._storeAttachToDomReference('errorImage', div_errorImage);
            
            var col_errorCount = row.insertCell(-1);
            col_errorCount.className  = 'ListHeader_errorCount_column';
            col_errorCount.colSpan = '1';
            col_errorCount.style['vertical-align'] = 'middle';
            col_errorCount.style['text-align'] = 'left';
            var div_errorCount = domConstruct.create('div');
            col_errorCount.appendChild(div_errorCount);
            domClass.add(div_errorCount, 'hideextra');
            this._storeAttachToDomReference('errorCount', div_errorCount);
            
            var col_separator = row.insertCell(-1);
            col_separator.className  = 'ListHeader_separator_column';
            col_separator.colSpan = '1';
            col_separator.style['vertical-align'] = 'middle';
            col_separator.style['text-align'] = 'center';
            var div_separator = domConstruct.create('div');
            col_separator.appendChild(div_separator);
            domClass.add(div_separator, 'hideextra');
            this._storeAttachToDomReference('separator', div_separator);
            
            var col_count = row.insertCell(-1);
            col_count.className  = 'ListHeader_count_column';
            col_count.colSpan = '2';
            col_count.style['vertical-align'] = 'middle';
            col_count.style['text-align'] = 'center';
            var div_count = domConstruct.create('div');
            col_count.appendChild(div_count);
            domClass.add(div_count, 'hideextra');
            this._storeAttachToDomReference('count', div_count);
            
            this.domNode = table;
         }
      });
});
