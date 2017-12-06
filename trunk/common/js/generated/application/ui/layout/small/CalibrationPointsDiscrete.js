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
// Build: 2017-12-06 10:34:19
//----------------------------------------------------------------//
define(   "generated/application/ui/layout/small/CalibrationPointsDiscrete", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.CalibrationPointsDiscrete", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout CalibrationPointsDiscrete ');

            var row = table.insertRow(-1);
            row.className  = 'CalibrationPointsDiscrete_row_0';

            var col_point = row.insertCell(-1);
            col_point.className  = 'CalibrationPointsDiscrete_point_column';
            col_point.colSpan = '2';
            var div_point = domConstruct.create('div');
            col_point.appendChild(div_point);
            domClass.add(div_point, 'hideextra');
            this._storeAttachToDomReference('point', div_point);
            
            var col_description = row.insertCell(-1);
            col_description.className  = 'CalibrationPointsDiscrete_description_column';
            col_description.colSpan = '9';
            var div_description = domConstruct.create('div');
            col_description.appendChild(div_description);
            domClass.add(div_description, 'hideextra');
            this._storeAttachToDomReference('description', div_description);
            
            var col_point_info = row.insertCell(-1);
            col_point_info.className  = 'CalibrationPointsDiscrete_point_info';
            col_point_info.colSpan = '1';
            var div_point_info = domConstruct.create('div');
            col_point_info.appendChild(div_point_info);
            domClass.add(div_point_info, 'hideextra');
            this._storeAttachToDomReference('point_info', div_point_info);
            
            var row = table.insertRow(-1);
            row.className  = 'CalibrationPointsDiscrete_row_1';

            var col_nominal = row.insertCell(-1);
            col_nominal.className  = 'CalibrationPointsDiscrete_nominal_column';
            col_nominal.colSpan = '3';
            var div_nominal = domConstruct.create('div');
            col_nominal.appendChild(div_nominal);
            domClass.add(div_nominal, 'hideextra');
            this._storeAttachToDomReference('nominal', div_nominal);
            
            var col_nomunit = row.insertCell(-1);
            col_nomunit.className  = 'CalibrationPointsDiscrete_nomunit_column';
            col_nomunit.colSpan = '3';
            var div_nomunit = domConstruct.create('div');
            col_nomunit.appendChild(div_nomunit);
            domClass.add(div_nomunit, 'hideextra');
            this._storeAttachToDomReference('nomunit', div_nomunit);
            
            var col_setpoint = row.insertCell(-1);
            col_setpoint.className  = 'CalibrationPointsDiscrete_setpoint_column';
            col_setpoint.colSpan = '3';
            var div_setpoint = domConstruct.create('div');
            col_setpoint.appendChild(div_setpoint);
            domClass.add(div_setpoint, 'hideextra');
            this._storeAttachToDomReference('setpoint', div_setpoint);
            
            var col_action = row.insertCell(-1);
            col_action.className  = 'CalibrationPointsDiscrete_action_column';
            col_action.colSpan = '3';
            var div_action = domConstruct.create('div');
            col_action.appendChild(div_action);
            domClass.add(div_action, 'hideextra');
            this._storeAttachToDomReference('action', div_action);
            
            var row = table.insertRow(-1);
            row.className  = 'CalibrationPointsDiscrete_row_3';

            var col_statusBtn = row.insertCell(-1);
            col_statusBtn.className  = 'CalibrationPointsDiscrete_statusBtn_column';
            col_statusBtn.colSpan = '1';
            col_statusBtn.style['text-align'] = 'center';
            var div_statusBtn = domConstruct.create('div');
            col_statusBtn.appendChild(div_statusBtn);
            domClass.add(div_statusBtn, 'hideextra');
            this._storeAttachToDomReference('statusBtn', div_statusBtn);
            
            var col_status = row.insertCell(-1);
            col_status.className  = 'CalibrationPointsDiscrete_status_column';
            col_status.colSpan = '1';
            var div_status = domConstruct.create('div');
            col_status.appendChild(div_status);
            domClass.add(div_status, 'hideextra');
            this._storeAttachToDomReference('status', div_status);
            
            var col_statusdesc = row.insertCell(-1);
            col_statusdesc.className  = 'CalibrationPointsDiscrete_statusdesc_column';
            col_statusdesc.colSpan = '4';
            var div_statusdesc = domConstruct.create('div');
            col_statusdesc.appendChild(div_statusdesc);
            domClass.add(div_statusdesc, 'hideextra');
            this._storeAttachToDomReference('statusdesc', div_statusdesc);
            
            var col_error = row.insertCell(-1);
            col_error.className  = 'CalibrationPointsDiscrete_error_column';
            col_error.colSpan = '2';
            var div_error = domConstruct.create('div');
            col_error.appendChild(div_error);
            domClass.add(div_error, 'hideextra');
            this._storeAttachToDomReference('error', div_error);
            
            var col_assetunit = row.insertCell(-1);
            col_assetunit.className  = 'CalibrationPointsDiscrete_asset_unit';
            col_assetunit.colSpan = '4';
            var div_assetunit = domConstruct.create('div');
            col_assetunit.appendChild(div_assetunit);
            domClass.add(div_assetunit, 'hideextra');
            this._storeAttachToDomReference('assetunit', div_assetunit);
            
            this.domNode = table;
         }
      });
});
