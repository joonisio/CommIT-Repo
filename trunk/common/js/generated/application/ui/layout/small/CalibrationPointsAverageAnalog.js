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
define(   "generated/application/ui/layout/small/CalibrationPointsAverageAnalog", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.CalibrationPointsAverageAnalog", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout CalibrationPointsAverageAnalog ');

            var row = table.insertRow(-1);
            row.className  = 'CalibrationPointsAverageAnalog_row_0';

            var col_cpoint_label = row.insertCell(-1);
            col_cpoint_label.className  = 'CalibrationPointsAverageAnalog_cpoint_label';
            col_cpoint_label.colSpan = '3';
            var div_cpoint_label = domConstruct.create('div');
            col_cpoint_label.appendChild(div_cpoint_label);
            domClass.add(div_cpoint_label, 'hideextra');
            this._storeAttachToDomReference('cpoint_label', div_cpoint_label);
            
            var col_cpoint = row.insertCell(-1);
            col_cpoint.className  = 'CalibrationPointsAverageAnalog_cpoint';
            col_cpoint.colSpan = '2';
            var div_cpoint = domConstruct.create('div');
            col_cpoint.appendChild(div_cpoint);
            domClass.add(div_cpoint, 'hideextra');
            this._storeAttachToDomReference('cpoint', div_cpoint);
            
            var col_cpoint_desc = row.insertCell(-1);
            col_cpoint_desc.className  = 'CalibrationPointsAverageAnalog_cpoint_desc';
            col_cpoint_desc.colSpan = '6';
            var div_cpoint_desc = domConstruct.create('div');
            col_cpoint_desc.appendChild(div_cpoint_desc);
            domClass.add(div_cpoint_desc, 'hideextra');
            this._storeAttachToDomReference('cpoint_desc', div_cpoint_desc);
            
            var col_cpoint_info = row.insertCell(-1);
            col_cpoint_info.className  = 'CalibrationPointsAverageAnalog_cpoint_info';
            col_cpoint_info.colSpan = '1';
            var div_cpoint_info = domConstruct.create('div');
            col_cpoint_info.appendChild(div_cpoint_info);
            domClass.add(div_cpoint_info, 'hideextra');
            this._storeAttachToDomReference('cpoint_info', div_cpoint_info);
            
            var row = table.insertRow(-1);
            row.className  = 'CalibrationPointsAverageAnalog_row_1';

            var col_avginput_label = row.insertCell(-1);
            col_avginput_label.className  = 'CalibrationPointsAverageAnalog_avginput_label';
            col_avginput_label.colSpan = '6';
            var div_avginput_label = domConstruct.create('div');
            col_avginput_label.appendChild(div_avginput_label);
            domClass.add(div_avginput_label, 'hideextra');
            this._storeAttachToDomReference('avginput_label', div_avginput_label);
            
            var col_avgoutput_label = row.insertCell(-1);
            col_avgoutput_label.className  = 'CalibrationPointsAverageAnalog_avgoutput_label';
            col_avgoutput_label.colSpan = '6';
            var div_avgoutput_label = domConstruct.create('div');
            col_avgoutput_label.appendChild(div_avgoutput_label);
            domClass.add(div_avgoutput_label, 'hideextra');
            this._storeAttachToDomReference('avgoutput_label', div_avgoutput_label);
            
            var row = table.insertRow(-1);
            row.className  = 'CalibrationPointsAverageAnalog_row_2';

            var col_avginput = row.insertCell(-1);
            col_avginput.className  = 'CalibrationPointsAverageAnalog_avginput';
            col_avginput.colSpan = '6';
            var div_avginput = domConstruct.create('div');
            col_avginput.appendChild(div_avginput);
            domClass.add(div_avginput, 'hideextra');
            this._storeAttachToDomReference('avginput', div_avginput);
            
            var col_avgoutput = row.insertCell(-1);
            col_avgoutput.className  = 'CalibrationPointsAverageAnalog_avgoutput';
            col_avgoutput.colSpan = '6';
            var div_avgoutput = domConstruct.create('div');
            col_avgoutput.appendChild(div_avgoutput);
            domClass.add(div_avgoutput, 'hideextra');
            this._storeAttachToDomReference('avgoutput', div_avgoutput);
            
            var row = table.insertRow(-1);
            row.className  = 'CalibrationPointsAverageAnalog_row_3';

            var col_statusbtn = row.insertCell(-1);
            col_statusbtn.className  = 'CalibrationPointsAverageAnalog_statusbtn';
            col_statusbtn.colSpan = '2';
            var div_statusbtn = domConstruct.create('div');
            col_statusbtn.appendChild(div_statusbtn);
            domClass.add(div_statusbtn, 'hideextra');
            this._storeAttachToDomReference('statusbtn', div_statusbtn);
            
            var col_status_label = row.insertCell(-1);
            col_status_label.className  = 'CalibrationPointsAverageAnalog_status_label';
            col_status_label.colSpan = '8';
            var div_status_label = domConstruct.create('div');
            col_status_label.appendChild(div_status_label);
            domClass.add(div_status_label, 'hideextra');
            this._storeAttachToDomReference('status_label', div_status_label);
            
            var col_asseterror_label = row.insertCell(-1);
            col_asseterror_label.className  = 'CalibrationPointsAverageAnalog_asseterror_label';
            col_asseterror_label.colSpan = '2';
            var div_asseterror_label = domConstruct.create('div');
            col_asseterror_label.appendChild(div_asseterror_label);
            domClass.add(div_asseterror_label, 'hideextra');
            this._storeAttachToDomReference('asseterror_label', div_asseterror_label);
            
            var row = table.insertRow(-1);
            row.className  = 'CalibrationPointsAverageAnalog_row_4';

            var col_status = row.insertCell(-1);
            col_status.className  = 'CalibrationPointsAverageAnalog_status';
            col_status.colSpan = '2';
            var div_status = domConstruct.create('div');
            col_status.appendChild(div_status);
            domClass.add(div_status, 'hideextra');
            this._storeAttachToDomReference('status', div_status);
            
            var col_status_desc = row.insertCell(-1);
            col_status_desc.className  = 'CalibrationPointsAverageAnalog_status_desc';
            col_status_desc.colSpan = '8';
            var div_status_desc = domConstruct.create('div');
            col_status_desc.appendChild(div_status_desc);
            domClass.add(div_status_desc, 'hideextra');
            this._storeAttachToDomReference('status_desc', div_status_desc);
            
            var col_asseterror = row.insertCell(-1);
            col_asseterror.className  = 'CalibrationPointsAverageAnalog_asseterror';
            col_asseterror.colSpan = '2';
            var div_asseterror = domConstruct.create('div');
            col_asseterror.appendChild(div_asseterror);
            domClass.add(div_asseterror, 'hideextra');
            this._storeAttachToDomReference('asseterror', div_asseterror);
            
            this.domNode = table;
         }
      });
});
