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
define(   "generated/application/ui/layout/small/CalibrationPointsDiscreteRepeatable", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.CalibrationPointsDiscreteRepeatable", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout CalibrationPointsDiscrete ');

            var row = table.insertRow(-1);
            row.className  = 'CalibrationPointsDiscreteRepeatable_row_0';

            var col_count = row.insertCell(-1);
            col_count.className  = 'CalibrationPointsDiscreteRepeatable_count_column';
            col_count.colSpan = '4';
            var div_count = domConstruct.create('div');
            col_count.appendChild(div_count);
            domClass.add(div_count, 'hideextra');
            this._storeAttachToDomReference('count', div_count);
            
            var col_point = row.insertCell(-1);
            col_point.className  = 'CalibrationPointsDiscreteRepeatable_point_column';
            col_point.colSpan = '4';
            var div_point = domConstruct.create('div');
            col_point.appendChild(div_point);
            domClass.add(div_point, 'hideextra');
            this._storeAttachToDomReference('point', div_point);
            
            var col_description = row.insertCell(-1);
            col_description.className  = 'CalibrationPointsDiscreteRepeatable_description_column';
            col_description.colSpan = '4';
            var div_description = domConstruct.create('div');
            col_description.appendChild(div_description);
            domClass.add(div_description, 'hideextra');
            this._storeAttachToDomReference('description', div_description);
            
            var row = table.insertRow(-1);
            row.className  = 'CalibrationPointsDiscreteRepeatable_row_1';

            var col_nominal = row.insertCell(-1);
            col_nominal.className  = 'CalibrationPointsDiscreteRepeatable_nominal_column';
            col_nominal.colSpan = '3';
            var div_nominal = domConstruct.create('div');
            col_nominal.appendChild(div_nominal);
            domClass.add(div_nominal, 'hideextra');
            this._storeAttachToDomReference('nominal', div_nominal);
            
            var col_nomunit = row.insertCell(-1);
            col_nomunit.className  = 'CalibrationPointsDiscreteRepeatable_nomunit_column';
            col_nomunit.colSpan = '3';
            var div_nomunit = domConstruct.create('div');
            col_nomunit.appendChild(div_nomunit);
            domClass.add(div_nomunit, 'hideextra');
            this._storeAttachToDomReference('nomunit', div_nomunit);
            
            var col_setpoint = row.insertCell(-1);
            col_setpoint.className  = 'CalibrationPointsDiscreteRepeatable_setpoint_column';
            col_setpoint.colSpan = '3';
            var div_setpoint = domConstruct.create('div');
            col_setpoint.appendChild(div_setpoint);
            domClass.add(div_setpoint, 'hideextra');
            this._storeAttachToDomReference('setpoint', div_setpoint);
            
            var col_action = row.insertCell(-1);
            col_action.className  = 'CalibrationPointsDiscreteRepeatable_action_column';
            col_action.colSpan = '3';
            var div_action = domConstruct.create('div');
            col_action.appendChild(div_action);
            domClass.add(div_action, 'hideextra');
            this._storeAttachToDomReference('action', div_action);
            
            this.domNode = table;
         }
      });
});
