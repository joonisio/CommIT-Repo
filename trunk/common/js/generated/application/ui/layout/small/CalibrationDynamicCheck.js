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
// Build: 2017-12-05 15:21:16
//----------------------------------------------------------------//
define(   "generated/application/ui/layout/small/CalibrationDynamicCheck", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.CalibrationDynamicCheck", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout CalibrationDynamicCheck ');

            var row = table.insertRow(-1);
            row.className  = 'CalibrationDynamicCheck_row_0';

            var col_point = row.insertCell(-1);
            col_point.className  = 'CalibrationDynamicCheck_dc';
            col_point.colSpan = '4';
            var div_point = domConstruct.create('div');
            col_point.appendChild(div_point);
            domClass.add(div_point, 'hideextra');
            this._storeAttachToDomReference('point', div_point);
            
            var col_function = row.insertCell(-1);
            col_function.className  = 'CalibrationDynamicCheck_af';
            col_function.colSpan = '5';
            var div_function = domConstruct.create('div');
            col_function.appendChild(div_function);
            domClass.add(div_function, 'hideextra');
            this._storeAttachToDomReference('function', div_function);
            
            var col_point_info = row.insertCell(-1);
            col_point_info.className  = 'CalibrationDynamicCheck_point_info';
            col_point_info.colSpan = '1';
            var div_point_info = domConstruct.create('div');
            col_point_info.appendChild(div_point_info);
            domClass.add(div_point_info, 'hideextra');
            this._storeAttachToDomReference('point_info', div_point_info);
            
            var row = table.insertRow(-1);
            row.className  = 'CalibrationDynamicCheck_row_1';

            var col_pointdesc = row.insertCell(-1);
            col_pointdesc.className  = 'CalibrationDynamicCheck_pointdesc1';
            col_pointdesc.colSpan = '5';
            var div_pointdesc = domConstruct.create('div');
            col_pointdesc.appendChild(div_pointdesc);
            domClass.add(div_pointdesc, 'hideextra');
            this._storeAttachToDomReference('pointdesc', div_pointdesc);
            
            var col_asfoundtb = row.insertCell(-1);
            col_asfoundtb.className  = 'CalibrationDynamicCheck_asfoundtb';
            col_asfoundtb.colSpan = '5';
            var div_asfoundtb = domConstruct.create('div');
            col_asfoundtb.appendChild(div_asfoundtb);
            domClass.add(div_asfoundtb, 'hideextra');
            this._storeAttachToDomReference('asfoundtb', div_asfoundtb);
            
            var row = table.insertRow(-1);
            row.className  = 'CalibrationDynamicCheck_row_2';

            var col_lookupunit = row.insertCell(-1);
            col_lookupunit.className  = 'CalibrationDynamicCheck_unitlookup';
            col_lookupunit.colSpan = '10';
            var div_lookupunit = domConstruct.create('div');
            col_lookupunit.appendChild(div_lookupunit);
            domClass.add(div_lookupunit, 'hideextra');
            this._storeAttachToDomReference('lookupunit', div_lookupunit);
            
            this.domNode = table;
         }
      });
});
