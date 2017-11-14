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
// Build: 2017-11-14 11:40:38
//----------------------------------------------------------------//
define(   "generated/application/ui/layout/small/DataSheetStatus", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.DataSheetStatus", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout DataSheetStatus ');

            var row = table.insertRow(-1);
            row.className  = 'DataSheetStatus_row_0';

            var col_icon = row.insertCell(-1);
            col_icon.className  = 'DataSheetStatus_icon_column';
            col_icon.colSpan = '1';
            col_icon.style['text-align'] = 'center';
            var div_icon = domConstruct.create('div');
            col_icon.appendChild(div_icon);
            domClass.add(div_icon, 'hideextra');
            this._storeAttachToDomReference('icon', div_icon);
            
            var col_status = row.insertCell(-1);
            col_status.className  = 'DataSheetStatus_status_column';
            col_status.colSpan = '3';
            var div_status = domConstruct.create('div');
            col_status.appendChild(div_status);
            domClass.add(div_status, 'hideextra');
            this._storeAttachToDomReference('status', div_status);
            
            var col_statusdesc = row.insertCell(-1);
            col_statusdesc.className  = 'DataSheetStatus_statusdesc_column';
            col_statusdesc.colSpan = '8';
            var div_statusdesc = domConstruct.create('div');
            col_statusdesc.appendChild(div_statusdesc);
            domClass.add(div_statusdesc, 'hideextra');
            this._storeAttachToDomReference('statusdesc', div_statusdesc);
            
            var row = table.insertRow(-1);
            row.className  = 'DataSheetStatus_row_1';

            var col_comment = row.insertCell(-1);
            col_comment.className  = 'DataSheetStatus_comment_column';
            col_comment.colSpan = '12';
            var div_comment = domConstruct.create('div');
            col_comment.appendChild(div_comment);
            domClass.add(div_comment, 'hideextra');
            this._storeAttachToDomReference('comment', div_comment);
            
            this.domNode = table;
         }
      });
});
