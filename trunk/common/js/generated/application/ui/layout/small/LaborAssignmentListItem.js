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
// Build: 2017-12-05 15:21:17
//----------------------------------------------------------------//
define(   "generated/application/ui/layout/small/LaborAssignmentListItem", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.LaborAssignmentListItem", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout LaborAssignmentListItem ');

            var row = table.insertRow(-1);
            row.className  = 'LaborAssignmentListItem_row_0';

            var col_item1 = row.insertCell(-1);
            col_item1.className  = 'LaborAssignmentListItem_item1_column';
            var div_item1 = domConstruct.create('div');
            col_item1.appendChild(div_item1);
            domClass.add(div_item1, 'hideextra');
            this._storeAttachToDomReference('item1', div_item1);
            
            var row = table.insertRow(-1);
            row.className  = 'LaborAssignmentListItem_row_1';

            var col_item2 = row.insertCell(-1);
            col_item2.className  = 'LaborAssignmentListItem_item2_column';
            col_item2.colSpan = '12';
            var div_item2 = domConstruct.create('div');
            col_item2.appendChild(div_item2);
            domClass.add(div_item2, 'hideextra');
            this._storeAttachToDomReference('item2', div_item2);
            
            var row = table.insertRow(-1);
            row.className  = 'LaborAssignmentListItem_row_2';

            var col_item3 = row.insertCell(-1);
            col_item3.className  = 'LaborAssignmentListItem_item3_column';
            col_item3.colSpan = '12';
            var div_item3 = domConstruct.create('div');
            col_item3.appendChild(div_item3);
            domClass.add(div_item3, 'hideextra');
            this._storeAttachToDomReference('item3', div_item3);
            
            var row = table.insertRow(-1);
            row.className  = 'LaborAssignmentListItem_row_3';

            var col_item4 = row.insertCell(-1);
            col_item4.className  = 'LaborAssignmentListItem_item4_column';
            col_item4.colSpan = '12';
            var div_item4 = domConstruct.create('div');
            col_item4.appendChild(div_item4);
            domClass.add(div_item4, 'hideextra');
            this._storeAttachToDomReference('item4', div_item4);
            
            var row = table.insertRow(-1);
            row.className  = 'LaborAssignmentListItem_row_4';

            var col_item5 = row.insertCell(-1);
            col_item5.className  = 'LaborAssignmentListItem_item5_column';
            col_item5.colSpan = '12';
            var div_item5 = domConstruct.create('div');
            col_item5.appendChild(div_item5);
            domClass.add(div_item5, 'hideextra');
            this._storeAttachToDomReference('item5', div_item5);
            
            this.domNode = table;
         }
      });
});
