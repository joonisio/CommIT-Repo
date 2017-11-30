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
define(   "generated/application/ui/layout/small/CalibrationPointsAnalogRepeatable", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.CalibrationPointsAnalogRepeatable", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout CalibrationPointsAnalog ');

            var row = table.insertRow(-1);
            row.className  = 'CalibrationPointsAnalogRepeatable_row_0';

            var col_count = row.insertCell(-1);
            col_count.className  = 'CalibrationPointsAnalogRepeatable_count_column';
            col_count.colSpan = '4';
            var div_count = domConstruct.create('div');
            col_count.appendChild(div_count);
            domClass.add(div_count, 'hideextra');
            this._storeAttachToDomReference('count', div_count);
            
            var col_point_val = row.insertCell(-1);
            col_point_val.className  = 'CalibrationPointsAnalogRepeatable_point_column';
            col_point_val.colSpan = '4';
            var div_point_val = domConstruct.create('div');
            col_point_val.appendChild(div_point_val);
            domClass.add(div_point_val, 'hideextra');
            this._storeAttachToDomReference('point_val', div_point_val);
            
            var col_description = row.insertCell(-1);
            col_description.className  = 'CalibrationPointsAnalogRepeatable_description_column';
            col_description.colSpan = '4';
            var div_description = domConstruct.create('div');
            col_description.appendChild(div_description);
            domClass.add(div_description, 'hideextra');
            this._storeAttachToDomReference('description', div_description);
            
            var row = table.insertRow(-1);
            row.className  = 'CalibrationPointsAnalogRepeatable_row_1';

            var col_input = row.insertCell(-1);
            col_input.className  = 'CalibrationPointsAnalogRepeatable_input_column';
            col_input.colSpan = '3';
            var div_input = domConstruct.create('div');
            col_input.appendChild(div_input);
            domClass.add(div_input, 'hideextra');
            this._storeAttachToDomReference('input', div_input);
            
            var col_inputunit = row.insertCell(-1);
            col_inputunit.className  = 'CalibrationPointsAnalogRepeatable_inputunit_column';
            col_inputunit.colSpan = '3';
            var div_inputunit = domConstruct.create('div');
            col_inputunit.appendChild(div_inputunit);
            domClass.add(div_inputunit, 'hideextra');
            this._storeAttachToDomReference('inputunit', div_inputunit);
            
            var col_output = row.insertCell(-1);
            col_output.className  = 'CalibrationPointsAnalogRepeatable_output_column';
            col_output.colSpan = '3';
            var div_output = domConstruct.create('div');
            col_output.appendChild(div_output);
            domClass.add(div_output, 'hideextra');
            this._storeAttachToDomReference('output', div_output);
            
            var col_outputunit = row.insertCell(-1);
            col_outputunit.className  = 'CalibrationPointsAnalogRepeatable_outputunit_column';
            col_outputunit.colSpan = '3';
            var div_outputunit = domConstruct.create('div');
            col_outputunit.appendChild(div_outputunit);
            domClass.add(div_outputunit, 'hideextra');
            this._storeAttachToDomReference('outputunit', div_outputunit);
            
            var row = table.insertRow(-1);
            row.className  = 'CalibrationPointsAnalogRepeatable_row_1_val';

            var col_input_val = row.insertCell(-1);
            col_input_val.className  = 'CalibrationPointsAnalogRepeatable_input_column_val';
            col_input_val.colSpan = '3';
            var div_input_val = domConstruct.create('div');
            col_input_val.appendChild(div_input_val);
            domClass.add(div_input_val, 'hideextra');
            this._storeAttachToDomReference('input_val', div_input_val);
            
            var col_inputunit_val = row.insertCell(-1);
            col_inputunit_val.className  = 'CalibrationPointsAnalogRepeatable_inputunit_column_val';
            col_inputunit_val.colSpan = '3';
            var div_inputunit_val = domConstruct.create('div');
            col_inputunit_val.appendChild(div_inputunit_val);
            domClass.add(div_inputunit_val, 'hideextra');
            this._storeAttachToDomReference('inputunit_val', div_inputunit_val);
            
            var col_output_val = row.insertCell(-1);
            col_output_val.className  = 'CalibrationPointsAnalogRepeatable_output_column_val';
            col_output_val.colSpan = '3';
            var div_output_val = domConstruct.create('div');
            col_output_val.appendChild(div_output_val);
            domClass.add(div_output_val, 'hideextra');
            this._storeAttachToDomReference('output_val', div_output_val);
            
            var col_outputunit_val = row.insertCell(-1);
            col_outputunit_val.className  = 'CalibrationPointsAnalogRepeatable_outputunit_column_val';
            col_outputunit_val.colSpan = '3';
            var div_outputunit_val = domConstruct.create('div');
            col_outputunit_val.appendChild(div_outputunit_val);
            domClass.add(div_outputunit_val, 'hideextra');
            this._storeAttachToDomReference('outputunit_val', div_outputunit_val);
            
            var row = table.insertRow(-1);
            row.className  = 'CalibrationPointsAnalogRepeatable_row_2';

            var col_foundinput = row.insertCell(-1);
            col_foundinput.className  = 'CalibrationPointsAnalogRepeatable_foundinput_column';
            col_foundinput.colSpan = '4';
            var div_foundinput = domConstruct.create('div');
            col_foundinput.appendChild(div_foundinput);
            domClass.add(div_foundinput, 'hideextra');
            this._storeAttachToDomReference('foundinput', div_foundinput);
            
            var col_foundoutput_offset = row.insertCell(-1);
            col_foundoutput_offset.colSpan = '2';
            col_foundoutput_offset.className  = 'CalibrationPointsAnalogRepeatable_foundoutput_column';
            var col_foundoutput = row.insertCell(-1);
            col_foundoutput.className  = 'CalibrationPointsAnalogRepeatable_foundoutput_column';
            col_foundoutput.colSpan = '3';
            var div_foundoutput = domConstruct.create('div');
            col_foundoutput.appendChild(div_foundoutput);
            domClass.add(div_foundoutput, 'hideextra');
            this._storeAttachToDomReference('foundoutput', div_foundoutput);
            
            this.domNode = table;
         }
      });
});
