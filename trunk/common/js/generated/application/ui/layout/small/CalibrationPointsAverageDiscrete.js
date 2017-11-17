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
// Build: 2017-11-17 09:13:17
//----------------------------------------------------------------//
define(   "generated/application/ui/layout/small/CalibrationPointsAverageDiscrete", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.CalibrationPointsAverageDiscrete", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout CalibrationPointsAverageDiscrete ');

            var row = table.insertRow(-1);
            row.className  = 'CalibrationPointsAverageDiscrete_row_0';

            var col_cpoint_label = row.insertCell(-1);
            col_cpoint_label.className  = 'CalibrationPointsAverageDiscrete_cpoint_label';
            col_cpoint_label.colSpan = '3';
            var div_cpoint_label = domConstruct.create('div');
            col_cpoint_label.appendChild(div_cpoint_label);
            domClass.add(div_cpoint_label, 'hideextra');
            this._storeAttachToDomReference('cpoint_label', div_cpoint_label);
            
            var col_cpoint = row.insertCell(-1);
            col_cpoint.className  = 'CalibrationPointsAverageDiscrete_cpoint';
            col_cpoint.colSpan = '2';
            var div_cpoint = domConstruct.create('div');
            col_cpoint.appendChild(div_cpoint);
            domClass.add(div_cpoint, 'hideextra');
            this._storeAttachToDomReference('cpoint', div_cpoint);
            
            var col_cpoint_desc = row.insertCell(-1);
            col_cpoint_desc.className  = 'CalibrationPointsAverageDiscrete_cpoint_desc';
            col_cpoint_desc.colSpan = '6';
            var div_cpoint_desc = domConstruct.create('div');
            col_cpoint_desc.appendChild(div_cpoint_desc);
            domClass.add(div_cpoint_desc, 'hideextra');
            this._storeAttachToDomReference('cpoint_desc', div_cpoint_desc);
            
            var col_cpoint_info = row.insertCell(-1);
            col_cpoint_info.className  = 'CalibrationPointsAverageDiscrete_cpoint_info';
            col_cpoint_info.colSpan = '1';
            var div_cpoint_info = domConstruct.create('div');
            col_cpoint_info.appendChild(div_cpoint_info);
            domClass.add(div_cpoint_info, 'hideextra');
            this._storeAttachToDomReference('cpoint_info', div_cpoint_info);
            
            var row = table.insertRow(-1);
            row.className  = 'CalibrationPointsAverageDiscrete_row_1';

            var col_setpoint_label = row.insertCell(-1);
            col_setpoint_label.className  = 'CalibrationPointsAverageDiscrete_setpoint_label';
            col_setpoint_label.colSpan = '4';
            var div_setpoint_label = domConstruct.create('div');
            col_setpoint_label.appendChild(div_setpoint_label);
            domClass.add(div_setpoint_label, 'hideextra');
            this._storeAttachToDomReference('setpoint_label', div_setpoint_label);
            
            var col_avgsetpoint_label = row.insertCell(-1);
            col_avgsetpoint_label.className  = 'CalibrationPointsAverageDiscrete_avgsetpoint_label';
            col_avgsetpoint_label.colSpan = '4';
            var div_avgsetpoint_label = domConstruct.create('div');
            col_avgsetpoint_label.appendChild(div_avgsetpoint_label);
            domClass.add(div_avgsetpoint_label, 'hideextra');
            this._storeAttachToDomReference('avgsetpoint_label', div_avgsetpoint_label);
            
            var col_setpointaction_label = row.insertCell(-1);
            col_setpointaction_label.className  = 'CalibrationPointsAverageDiscrete_setpointaction_label';
            col_setpointaction_label.colSpan = '4';
            var div_setpointaction_label = domConstruct.create('div');
            col_setpointaction_label.appendChild(div_setpointaction_label);
            domClass.add(div_setpointaction_label, 'hideextra');
            this._storeAttachToDomReference('setpointaction_label', div_setpointaction_label);
            
            var row = table.insertRow(-1);
            row.className  = 'CalibrationPointsAverageDiscrete_row_2';

            var col_setpoint = row.insertCell(-1);
            col_setpoint.className  = 'CalibrationPointsAverageDiscrete_setpoint';
            col_setpoint.colSpan = '4';
            var div_setpoint = domConstruct.create('div');
            col_setpoint.appendChild(div_setpoint);
            domClass.add(div_setpoint, 'hideextra');
            this._storeAttachToDomReference('setpoint', div_setpoint);
            
            var col_avgsetpoint = row.insertCell(-1);
            col_avgsetpoint.className  = 'CalibrationPointsAverageDiscrete_avgsetpoint';
            col_avgsetpoint.colSpan = '4';
            var div_avgsetpoint = domConstruct.create('div');
            col_avgsetpoint.appendChild(div_avgsetpoint);
            domClass.add(div_avgsetpoint, 'hideextra');
            this._storeAttachToDomReference('avgsetpoint', div_avgsetpoint);
            
            var col_setpointaction = row.insertCell(-1);
            col_setpointaction.className  = 'CalibrationPointsAverageDiscrete_setpointaction';
            col_setpointaction.colSpan = '4';
            var div_setpointaction = domConstruct.create('div');
            col_setpointaction.appendChild(div_setpointaction);
            domClass.add(div_setpointaction, 'hideextra');
            this._storeAttachToDomReference('setpointaction', div_setpointaction);
            
            var row = table.insertRow(-1);
            row.className  = 'CalibrationPointsAverageDiscrete_row_3';

            var col_statusbtn = row.insertCell(-1);
            col_statusbtn.className  = 'CalibrationPointsAverageDiscrete_statusbtn';
            col_statusbtn.colSpan = '2';
            var div_statusbtn = domConstruct.create('div');
            col_statusbtn.appendChild(div_statusbtn);
            domClass.add(div_statusbtn, 'hideextra');
            this._storeAttachToDomReference('statusbtn', div_statusbtn);
            
            var col_status_label = row.insertCell(-1);
            col_status_label.className  = 'CalibrationPointsAverageDiscrete_status_label';
            col_status_label.colSpan = '8';
            var div_status_label = domConstruct.create('div');
            col_status_label.appendChild(div_status_label);
            domClass.add(div_status_label, 'hideextra');
            this._storeAttachToDomReference('status_label', div_status_label);
            
            var col_asseterror_label = row.insertCell(-1);
            col_asseterror_label.className  = 'CalibrationPointsAverageDiscrete_asseterror_label';
            col_asseterror_label.colSpan = '2';
            var div_asseterror_label = domConstruct.create('div');
            col_asseterror_label.appendChild(div_asseterror_label);
            domClass.add(div_asseterror_label, 'hideextra');
            this._storeAttachToDomReference('asseterror_label', div_asseterror_label);
            
            var row = table.insertRow(-1);
            row.className  = 'CalibrationPointsAverageDiscrete_row_4';

            var col_status = row.insertCell(-1);
            col_status.className  = 'CalibrationPointsAverageDiscrete_status';
            col_status.colSpan = '2';
            var div_status = domConstruct.create('div');
            col_status.appendChild(div_status);
            domClass.add(div_status, 'hideextra');
            this._storeAttachToDomReference('status', div_status);
            
            var col_status_desc = row.insertCell(-1);
            col_status_desc.className  = 'CalibrationPointsAverageDiscrete_status_desc';
            col_status_desc.colSpan = '8';
            var div_status_desc = domConstruct.create('div');
            col_status_desc.appendChild(div_status_desc);
            domClass.add(div_status_desc, 'hideextra');
            this._storeAttachToDomReference('status_desc', div_status_desc);
            
            var col_asseterror = row.insertCell(-1);
            col_asseterror.className  = 'CalibrationPointsAverageDiscrete_asseterror';
            col_asseterror.colSpan = '2';
            var div_asseterror = domConstruct.create('div');
            col_asseterror.appendChild(div_asseterror);
            domClass.add(div_asseterror, 'hideextra');
            this._storeAttachToDomReference('asseterror', div_asseterror);
            
            this.domNode = table;
         }
      });
});
