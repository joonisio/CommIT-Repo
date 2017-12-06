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
// Build: 2017-12-06 10:34:20
//----------------------------------------------------------------//
define(   "generated/application/ui/layout/small/DataSheetList", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/_LayoutWidgetBase", 
         "dojo/_base/array", 
         "dojo/dom-construct", 
         "dojo/dom-class"
      ],

function(declare, _LayoutWidgetBase, array, domConstruct, domClass) {
      return declare("generated.application.ui.layout.small.DataSheetList", _LayoutWidgetBase, {

         buildRendering : function() {
            this.inherited(arguments);

            var table = domConstruct.create('table', {role:'presentation'} );
            table.style.width = '100%';
            domClass.add(table, 'layout DataSheetList ');

            var row = table.insertRow(-1);
            row.className  = 'DataSheetList_row_0';

            var col_plannum = row.insertCell(-1);
            col_plannum.className  = 'DataSheetList_plannum_column';
            col_plannum.colSpan = '3';
            var div_plannum = domConstruct.create('div');
            col_plannum.appendChild(div_plannum);
            domClass.add(div_plannum, 'hideextra');
            this._storeAttachToDomReference('plannum', div_plannum);
            
            var col_desc = row.insertCell(-1);
            col_desc.className  = 'DataSheetList_desc_column';
            col_desc.colSpan = '6';
            var div_desc = domConstruct.create('div');
            col_desc.appendChild(div_desc);
            domClass.add(div_desc, 'hideextra');
            this._storeAttachToDomReference('desc', div_desc);
            
            var col_required = row.insertCell(-1);
            col_required.className  = 'DataSheetList_required_column';
            col_required.colSpan = '3';
            col_required.style['text-align'] = 'center';
            var div_required = domConstruct.create('div');
            col_required.appendChild(div_required);
            domClass.add(div_required, 'hideextra');
            this._storeAttachToDomReference('required', div_required);
            
            var row = table.insertRow(-1);
            row.className  = 'DataSheetList_row_1';

            var col_ficon = row.insertCell(-1);
            col_ficon.className  = 'DataSheetList_ficon_column';
            col_ficon.colSpan = '1';
            col_ficon.style['text-align'] = 'center';
            var div_ficon = domConstruct.create('div');
            col_ficon.appendChild(div_ficon);
            domClass.add(div_ficon, 'hideextra');
            this._storeAttachToDomReference('ficon', div_ficon);
            
            var col_fstatus = row.insertCell(-1);
            col_fstatus.className  = 'DataSheetList_fstatus_column';
            col_fstatus.colSpan = '3';
            col_fstatus.style['text-align'] = 'left';
            var div_fstatus = domConstruct.create('div');
            col_fstatus.appendChild(div_fstatus);
            domClass.add(div_fstatus, 'hideextra');
            this._storeAttachToDomReference('fstatus', div_fstatus);
            
            var col_fstatusdesc = row.insertCell(-1);
            col_fstatusdesc.className  = 'DataSheetList_fstatusdesc_column';
            col_fstatusdesc.colSpan = '8';
            var div_fstatusdesc = domConstruct.create('div');
            col_fstatusdesc.appendChild(div_fstatusdesc);
            domClass.add(div_fstatusdesc, 'hideextra');
            this._storeAttachToDomReference('fstatusdesc', div_fstatusdesc);
            
            var row = table.insertRow(-1);
            row.className  = 'DataSheetList_row_2';

            var col_licon = row.insertCell(-1);
            col_licon.className  = 'DataSheetList_licon_column';
            col_licon.colSpan = '1';
            col_licon.style['text-align'] = 'center';
            var div_licon = domConstruct.create('div');
            col_licon.appendChild(div_licon);
            domClass.add(div_licon, 'hideextra');
            this._storeAttachToDomReference('licon', div_licon);
            
            var col_lstatus = row.insertCell(-1);
            col_lstatus.className  = 'DataSheetList_lstatus_column';
            col_lstatus.colSpan = '3';
            col_lstatus.style['text-align'] = 'left';
            var div_lstatus = domConstruct.create('div');
            col_lstatus.appendChild(div_lstatus);
            domClass.add(div_lstatus, 'hideextra');
            this._storeAttachToDomReference('lstatus', div_lstatus);
            
            var col_lstatusdesc = row.insertCell(-1);
            col_lstatusdesc.className  = 'DataSheetList_lstatusdesc_column';
            col_lstatusdesc.colSpan = '8';
            var div_lstatusdesc = domConstruct.create('div');
            col_lstatusdesc.appendChild(div_lstatusdesc);
            domClass.add(div_lstatusdesc, 'hideextra');
            this._storeAttachToDomReference('lstatusdesc', div_lstatusdesc);
            
            this.domNode = table;
         }
      });
});
