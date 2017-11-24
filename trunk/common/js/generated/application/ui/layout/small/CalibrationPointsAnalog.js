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
// Build: 2017-11-23 18:08:48
//----------------------------------------------------------------//
define(   "generated/application/ui/layout/small/CalibrationPointsAnalog", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.CalibrationPointsAnalog", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout CalibrationPointsAnalog ');

            var row = table.insertRow(-1);
            row.className  = 'CalibrationPointsAnalog_row_0';

            var col_point = row.insertCell(-1);
            col_point.className  = 'CalibrationPointsAnalog_point_column';
            col_point.colSpan = '2';
            var div_point = domConstruct.create('div');
            col_point.appendChild(div_point);
            domClass.add(div_point, 'hideextra');
            this._storeAttachToDomReference('point', div_point);
            
            var col_description = row.insertCell(-1);
            col_description.className  = 'CalibrationPointsAnalog_description_column';
            col_description.colSpan = '9';
            col_description.style['vertical-align'] = 'bottom';
            var div_description = domConstruct.create('div');
            col_description.appendChild(div_description);
            domClass.add(div_description, 'hideextra');
            this._storeAttachToDomReference('description', div_description);
            
            var col_point_info = row.insertCell(-1);
            col_point_info.className  = 'CalibrationPointsAnalog_point_info';
            col_point_info.colSpan = '1';
            var div_point_info = domConstruct.create('div');
            col_point_info.appendChild(div_point_info);
            domClass.add(div_point_info, 'hideextra');
            this._storeAttachToDomReference('point_info', div_point_info);
            
            var row = table.insertRow(-1);
            row.className  = 'CalibrationPointsAnalog_row_0_val';

            var col_point_val = row.insertCell(-1);
            col_point_val.className  = 'CalibrationPointsAnalog_point_column';
            col_point_val.colSpan = '2';
            var div_point_val = domConstruct.create('div');
            col_point_val.appendChild(div_point_val);
            domClass.add(div_point_val, 'hideextra');
            this._storeAttachToDomReference('point_val', div_point_val);
            
            var row = table.insertRow(-1);
            row.className  = 'CalibrationPointsAnalog_row_1';

            var col_input = row.insertCell(-1);
            col_input.className  = 'CalibrationPointsAnalog_input_column';
            col_input.colSpan = '3';
            var div_input = domConstruct.create('div');
            col_input.appendChild(div_input);
            domClass.add(div_input, 'hideextra');
            this._storeAttachToDomReference('input', div_input);
            
            var col_inputunit = row.insertCell(-1);
            col_inputunit.className  = 'CalibrationPointsAnalog_inputunit_column';
            col_inputunit.colSpan = '3';
            var div_inputunit = domConstruct.create('div');
            col_inputunit.appendChild(div_inputunit);
            domClass.add(div_inputunit, 'hideextra');
            this._storeAttachToDomReference('inputunit', div_inputunit);
            
            var col_output = row.insertCell(-1);
            col_output.className  = 'CalibrationPointsAnalog_output_column';
            col_output.colSpan = '3';
            var div_output = domConstruct.create('div');
            col_output.appendChild(div_output);
            domClass.add(div_output, 'hideextra');
            this._storeAttachToDomReference('output', div_output);
            
            var col_outputunit = row.insertCell(-1);
            col_outputunit.className  = 'CalibrationPointsAnalog_outputunit_column';
            col_outputunit.colSpan = '3';
            var div_outputunit = domConstruct.create('div');
            col_outputunit.appendChild(div_outputunit);
            domClass.add(div_outputunit, 'hideextra');
            this._storeAttachToDomReference('outputunit', div_outputunit);
            
            var row = table.insertRow(-1);
            row.className  = 'CalibrationPointsAnalog_row_1_val';

            var col_input_val = row.insertCell(-1);
            col_input_val.className  = 'CalibrationPointsAnalog_input_column_val';
            col_input_val.colSpan = '3';
            var div_input_val = domConstruct.create('div');
            col_input_val.appendChild(div_input_val);
            domClass.add(div_input_val, 'hideextra');
            this._storeAttachToDomReference('input_val', div_input_val);
            
            var col_inputunit_val = row.insertCell(-1);
            col_inputunit_val.className  = 'CalibrationPointsAnalog_inputunit_column_val';
            col_inputunit_val.colSpan = '3';
            var div_inputunit_val = domConstruct.create('div');
            col_inputunit_val.appendChild(div_inputunit_val);
            domClass.add(div_inputunit_val, 'hideextra');
            this._storeAttachToDomReference('inputunit_val', div_inputunit_val);
            
            var col_output_val = row.insertCell(-1);
            col_output_val.className  = 'CalibrationPointsAnalog_output_column_val';
            col_output_val.colSpan = '3';
            var div_output_val = domConstruct.create('div');
            col_output_val.appendChild(div_output_val);
            domClass.add(div_output_val, 'hideextra');
            this._storeAttachToDomReference('output_val', div_output_val);
            
            var col_outputunit_val = row.insertCell(-1);
            col_outputunit_val.className  = 'CalibrationPointsAnalog_outputunit_column_val';
            col_outputunit_val.colSpan = '3';
            var div_outputunit_val = domConstruct.create('div');
            col_outputunit_val.appendChild(div_outputunit_val);
            domClass.add(div_outputunit_val, 'hideextra');
            this._storeAttachToDomReference('outputunit_val', div_outputunit_val);
            
            var row = table.insertRow(-1);
            row.className  = 'CalibrationPointsAnalog_row_2';

            var col_foundinput = row.insertCell(-1);
            col_foundinput.className  = 'CalibrationPointsAnalog_foundinput_column';
            col_foundinput.colSpan = '4';
            var div_foundinput = domConstruct.create('div');
            col_foundinput.appendChild(div_foundinput);
            domClass.add(div_foundinput, 'hideextra');
            this._storeAttachToDomReference('foundinput', div_foundinput);
            
            var col_foundoutput_offset = row.insertCell(-1);
            col_foundoutput_offset.colSpan = '2';
            col_foundoutput_offset.className  = 'CalibrationPointsAnalog_foundoutput_column';
            var col_foundoutput = row.insertCell(-1);
            col_foundoutput.className  = 'CalibrationPointsAnalog_foundoutput_column';
            col_foundoutput.colSpan = '3';
            var div_foundoutput = domConstruct.create('div');
            col_foundoutput.appendChild(div_foundoutput);
            domClass.add(div_foundoutput, 'hideextra');
            this._storeAttachToDomReference('foundoutput', div_foundoutput);
            
            var row = table.insertRow(-1);
            row.className  = 'CalibrationPointsAnalog_row_3';

            var col_statusBtn = row.insertCell(-1);
            col_statusBtn.className  = 'CalibrationPointsAnalog_statusBtn_column';
            col_statusBtn.colSpan = '1';
            col_statusBtn.style['text-align'] = 'center';
            var div_statusBtn = domConstruct.create('div');
            col_statusBtn.appendChild(div_statusBtn);
            domClass.add(div_statusBtn, 'hideextra');
            this._storeAttachToDomReference('statusBtn', div_statusBtn);
            
            var col_status = row.insertCell(-1);
            col_status.className  = 'CalibrationPointsAnalog_status_column';
            col_status.colSpan = '1';
            var div_status = domConstruct.create('div');
            col_status.appendChild(div_status);
            domClass.add(div_status, 'hideextra');
            this._storeAttachToDomReference('status', div_status);
            
            var col_statusdesc = row.insertCell(-1);
            col_statusdesc.className  = 'CalibrationPointsAnalog_statusdesc_column';
            col_statusdesc.colSpan = '4';
            col_statusdesc.style['vertical-align'] = 'bottom';
            var div_statusdesc = domConstruct.create('div');
            col_statusdesc.appendChild(div_statusdesc);
            domClass.add(div_statusdesc, 'hideextra');
            this._storeAttachToDomReference('statusdesc', div_statusdesc);
            
            var col_error = row.insertCell(-1);
            col_error.className  = 'CalibrationPointsAnalog_error_column';
            col_error.colSpan = '2';
            var div_error = domConstruct.create('div');
            col_error.appendChild(div_error);
            domClass.add(div_error, 'hideextra');
            this._storeAttachToDomReference('error', div_error);
            
            var col_assetunit = row.insertCell(-1);
            col_assetunit.className  = 'CalibrationPointsAnalog_asset_unit';
            col_assetunit.colSpan = '3';
            var div_assetunit = domConstruct.create('div');
            col_assetunit.appendChild(div_assetunit);
            domClass.add(div_assetunit, 'hideextra');
            this._storeAttachToDomReference('assetunit', div_assetunit);
            
            var row = table.insertRow(-1);
            row.className  = 'CalibrationPointsAnalog_row_3_val';

            var col_statusBtn_val = row.insertCell(-1);
            col_statusBtn_val.className  = 'CalibrationPointsAnalog_statusBtn_column_val';
            col_statusBtn_val.colSpan = '1';
            col_statusBtn_val.style['text-align'] = 'center';
            var div_statusBtn_val = domConstruct.create('div');
            col_statusBtn_val.appendChild(div_statusBtn_val);
            domClass.add(div_statusBtn_val, 'hideextra');
            this._storeAttachToDomReference('statusBtn_val', div_statusBtn_val);
            
            var col_status_val = row.insertCell(-1);
            col_status_val.className  = 'CalibrationPointsAnalog_status_column_val';
            col_status_val.colSpan = '1';
            var div_status_val = domConstruct.create('div');
            col_status_val.appendChild(div_status_val);
            domClass.add(div_status_val, 'hideextra');
            this._storeAttachToDomReference('status_val', div_status_val);
            
            var col_statusdesc_val = row.insertCell(-1);
            col_statusdesc_val.className  = 'CalibrationPointsAnalog_statusdesc_column_val';
            col_statusdesc_val.colSpan = '4';
            col_statusdesc_val.style['vertical-align'] = 'bottom';
            var div_statusdesc_val = domConstruct.create('div');
            col_statusdesc_val.appendChild(div_statusdesc_val);
            domClass.add(div_statusdesc_val, 'hideextra');
            this._storeAttachToDomReference('statusdesc_val', div_statusdesc_val);
            
            var col_error_val = row.insertCell(-1);
            col_error_val.className  = 'CalibrationPointsAnalog_error_column_val';
            col_error_val.colSpan = '2';
            var div_error_val = domConstruct.create('div');
            col_error_val.appendChild(div_error_val);
            domClass.add(div_error_val, 'hideextra');
            this._storeAttachToDomReference('error_val', div_error_val);
            
            var col_assetunit_val = row.insertCell(-1);
            col_assetunit_val.className  = 'CalibrationPointsAnalog_asset_unit_val';
            col_assetunit_val.colSpan = '3';
            var div_assetunit_val = domConstruct.create('div');
            col_assetunit_val.appendChild(div_assetunit_val);
            domClass.add(div_assetunit_val, 'hideextra');
            this._storeAttachToDomReference('assetunit_val', div_assetunit_val);
            
            this.domNode = table;
         }
      });
});
