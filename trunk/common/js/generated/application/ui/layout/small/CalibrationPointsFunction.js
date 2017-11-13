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
// Build: 2017-11-13 09:36:43
//----------------------------------------------------------------//
define(   "generated/application/ui/layout/small/CalibrationPointsFunction", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.CalibrationPointsFunction", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout CalibrationPointsFunction ');

            var row = table.insertRow(-1);
            row.className  = 'CalibrationPointsFunction_row_0';

            var col_point = row.insertCell(-1);
            col_point.className  = 'CalibrationPointsFunction_point_column';
            col_point.colSpan = '4';
            var div_point = domConstruct.create('div');
            col_point.appendChild(div_point);
            domClass.add(div_point, 'hideextra');
            this._storeAttachToDomReference('point', div_point);
            
            var col_function = row.insertCell(-1);
            col_function.className  = 'CalibrationPointsFunction_function_column';
            col_function.colSpan = '5';
            var div_function = domConstruct.create('div');
            col_function.appendChild(div_function);
            domClass.add(div_function, 'hideextra');
            this._storeAttachToDomReference('function', div_function);
            
            var col_point_info = row.insertCell(-1);
            col_point_info.className  = 'CalibrationPointsFunction_point_info';
            col_point_info.colSpan = '1';
            var div_point_info = domConstruct.create('div');
            col_point_info.appendChild(div_point_info);
            domClass.add(div_point_info, 'hideextra');
            this._storeAttachToDomReference('point_info', div_point_info);
            
            var row = table.insertRow(-1);
            row.className  = 'CalibrationPointsFunction_row_1';

            var col_pointdesc = row.insertCell(-1);
            col_pointdesc.className  = 'CalibrationPointsFunction_pointdesc_column';
            col_pointdesc.colSpan = '5';
            var div_pointdesc = domConstruct.create('div');
            col_pointdesc.appendChild(div_pointdesc);
            domClass.add(div_pointdesc, 'hideextra');
            this._storeAttachToDomReference('pointdesc', div_pointdesc);
            
            var col_pass = row.insertCell(-1);
            col_pass.className  = 'CalibrationPointsFunction_pass_column';
            col_pass.colSpan = '3';
            col_pass.style['text-align'] = 'right';
            var div_pass = domConstruct.create('div');
            col_pass.appendChild(div_pass);
            domClass.add(div_pass, 'hideextra');
            this._storeAttachToDomReference('pass', div_pass);
            
            var row = table.insertRow(-1);
            row.className  = 'CalibrationPointsFunction_row_2';

            var col_blank = row.insertCell(-1);
            col_blank.className  = 'CalibrationPointsFunction_blank_column';
            col_blank.colSpan = '5';
            var div_blank = domConstruct.create('div');
            col_blank.appendChild(div_blank);
            domClass.add(div_blank, 'hideextra');
            this._storeAttachToDomReference('blank', div_blank);
            
            var col_fail = row.insertCell(-1);
            col_fail.className  = 'CalibrationPointsFunction_fail_column';
            col_fail.colSpan = '3';
            col_fail.style['text-align'] = 'right';
            var div_fail = domConstruct.create('div');
            col_fail.appendChild(div_fail);
            domClass.add(div_fail, 'hideextra');
            this._storeAttachToDomReference('fail', div_fail);
            
            this.domNode = table;
         }
      });
});
