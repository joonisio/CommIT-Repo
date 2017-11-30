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
// Build: 2017-11-30 17:02:57
//----------------------------------------------------------------//
define(   "generated/application/ui/layout/small/CalibrationReadings", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.CalibrationReadings", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout CalibrationReadings ');

            var row = table.insertRow(-1);
            row.className  = 'CalibrationReadings_row_0';

            var col_reading = row.insertCell(-1);
            col_reading.className  = 'CalibrationReadings_reading_column';
            col_reading.colSpan = '12';
            var div_reading = domConstruct.create('div');
            col_reading.appendChild(div_reading);
            domClass.add(div_reading, 'hideextra');
            this._storeAttachToDomReference('reading', div_reading);
            
            var row = table.insertRow(-1);
            row.className  = 'CalibrationReadings_row_1';

            var col_statusicon = row.insertCell(-1);
            col_statusicon.className  = 'CalibrationReadings_statusicon_column';
            col_statusicon.colSpan = '1';
            col_statusicon.style['text-align'] = 'center';
            var div_statusicon = domConstruct.create('div');
            col_statusicon.appendChild(div_statusicon);
            domClass.add(div_statusicon, 'hideextra');
            this._storeAttachToDomReference('statusicon', div_statusicon);
            
            var col_status = row.insertCell(-1);
            col_status.className  = 'CalibrationReadings_status_column';
            col_status.colSpan = '3';
            var div_status = domConstruct.create('div');
            col_status.appendChild(div_status);
            domClass.add(div_status, 'hideextra');
            this._storeAttachToDomReference('status', div_status);
            
            var col_statusdesc = row.insertCell(-1);
            col_statusdesc.className  = 'CalibrationReadings_statusdesc_column';
            col_statusdesc.colSpan = '8';
            var div_statusdesc = domConstruct.create('div');
            col_statusdesc.appendChild(div_statusdesc);
            domClass.add(div_statusdesc, 'hideextra');
            this._storeAttachToDomReference('statusdesc', div_statusdesc);
            
            var row = table.insertRow(-1);
            row.className  = 'CalibrationReadings_row_2';

            var col_comment = row.insertCell(-1);
            col_comment.className  = 'CalibrationReadings_comment_column';
            col_comment.colSpan = '12';
            var div_comment = domConstruct.create('div');
            col_comment.appendChild(div_comment);
            domClass.add(div_comment, 'hideextra');
            this._storeAttachToDomReference('comment', div_comment);
            
            var row = table.insertRow(-1);
            row.className  = 'CalibrationReadings_row_2';

            var col_noChangeChk = row.insertCell(-1);
            col_noChangeChk.className  = 'CalibrationReadings_noChangeChk_column';
            col_noChangeChk.colSpan = '12';
            var div_noChangeChk = domConstruct.create('div');
            col_noChangeChk.appendChild(div_noChangeChk);
            domClass.add(div_noChangeChk, 'hideextra');
            this._storeAttachToDomReference('noChangeChk', div_noChangeChk);
            
            this.domNode = table;
         }
      });
});
