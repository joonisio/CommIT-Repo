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
// Build: 2017-11-23 18:08:50
//----------------------------------------------------------------//
define(   "generated/application/ui/layout/LayoutFactory", 
      [
         "dojo/_base/declare", 
         "platform/ui/layout/LayoutUtil", 
         "platform/ui/DeviceEnv", 
         "generated/application/ui/layout/small/Button1Item1", 
         "generated/application/ui/layout/small/Button2", 
         "generated/application/ui/layout/small/CenteredBottom2Buttons", 
         "generated/application/ui/layout/small/DirectionsListItem", 
         "generated/application/ui/layout/small/Item1Button1", 
         "generated/application/ui/layout/small/Item1Button2list", 
         "generated/application/ui/layout/small/Item1Count1Button1", 
         "generated/application/ui/layout/small/Item1Count1Button2", 
         "generated/application/ui/layout/small/Item1Desc1", 
         "generated/application/ui/layout/small/Item2", 
         "generated/application/ui/layout/small/Item2Desc2", 
         "generated/application/ui/layout/small/Item2SideBySide", 
         "generated/application/ui/layout/small/landscape/MapDetail", 
         "generated/application/ui/layout/small/landscape/MapView", 
         "generated/application/ui/layout/small/ListHeader", 
         "generated/application/ui/layout/small/ListHeaderWithSearch", 
         "generated/application/ui/layout/small/ListItem3Input1", 
         "generated/application/ui/layout/small/ListItem5Button1", 
         "generated/application/ui/layout/small/ListItem6Button1", 
         "generated/application/ui/layout/small/MapEndPoint", 
         "generated/application/ui/layout/small/NotificationList", 
         "generated/application/ui/layout/small/portrait/MapDetail", 
         "generated/application/ui/layout/small/portrait/MapView", 
         "generated/application/ui/layout/small/ScanHeader", 
         "generated/application/ui/layout/small/WorkListItem", 
         "generated/application/ui/layout/small/ActualLaborListItem", 
         "generated/application/ui/layout/small/ActualMaterialListItem", 
         "generated/application/ui/layout/small/ActualToolListItem", 
         "generated/application/ui/layout/small/AssetFunctionDetailsLayout", 
         "generated/application/ui/layout/small/AssetFunctions", 
         "generated/application/ui/layout/small/AssetFunctionToleranceLayout", 
         "generated/application/ui/layout/small/AttachmentsListItem", 
         "generated/application/ui/layout/small/CalibrationDynamicCheck", 
         "generated/application/ui/layout/small/CalibrationItem3", 
         "generated/application/ui/layout/small/CalibrationItem3Justify", 
         "generated/application/ui/layout/small/CalibrationItem4", 
         "generated/application/ui/layout/small/CalibrationPointsAnalog", 
         "generated/application/ui/layout/small/CalibrationPointsAnalogRepeatable", 
         "generated/application/ui/layout/small/CalibrationPointsAverageAnalog", 
         "generated/application/ui/layout/small/CalibrationPointsAverageDiscrete", 
         "generated/application/ui/layout/small/CalibrationPointsDiscrete", 
         "generated/application/ui/layout/small/CalibrationPointsDiscreteRepeatable", 
         "generated/application/ui/layout/small/CalibrationPointsFunction", 
         "generated/application/ui/layout/small/CalibrationRange", 
         "generated/application/ui/layout/small/CalibrationReadings", 
         "generated/application/ui/layout/small/CalibrationTolError", 
         "generated/application/ui/layout/small/CopyPlansListItem", 
         "generated/application/ui/layout/small/CrewLaborList", 
         "generated/application/ui/layout/small/CrewToolList", 
         "generated/application/ui/layout/small/DataSheetList", 
         "generated/application/ui/layout/small/DataSheetStatus", 
         "generated/application/ui/layout/small/FailureReportList", 
         "generated/application/ui/layout/small/FeatureAttributesList", 
         "generated/application/ui/layout/small/IdentifyFeaturesList", 
         "generated/application/ui/layout/small/ItemLookup", 
         "generated/application/ui/layout/small/KeyValueFormLayout", 
         "generated/application/ui/layout/small/LaborAssignmentListItem", 
         "generated/application/ui/layout/small/LaborCraftRateLookupItem", 
         "generated/application/ui/layout/small/MapOfflineAreaList", 
         "generated/application/ui/layout/small/MaterialToolList", 
         "generated/application/ui/layout/small/MeterList", 
         "generated/application/ui/layout/small/MultiAssetListItem", 
         "generated/application/ui/layout/small/PlannedMaterialListItem", 
         "generated/application/ui/layout/small/PlannedToolListItem", 
         "generated/application/ui/layout/small/Progress", 
         "generated/application/ui/layout/small/ServiceAddressLookup", 
         "generated/application/ui/layout/small/VendorNameAddressListItem", 
         "generated/application/ui/layout/small/WorkLogListItem"
      ],

function(declare, LayoutUtil, DeviceEnv, small_Button1Item1, small_Button2, small_CenteredBottom2Buttons, small_DirectionsListItem, small_Item1Button1, small_Item1Button2list, small_Item1Count1Button1, small_Item1Count1Button2, small_Item1Desc1, small_Item2, small_Item2Desc2, small_Item2SideBySide, small_landscape_MapDetail, small_landscape_MapView, small_ListHeader, small_ListHeaderWithSearch, small_ListItem3Input1, small_ListItem5Button1, small_ListItem6Button1, small_MapEndPoint, small_NotificationList, small_portrait_MapDetail, small_portrait_MapView, small_ScanHeader, small_WorkListItem, small_ActualLaborListItem, small_ActualMaterialListItem, small_ActualToolListItem, small_AssetFunctionDetailsLayout, small_AssetFunctions, small_AssetFunctionToleranceLayout, small_AttachmentsListItem, small_CalibrationDynamicCheck, small_CalibrationItem3, small_CalibrationItem3Justify, small_CalibrationItem4, small_CalibrationPointsAnalog, small_CalibrationPointsAnalogRepeatable, small_CalibrationPointsAverageAnalog, small_CalibrationPointsAverageDiscrete, small_CalibrationPointsDiscrete, small_CalibrationPointsDiscreteRepeatable, small_CalibrationPointsFunction, small_CalibrationRange, small_CalibrationReadings, small_CalibrationTolError, small_CopyPlansListItem, small_CrewLaborList, small_CrewToolList, small_DataSheetList, small_DataSheetStatus, small_FailureReportList, small_FeatureAttributesList, small_IdentifyFeaturesList, small_ItemLookup, small_KeyValueFormLayout, small_LaborAssignmentListItem, small_LaborCraftRateLookupItem, small_MapOfflineAreaList, small_MaterialToolList, small_MeterList, small_MultiAssetListItem, small_PlannedMaterialListItem, small_PlannedToolListItem, small_Progress, small_ServiceAddressLookup, small_VendorNameAddressListItem, small_WorkLogListItem) {
      return declare("generated.application.ui.layout.LayoutFactory", [ ], {


         //
         // AUTO-GENERATED FILE CREATED ON: 2017-11-23 18:08:50
         //

         constructor : function(widget) {

            // TODO: get the screen width, height, size, orientation
            var node = widget?widget.domNode:null;
            this.layoutSize = DeviceEnv.getLayoutSize(node);
            var layoutUtil = new LayoutUtil(widget && widget.application?widget.application:null);
            this.screenOrientation = layoutUtil.getOrientation();

            this.layoutMap = {};
            // 
            // SMALL.PORTRAIT
            // 
            this.layoutMap['small.portrait'] = {};
            this.layoutMap['small.portrait']['DataSheetStatus'] = 'generated.application.ui.layout.small.DataSheetStatus';
            this.layoutMap['small.portrait']['ListItem5Button1'] = 'generated.application.ui.layout.small.ListItem5Button1';
            this.layoutMap['small.portrait']['Item1Button1'] = 'generated.application.ui.layout.small.Item1Button1';
            this.layoutMap['small.portrait']['ListItem6Button1'] = 'generated.application.ui.layout.small.ListItem6Button1';
            this.layoutMap['small.portrait']['LaborAssignmentListItem'] = 'generated.application.ui.layout.small.LaborAssignmentListItem';
            this.layoutMap['small.portrait']['KeyValueFormLayout'] = 'generated.application.ui.layout.small.KeyValueFormLayout';
            this.layoutMap['small.portrait']['Button2'] = 'generated.application.ui.layout.small.Button2';
            this.layoutMap['small.portrait']['CalibrationPointsAnalogRepeatable'] = 'generated.application.ui.layout.small.CalibrationPointsAnalogRepeatable';
            this.layoutMap['small.portrait']['FeatureAttributesList'] = 'generated.application.ui.layout.small.FeatureAttributesList';
            this.layoutMap['small.portrait']['CalibrationDynamicCheck'] = 'generated.application.ui.layout.small.CalibrationDynamicCheck';
            this.layoutMap['small.portrait']['CalibrationTolError'] = 'generated.application.ui.layout.small.CalibrationTolError';
            this.layoutMap['small.portrait']['Item2SideBySide'] = 'generated.application.ui.layout.small.Item2SideBySide';
            this.layoutMap['small.portrait']['CalibrationReadings'] = 'generated.application.ui.layout.small.CalibrationReadings';
            this.layoutMap['small.portrait']['Item1Count1Button1'] = 'generated.application.ui.layout.small.Item1Count1Button1';
            this.layoutMap['small.portrait']['CalibrationPointsDiscrete'] = 'generated.application.ui.layout.small.CalibrationPointsDiscrete';
            this.layoutMap['small.portrait']['Item2'] = 'generated.application.ui.layout.small.Item2';
            this.layoutMap['small.portrait']['MeterList'] = 'generated.application.ui.layout.small.MeterList';
            this.layoutMap['small.portrait']['CalibrationPointsAverageDiscrete'] = 'generated.application.ui.layout.small.CalibrationPointsAverageDiscrete';
            this.layoutMap['small.portrait']['CalibrationRange'] = 'generated.application.ui.layout.small.CalibrationRange';
            this.layoutMap['small.portrait']['ActualLaborListItem'] = 'generated.application.ui.layout.small.ActualLaborListItem';
            this.layoutMap['small.portrait']['CalibrationPointsFunction'] = 'generated.application.ui.layout.small.CalibrationPointsFunction';
            this.layoutMap['small.portrait']['DirectionsListItem'] = 'generated.application.ui.layout.small.DirectionsListItem';
            this.layoutMap['small.portrait']['CrewToolList'] = 'generated.application.ui.layout.small.CrewToolList';
            this.layoutMap['small.portrait']['VendorNameAddressListItem'] = 'generated.application.ui.layout.small.VendorNameAddressListItem';
            this.layoutMap['small.portrait']['ItemLookup'] = 'generated.application.ui.layout.small.ItemLookup';
            this.layoutMap['small.portrait']['AssetFunctionDetailsLayout'] = 'generated.application.ui.layout.small.AssetFunctionDetailsLayout';
            this.layoutMap['small.portrait']['CalibrationItem3Justify'] = 'generated.application.ui.layout.small.CalibrationItem3Justify';
            this.layoutMap['small.portrait']['Button1Item1'] = 'generated.application.ui.layout.small.Button1Item1';
            this.layoutMap['small.portrait']['Item1Count1Button2'] = 'generated.application.ui.layout.small.Item1Count1Button2';
            this.layoutMap['small.portrait']['WorkLogListItem'] = 'generated.application.ui.layout.small.WorkLogListItem';
            this.layoutMap['small.portrait']['CalibrationPointsAnalog'] = 'generated.application.ui.layout.small.CalibrationPointsAnalog';
            this.layoutMap['small.portrait']['AssetFunctionToleranceLayout'] = 'generated.application.ui.layout.small.AssetFunctionToleranceLayout';
            this.layoutMap['small.portrait']['PlannedMaterialListItem'] = 'generated.application.ui.layout.small.PlannedMaterialListItem';
            this.layoutMap['small.portrait']['WorkListItem'] = 'generated.application.ui.layout.small.WorkListItem';
            this.layoutMap['small.portrait']['CalibrationPointsAverageAnalog'] = 'generated.application.ui.layout.small.CalibrationPointsAverageAnalog';
            this.layoutMap['small.portrait']['FailureReportList'] = 'generated.application.ui.layout.small.FailureReportList';
            this.layoutMap['small.portrait']['MapView'] = 'generated.application.ui.layout.small.portrait.MapView';
            this.layoutMap['small.portrait']['ListHeader'] = 'generated.application.ui.layout.small.ListHeader';
            this.layoutMap['small.portrait']['Item1Button2list'] = 'generated.application.ui.layout.small.Item1Button2list';
            this.layoutMap['small.portrait']['AssetFunctions'] = 'generated.application.ui.layout.small.AssetFunctions';
            this.layoutMap['small.portrait']['CalibrationPointsDiscreteRepeatable'] = 'generated.application.ui.layout.small.CalibrationPointsDiscreteRepeatable';
            this.layoutMap['small.portrait']['CopyPlansListItem'] = 'generated.application.ui.layout.small.CopyPlansListItem';
            this.layoutMap['small.portrait']['MapOfflineAreaList'] = 'generated.application.ui.layout.small.MapOfflineAreaList';
            this.layoutMap['small.portrait']['Item1Desc1'] = 'generated.application.ui.layout.small.Item1Desc1';
            this.layoutMap['small.portrait']['AttachmentsListItem'] = 'generated.application.ui.layout.small.AttachmentsListItem';
            this.layoutMap['small.portrait']['IdentifyFeaturesList'] = 'generated.application.ui.layout.small.IdentifyFeaturesList';
            this.layoutMap['small.portrait']['MapDetail'] = 'generated.application.ui.layout.small.portrait.MapDetail';
            this.layoutMap['small.portrait']['ActualMaterialListItem'] = 'generated.application.ui.layout.small.ActualMaterialListItem';
            this.layoutMap['small.portrait']['MapEndPoint'] = 'generated.application.ui.layout.small.MapEndPoint';
            this.layoutMap['small.portrait']['PlannedToolListItem'] = 'generated.application.ui.layout.small.PlannedToolListItem';
            this.layoutMap['small.portrait']['ListHeaderWithSearch'] = 'generated.application.ui.layout.small.ListHeaderWithSearch';
            this.layoutMap['small.portrait']['CrewLaborList'] = 'generated.application.ui.layout.small.CrewLaborList';
            this.layoutMap['small.portrait']['DataSheetList'] = 'generated.application.ui.layout.small.DataSheetList';
            this.layoutMap['small.portrait']['ScanHeader'] = 'generated.application.ui.layout.small.ScanHeader';
            this.layoutMap['small.portrait']['CenteredBottom2Buttons'] = 'generated.application.ui.layout.small.CenteredBottom2Buttons';
            this.layoutMap['small.portrait']['CalibrationItem4'] = 'generated.application.ui.layout.small.CalibrationItem4';
            this.layoutMap['small.portrait']['CalibrationItem3'] = 'generated.application.ui.layout.small.CalibrationItem3';
            this.layoutMap['small.portrait']['Progress'] = 'generated.application.ui.layout.small.Progress';
            this.layoutMap['small.portrait']['MultiAssetListItem'] = 'generated.application.ui.layout.small.MultiAssetListItem';
            this.layoutMap['small.portrait']['NotificationList'] = 'generated.application.ui.layout.small.NotificationList';
            this.layoutMap['small.portrait']['MaterialToolList'] = 'generated.application.ui.layout.small.MaterialToolList';
            this.layoutMap['small.portrait']['ActualToolListItem'] = 'generated.application.ui.layout.small.ActualToolListItem';
            this.layoutMap['small.portrait']['Item2Desc2'] = 'generated.application.ui.layout.small.Item2Desc2';
            this.layoutMap['small.portrait']['ListItem3Input1'] = 'generated.application.ui.layout.small.ListItem3Input1';
            this.layoutMap['small.portrait']['LaborCraftRateLookupItem'] = 'generated.application.ui.layout.small.LaborCraftRateLookupItem';
            this.layoutMap['small.portrait']['ServiceAddressLookup'] = 'generated.application.ui.layout.small.ServiceAddressLookup';

            // 
            // SMALL.LANDSCAPE
            // 
            this.layoutMap['small.landscape'] = {};
            this.layoutMap['small.landscape']['DataSheetStatus'] = 'generated.application.ui.layout.small.DataSheetStatus';
            this.layoutMap['small.landscape']['ListItem5Button1'] = 'generated.application.ui.layout.small.ListItem5Button1';
            this.layoutMap['small.landscape']['Item1Button1'] = 'generated.application.ui.layout.small.Item1Button1';
            this.layoutMap['small.landscape']['ListItem6Button1'] = 'generated.application.ui.layout.small.ListItem6Button1';
            this.layoutMap['small.landscape']['LaborAssignmentListItem'] = 'generated.application.ui.layout.small.LaborAssignmentListItem';
            this.layoutMap['small.landscape']['KeyValueFormLayout'] = 'generated.application.ui.layout.small.KeyValueFormLayout';
            this.layoutMap['small.landscape']['Button2'] = 'generated.application.ui.layout.small.Button2';
            this.layoutMap['small.landscape']['CalibrationPointsAnalogRepeatable'] = 'generated.application.ui.layout.small.CalibrationPointsAnalogRepeatable';
            this.layoutMap['small.landscape']['FeatureAttributesList'] = 'generated.application.ui.layout.small.FeatureAttributesList';
            this.layoutMap['small.landscape']['CalibrationDynamicCheck'] = 'generated.application.ui.layout.small.CalibrationDynamicCheck';
            this.layoutMap['small.landscape']['CalibrationTolError'] = 'generated.application.ui.layout.small.CalibrationTolError';
            this.layoutMap['small.landscape']['Item2SideBySide'] = 'generated.application.ui.layout.small.Item2SideBySide';
            this.layoutMap['small.landscape']['CalibrationReadings'] = 'generated.application.ui.layout.small.CalibrationReadings';
            this.layoutMap['small.landscape']['Item1Count1Button1'] = 'generated.application.ui.layout.small.Item1Count1Button1';
            this.layoutMap['small.landscape']['CalibrationPointsDiscrete'] = 'generated.application.ui.layout.small.CalibrationPointsDiscrete';
            this.layoutMap['small.landscape']['Item2'] = 'generated.application.ui.layout.small.Item2';
            this.layoutMap['small.landscape']['MeterList'] = 'generated.application.ui.layout.small.MeterList';
            this.layoutMap['small.landscape']['CalibrationPointsAverageDiscrete'] = 'generated.application.ui.layout.small.CalibrationPointsAverageDiscrete';
            this.layoutMap['small.landscape']['CalibrationRange'] = 'generated.application.ui.layout.small.CalibrationRange';
            this.layoutMap['small.landscape']['ActualLaborListItem'] = 'generated.application.ui.layout.small.ActualLaborListItem';
            this.layoutMap['small.landscape']['CalibrationPointsFunction'] = 'generated.application.ui.layout.small.CalibrationPointsFunction';
            this.layoutMap['small.landscape']['DirectionsListItem'] = 'generated.application.ui.layout.small.DirectionsListItem';
            this.layoutMap['small.landscape']['CrewToolList'] = 'generated.application.ui.layout.small.CrewToolList';
            this.layoutMap['small.landscape']['VendorNameAddressListItem'] = 'generated.application.ui.layout.small.VendorNameAddressListItem';
            this.layoutMap['small.landscape']['ItemLookup'] = 'generated.application.ui.layout.small.ItemLookup';
            this.layoutMap['small.landscape']['AssetFunctionDetailsLayout'] = 'generated.application.ui.layout.small.AssetFunctionDetailsLayout';
            this.layoutMap['small.landscape']['CalibrationItem3Justify'] = 'generated.application.ui.layout.small.CalibrationItem3Justify';
            this.layoutMap['small.landscape']['Button1Item1'] = 'generated.application.ui.layout.small.Button1Item1';
            this.layoutMap['small.landscape']['Item1Count1Button2'] = 'generated.application.ui.layout.small.Item1Count1Button2';
            this.layoutMap['small.landscape']['WorkLogListItem'] = 'generated.application.ui.layout.small.WorkLogListItem';
            this.layoutMap['small.landscape']['CalibrationPointsAnalog'] = 'generated.application.ui.layout.small.CalibrationPointsAnalog';
            this.layoutMap['small.landscape']['AssetFunctionToleranceLayout'] = 'generated.application.ui.layout.small.AssetFunctionToleranceLayout';
            this.layoutMap['small.landscape']['PlannedMaterialListItem'] = 'generated.application.ui.layout.small.PlannedMaterialListItem';
            this.layoutMap['small.landscape']['WorkListItem'] = 'generated.application.ui.layout.small.WorkListItem';
            this.layoutMap['small.landscape']['CalibrationPointsAverageAnalog'] = 'generated.application.ui.layout.small.CalibrationPointsAverageAnalog';
            this.layoutMap['small.landscape']['FailureReportList'] = 'generated.application.ui.layout.small.FailureReportList';
            this.layoutMap['small.landscape']['MapView'] = 'generated.application.ui.layout.small.landscape.MapView';
            this.layoutMap['small.landscape']['ListHeader'] = 'generated.application.ui.layout.small.ListHeader';
            this.layoutMap['small.landscape']['Item1Button2list'] = 'generated.application.ui.layout.small.Item1Button2list';
            this.layoutMap['small.landscape']['AssetFunctions'] = 'generated.application.ui.layout.small.AssetFunctions';
            this.layoutMap['small.landscape']['CalibrationPointsDiscreteRepeatable'] = 'generated.application.ui.layout.small.CalibrationPointsDiscreteRepeatable';
            this.layoutMap['small.landscape']['CopyPlansListItem'] = 'generated.application.ui.layout.small.CopyPlansListItem';
            this.layoutMap['small.landscape']['MapOfflineAreaList'] = 'generated.application.ui.layout.small.MapOfflineAreaList';
            this.layoutMap['small.landscape']['Item1Desc1'] = 'generated.application.ui.layout.small.Item1Desc1';
            this.layoutMap['small.landscape']['AttachmentsListItem'] = 'generated.application.ui.layout.small.AttachmentsListItem';
            this.layoutMap['small.landscape']['IdentifyFeaturesList'] = 'generated.application.ui.layout.small.IdentifyFeaturesList';
            this.layoutMap['small.landscape']['MapDetail'] = 'generated.application.ui.layout.small.landscape.MapDetail';
            this.layoutMap['small.landscape']['ActualMaterialListItem'] = 'generated.application.ui.layout.small.ActualMaterialListItem';
            this.layoutMap['small.landscape']['MapEndPoint'] = 'generated.application.ui.layout.small.MapEndPoint';
            this.layoutMap['small.landscape']['PlannedToolListItem'] = 'generated.application.ui.layout.small.PlannedToolListItem';
            this.layoutMap['small.landscape']['ListHeaderWithSearch'] = 'generated.application.ui.layout.small.ListHeaderWithSearch';
            this.layoutMap['small.landscape']['CrewLaborList'] = 'generated.application.ui.layout.small.CrewLaborList';
            this.layoutMap['small.landscape']['DataSheetList'] = 'generated.application.ui.layout.small.DataSheetList';
            this.layoutMap['small.landscape']['ScanHeader'] = 'generated.application.ui.layout.small.ScanHeader';
            this.layoutMap['small.landscape']['CenteredBottom2Buttons'] = 'generated.application.ui.layout.small.CenteredBottom2Buttons';
            this.layoutMap['small.landscape']['CalibrationItem4'] = 'generated.application.ui.layout.small.CalibrationItem4';
            this.layoutMap['small.landscape']['CalibrationItem3'] = 'generated.application.ui.layout.small.CalibrationItem3';
            this.layoutMap['small.landscape']['Progress'] = 'generated.application.ui.layout.small.Progress';
            this.layoutMap['small.landscape']['MultiAssetListItem'] = 'generated.application.ui.layout.small.MultiAssetListItem';
            this.layoutMap['small.landscape']['NotificationList'] = 'generated.application.ui.layout.small.NotificationList';
            this.layoutMap['small.landscape']['MaterialToolList'] = 'generated.application.ui.layout.small.MaterialToolList';
            this.layoutMap['small.landscape']['ActualToolListItem'] = 'generated.application.ui.layout.small.ActualToolListItem';
            this.layoutMap['small.landscape']['Item2Desc2'] = 'generated.application.ui.layout.small.Item2Desc2';
            this.layoutMap['small.landscape']['ListItem3Input1'] = 'generated.application.ui.layout.small.ListItem3Input1';
            this.layoutMap['small.landscape']['LaborCraftRateLookupItem'] = 'generated.application.ui.layout.small.LaborCraftRateLookupItem';
            this.layoutMap['small.landscape']['ServiceAddressLookup'] = 'generated.application.ui.layout.small.ServiceAddressLookup';

            if (this.layoutSize == 'small') {
               dojo.require('generated.application.ui.layout.small.DataSheetStatus');
               dojo.require('generated.application.ui.layout.small.ListItem5Button1');
               dojo.require('generated.application.ui.layout.small.Item1Button1');
               dojo.require('generated.application.ui.layout.small.ListItem6Button1');
               dojo.require('generated.application.ui.layout.small.LaborAssignmentListItem');
               dojo.require('generated.application.ui.layout.small.KeyValueFormLayout');
               dojo.require('generated.application.ui.layout.small.Button2');
               dojo.require('generated.application.ui.layout.small.CalibrationPointsAnalogRepeatable');
               dojo.require('generated.application.ui.layout.small.FeatureAttributesList');
               dojo.require('generated.application.ui.layout.small.CalibrationDynamicCheck');
               dojo.require('generated.application.ui.layout.small.CalibrationTolError');
               dojo.require('generated.application.ui.layout.small.Item2SideBySide');
               dojo.require('generated.application.ui.layout.small.CalibrationReadings');
               dojo.require('generated.application.ui.layout.small.Item1Count1Button1');
               dojo.require('generated.application.ui.layout.small.CalibrationPointsDiscrete');
               dojo.require('generated.application.ui.layout.small.Item2');
               dojo.require('generated.application.ui.layout.small.MeterList');
               dojo.require('generated.application.ui.layout.small.CalibrationPointsAverageDiscrete');
               dojo.require('generated.application.ui.layout.small.CalibrationRange');
               dojo.require('generated.application.ui.layout.small.ActualLaborListItem');
               dojo.require('generated.application.ui.layout.small.CalibrationPointsFunction');
               dojo.require('generated.application.ui.layout.small.DirectionsListItem');
               dojo.require('generated.application.ui.layout.small.CrewToolList');
               dojo.require('generated.application.ui.layout.small.VendorNameAddressListItem');
               dojo.require('generated.application.ui.layout.small.ItemLookup');
               dojo.require('generated.application.ui.layout.small.AssetFunctionDetailsLayout');
               dojo.require('generated.application.ui.layout.small.CalibrationItem3Justify');
               dojo.require('generated.application.ui.layout.small.Button1Item1');
               dojo.require('generated.application.ui.layout.small.Item1Count1Button2');
               dojo.require('generated.application.ui.layout.small.WorkLogListItem');
               dojo.require('generated.application.ui.layout.small.CalibrationPointsAnalog');
               dojo.require('generated.application.ui.layout.small.AssetFunctionToleranceLayout');
               dojo.require('generated.application.ui.layout.small.PlannedMaterialListItem');
               dojo.require('generated.application.ui.layout.small.WorkListItem');
               dojo.require('generated.application.ui.layout.small.CalibrationPointsAverageAnalog');
               dojo.require('generated.application.ui.layout.small.FailureReportList');
               dojo.require('generated.application.ui.layout.small.portrait.MapView');
               dojo.require('generated.application.ui.layout.small.ListHeader');
               dojo.require('generated.application.ui.layout.small.Item1Button2list');
               dojo.require('generated.application.ui.layout.small.AssetFunctions');
               dojo.require('generated.application.ui.layout.small.CalibrationPointsDiscreteRepeatable');
               dojo.require('generated.application.ui.layout.small.CopyPlansListItem');
               dojo.require('generated.application.ui.layout.small.MapOfflineAreaList');
               dojo.require('generated.application.ui.layout.small.Item1Desc1');
               dojo.require('generated.application.ui.layout.small.AttachmentsListItem');
               dojo.require('generated.application.ui.layout.small.IdentifyFeaturesList');
               dojo.require('generated.application.ui.layout.small.portrait.MapDetail');
               dojo.require('generated.application.ui.layout.small.ActualMaterialListItem');
               dojo.require('generated.application.ui.layout.small.MapEndPoint');
               dojo.require('generated.application.ui.layout.small.PlannedToolListItem');
               dojo.require('generated.application.ui.layout.small.ListHeaderWithSearch');
               dojo.require('generated.application.ui.layout.small.CrewLaborList');
               dojo.require('generated.application.ui.layout.small.DataSheetList');
               dojo.require('generated.application.ui.layout.small.ScanHeader');
               dojo.require('generated.application.ui.layout.small.CenteredBottom2Buttons');
               dojo.require('generated.application.ui.layout.small.CalibrationItem4');
               dojo.require('generated.application.ui.layout.small.CalibrationItem3');
               dojo.require('generated.application.ui.layout.small.Progress');
               dojo.require('generated.application.ui.layout.small.MultiAssetListItem');
               dojo.require('generated.application.ui.layout.small.NotificationList');
               dojo.require('generated.application.ui.layout.small.MaterialToolList');
               dojo.require('generated.application.ui.layout.small.ActualToolListItem');
               dojo.require('generated.application.ui.layout.small.Item2Desc2');
               dojo.require('generated.application.ui.layout.small.ListItem3Input1');
               dojo.require('generated.application.ui.layout.small.LaborCraftRateLookupItem');
               dojo.require('generated.application.ui.layout.small.ServiceAddressLookup');
               dojo.require('generated.application.ui.layout.small.landscape.MapView');
               dojo.require('generated.application.ui.layout.small.landscape.MapDetail');
            }

            // 
            // MEDIUM.PORTRAIT
            // 
            this.layoutMap['medium.portrait'] = {};
            this.layoutMap['medium.portrait']['DataSheetStatus'] = 'generated.application.ui.layout.small.DataSheetStatus';
            this.layoutMap['medium.portrait']['ListItem5Button1'] = 'generated.application.ui.layout.small.ListItem5Button1';
            this.layoutMap['medium.portrait']['Item1Button1'] = 'generated.application.ui.layout.small.Item1Button1';
            this.layoutMap['medium.portrait']['ListItem6Button1'] = 'generated.application.ui.layout.small.ListItem6Button1';
            this.layoutMap['medium.portrait']['LaborAssignmentListItem'] = 'generated.application.ui.layout.small.LaborAssignmentListItem';
            this.layoutMap['medium.portrait']['KeyValueFormLayout'] = 'generated.application.ui.layout.small.KeyValueFormLayout';
            this.layoutMap['medium.portrait']['Button2'] = 'generated.application.ui.layout.small.Button2';
            this.layoutMap['medium.portrait']['CalibrationPointsAnalogRepeatable'] = 'generated.application.ui.layout.small.CalibrationPointsAnalogRepeatable';
            this.layoutMap['medium.portrait']['FeatureAttributesList'] = 'generated.application.ui.layout.small.FeatureAttributesList';
            this.layoutMap['medium.portrait']['CalibrationDynamicCheck'] = 'generated.application.ui.layout.small.CalibrationDynamicCheck';
            this.layoutMap['medium.portrait']['CalibrationTolError'] = 'generated.application.ui.layout.small.CalibrationTolError';
            this.layoutMap['medium.portrait']['Item2SideBySide'] = 'generated.application.ui.layout.small.Item2SideBySide';
            this.layoutMap['medium.portrait']['CalibrationReadings'] = 'generated.application.ui.layout.small.CalibrationReadings';
            this.layoutMap['medium.portrait']['Item1Count1Button1'] = 'generated.application.ui.layout.small.Item1Count1Button1';
            this.layoutMap['medium.portrait']['CalibrationPointsDiscrete'] = 'generated.application.ui.layout.small.CalibrationPointsDiscrete';
            this.layoutMap['medium.portrait']['Item2'] = 'generated.application.ui.layout.small.Item2';
            this.layoutMap['medium.portrait']['MeterList'] = 'generated.application.ui.layout.small.MeterList';
            this.layoutMap['medium.portrait']['CalibrationPointsAverageDiscrete'] = 'generated.application.ui.layout.small.CalibrationPointsAverageDiscrete';
            this.layoutMap['medium.portrait']['CalibrationRange'] = 'generated.application.ui.layout.small.CalibrationRange';
            this.layoutMap['medium.portrait']['ActualLaborListItem'] = 'generated.application.ui.layout.small.ActualLaborListItem';
            this.layoutMap['medium.portrait']['CalibrationPointsFunction'] = 'generated.application.ui.layout.small.CalibrationPointsFunction';
            this.layoutMap['medium.portrait']['DirectionsListItem'] = 'generated.application.ui.layout.small.DirectionsListItem';
            this.layoutMap['medium.portrait']['CrewToolList'] = 'generated.application.ui.layout.small.CrewToolList';
            this.layoutMap['medium.portrait']['VendorNameAddressListItem'] = 'generated.application.ui.layout.small.VendorNameAddressListItem';
            this.layoutMap['medium.portrait']['ItemLookup'] = 'generated.application.ui.layout.small.ItemLookup';
            this.layoutMap['medium.portrait']['AssetFunctionDetailsLayout'] = 'generated.application.ui.layout.small.AssetFunctionDetailsLayout';
            this.layoutMap['medium.portrait']['CalibrationItem3Justify'] = 'generated.application.ui.layout.small.CalibrationItem3Justify';
            this.layoutMap['medium.portrait']['Button1Item1'] = 'generated.application.ui.layout.small.Button1Item1';
            this.layoutMap['medium.portrait']['Item1Count1Button2'] = 'generated.application.ui.layout.small.Item1Count1Button2';
            this.layoutMap['medium.portrait']['WorkLogListItem'] = 'generated.application.ui.layout.small.WorkLogListItem';
            this.layoutMap['medium.portrait']['CalibrationPointsAnalog'] = 'generated.application.ui.layout.small.CalibrationPointsAnalog';
            this.layoutMap['medium.portrait']['AssetFunctionToleranceLayout'] = 'generated.application.ui.layout.small.AssetFunctionToleranceLayout';
            this.layoutMap['medium.portrait']['PlannedMaterialListItem'] = 'generated.application.ui.layout.small.PlannedMaterialListItem';
            this.layoutMap['medium.portrait']['WorkListItem'] = 'generated.application.ui.layout.small.WorkListItem';
            this.layoutMap['medium.portrait']['CalibrationPointsAverageAnalog'] = 'generated.application.ui.layout.small.CalibrationPointsAverageAnalog';
            this.layoutMap['medium.portrait']['FailureReportList'] = 'generated.application.ui.layout.small.FailureReportList';
            this.layoutMap['medium.portrait']['MapView'] = 'generated.application.ui.layout.small.portrait.MapView';
            this.layoutMap['medium.portrait']['ListHeader'] = 'generated.application.ui.layout.small.ListHeader';
            this.layoutMap['medium.portrait']['Item1Button2list'] = 'generated.application.ui.layout.small.Item1Button2list';
            this.layoutMap['medium.portrait']['AssetFunctions'] = 'generated.application.ui.layout.small.AssetFunctions';
            this.layoutMap['medium.portrait']['CalibrationPointsDiscreteRepeatable'] = 'generated.application.ui.layout.small.CalibrationPointsDiscreteRepeatable';
            this.layoutMap['medium.portrait']['CopyPlansListItem'] = 'generated.application.ui.layout.small.CopyPlansListItem';
            this.layoutMap['medium.portrait']['MapOfflineAreaList'] = 'generated.application.ui.layout.small.MapOfflineAreaList';
            this.layoutMap['medium.portrait']['Item1Desc1'] = 'generated.application.ui.layout.small.Item1Desc1';
            this.layoutMap['medium.portrait']['AttachmentsListItem'] = 'generated.application.ui.layout.small.AttachmentsListItem';
            this.layoutMap['medium.portrait']['IdentifyFeaturesList'] = 'generated.application.ui.layout.small.IdentifyFeaturesList';
            this.layoutMap['medium.portrait']['MapDetail'] = 'generated.application.ui.layout.small.portrait.MapDetail';
            this.layoutMap['medium.portrait']['ActualMaterialListItem'] = 'generated.application.ui.layout.small.ActualMaterialListItem';
            this.layoutMap['medium.portrait']['MapEndPoint'] = 'generated.application.ui.layout.small.MapEndPoint';
            this.layoutMap['medium.portrait']['PlannedToolListItem'] = 'generated.application.ui.layout.small.PlannedToolListItem';
            this.layoutMap['medium.portrait']['ListHeaderWithSearch'] = 'generated.application.ui.layout.small.ListHeaderWithSearch';
            this.layoutMap['medium.portrait']['CrewLaborList'] = 'generated.application.ui.layout.small.CrewLaborList';
            this.layoutMap['medium.portrait']['DataSheetList'] = 'generated.application.ui.layout.small.DataSheetList';
            this.layoutMap['medium.portrait']['ScanHeader'] = 'generated.application.ui.layout.small.ScanHeader';
            this.layoutMap['medium.portrait']['CenteredBottom2Buttons'] = 'generated.application.ui.layout.small.CenteredBottom2Buttons';
            this.layoutMap['medium.portrait']['CalibrationItem4'] = 'generated.application.ui.layout.small.CalibrationItem4';
            this.layoutMap['medium.portrait']['CalibrationItem3'] = 'generated.application.ui.layout.small.CalibrationItem3';
            this.layoutMap['medium.portrait']['Progress'] = 'generated.application.ui.layout.small.Progress';
            this.layoutMap['medium.portrait']['MultiAssetListItem'] = 'generated.application.ui.layout.small.MultiAssetListItem';
            this.layoutMap['medium.portrait']['NotificationList'] = 'generated.application.ui.layout.small.NotificationList';
            this.layoutMap['medium.portrait']['MaterialToolList'] = 'generated.application.ui.layout.small.MaterialToolList';
            this.layoutMap['medium.portrait']['ActualToolListItem'] = 'generated.application.ui.layout.small.ActualToolListItem';
            this.layoutMap['medium.portrait']['Item2Desc2'] = 'generated.application.ui.layout.small.Item2Desc2';
            this.layoutMap['medium.portrait']['ListItem3Input1'] = 'generated.application.ui.layout.small.ListItem3Input1';
            this.layoutMap['medium.portrait']['LaborCraftRateLookupItem'] = 'generated.application.ui.layout.small.LaborCraftRateLookupItem';
            this.layoutMap['medium.portrait']['ServiceAddressLookup'] = 'generated.application.ui.layout.small.ServiceAddressLookup';

            // 
            // MEDIUM.LANDSCAPE
            // 
            this.layoutMap['medium.landscape'] = {};
            this.layoutMap['medium.landscape']['DataSheetStatus'] = 'generated.application.ui.layout.small.DataSheetStatus';
            this.layoutMap['medium.landscape']['ListItem5Button1'] = 'generated.application.ui.layout.small.ListItem5Button1';
            this.layoutMap['medium.landscape']['Item1Button1'] = 'generated.application.ui.layout.small.Item1Button1';
            this.layoutMap['medium.landscape']['ListItem6Button1'] = 'generated.application.ui.layout.small.ListItem6Button1';
            this.layoutMap['medium.landscape']['LaborAssignmentListItem'] = 'generated.application.ui.layout.small.LaborAssignmentListItem';
            this.layoutMap['medium.landscape']['KeyValueFormLayout'] = 'generated.application.ui.layout.small.KeyValueFormLayout';
            this.layoutMap['medium.landscape']['Button2'] = 'generated.application.ui.layout.small.Button2';
            this.layoutMap['medium.landscape']['CalibrationPointsAnalogRepeatable'] = 'generated.application.ui.layout.small.CalibrationPointsAnalogRepeatable';
            this.layoutMap['medium.landscape']['FeatureAttributesList'] = 'generated.application.ui.layout.small.FeatureAttributesList';
            this.layoutMap['medium.landscape']['CalibrationDynamicCheck'] = 'generated.application.ui.layout.small.CalibrationDynamicCheck';
            this.layoutMap['medium.landscape']['CalibrationTolError'] = 'generated.application.ui.layout.small.CalibrationTolError';
            this.layoutMap['medium.landscape']['Item2SideBySide'] = 'generated.application.ui.layout.small.Item2SideBySide';
            this.layoutMap['medium.landscape']['CalibrationReadings'] = 'generated.application.ui.layout.small.CalibrationReadings';
            this.layoutMap['medium.landscape']['Item1Count1Button1'] = 'generated.application.ui.layout.small.Item1Count1Button1';
            this.layoutMap['medium.landscape']['CalibrationPointsDiscrete'] = 'generated.application.ui.layout.small.CalibrationPointsDiscrete';
            this.layoutMap['medium.landscape']['Item2'] = 'generated.application.ui.layout.small.Item2';
            this.layoutMap['medium.landscape']['MeterList'] = 'generated.application.ui.layout.small.MeterList';
            this.layoutMap['medium.landscape']['CalibrationPointsAverageDiscrete'] = 'generated.application.ui.layout.small.CalibrationPointsAverageDiscrete';
            this.layoutMap['medium.landscape']['CalibrationRange'] = 'generated.application.ui.layout.small.CalibrationRange';
            this.layoutMap['medium.landscape']['ActualLaborListItem'] = 'generated.application.ui.layout.small.ActualLaborListItem';
            this.layoutMap['medium.landscape']['CalibrationPointsFunction'] = 'generated.application.ui.layout.small.CalibrationPointsFunction';
            this.layoutMap['medium.landscape']['DirectionsListItem'] = 'generated.application.ui.layout.small.DirectionsListItem';
            this.layoutMap['medium.landscape']['CrewToolList'] = 'generated.application.ui.layout.small.CrewToolList';
            this.layoutMap['medium.landscape']['VendorNameAddressListItem'] = 'generated.application.ui.layout.small.VendorNameAddressListItem';
            this.layoutMap['medium.landscape']['ItemLookup'] = 'generated.application.ui.layout.small.ItemLookup';
            this.layoutMap['medium.landscape']['AssetFunctionDetailsLayout'] = 'generated.application.ui.layout.small.AssetFunctionDetailsLayout';
            this.layoutMap['medium.landscape']['CalibrationItem3Justify'] = 'generated.application.ui.layout.small.CalibrationItem3Justify';
            this.layoutMap['medium.landscape']['Button1Item1'] = 'generated.application.ui.layout.small.Button1Item1';
            this.layoutMap['medium.landscape']['Item1Count1Button2'] = 'generated.application.ui.layout.small.Item1Count1Button2';
            this.layoutMap['medium.landscape']['WorkLogListItem'] = 'generated.application.ui.layout.small.WorkLogListItem';
            this.layoutMap['medium.landscape']['CalibrationPointsAnalog'] = 'generated.application.ui.layout.small.CalibrationPointsAnalog';
            this.layoutMap['medium.landscape']['AssetFunctionToleranceLayout'] = 'generated.application.ui.layout.small.AssetFunctionToleranceLayout';
            this.layoutMap['medium.landscape']['PlannedMaterialListItem'] = 'generated.application.ui.layout.small.PlannedMaterialListItem';
            this.layoutMap['medium.landscape']['WorkListItem'] = 'generated.application.ui.layout.small.WorkListItem';
            this.layoutMap['medium.landscape']['CalibrationPointsAverageAnalog'] = 'generated.application.ui.layout.small.CalibrationPointsAverageAnalog';
            this.layoutMap['medium.landscape']['FailureReportList'] = 'generated.application.ui.layout.small.FailureReportList';
            this.layoutMap['medium.landscape']['MapView'] = 'generated.application.ui.layout.small.landscape.MapView';
            this.layoutMap['medium.landscape']['ListHeader'] = 'generated.application.ui.layout.small.ListHeader';
            this.layoutMap['medium.landscape']['Item1Button2list'] = 'generated.application.ui.layout.small.Item1Button2list';
            this.layoutMap['medium.landscape']['AssetFunctions'] = 'generated.application.ui.layout.small.AssetFunctions';
            this.layoutMap['medium.landscape']['CalibrationPointsDiscreteRepeatable'] = 'generated.application.ui.layout.small.CalibrationPointsDiscreteRepeatable';
            this.layoutMap['medium.landscape']['CopyPlansListItem'] = 'generated.application.ui.layout.small.CopyPlansListItem';
            this.layoutMap['medium.landscape']['MapOfflineAreaList'] = 'generated.application.ui.layout.small.MapOfflineAreaList';
            this.layoutMap['medium.landscape']['Item1Desc1'] = 'generated.application.ui.layout.small.Item1Desc1';
            this.layoutMap['medium.landscape']['AttachmentsListItem'] = 'generated.application.ui.layout.small.AttachmentsListItem';
            this.layoutMap['medium.landscape']['IdentifyFeaturesList'] = 'generated.application.ui.layout.small.IdentifyFeaturesList';
            this.layoutMap['medium.landscape']['MapDetail'] = 'generated.application.ui.layout.small.landscape.MapDetail';
            this.layoutMap['medium.landscape']['ActualMaterialListItem'] = 'generated.application.ui.layout.small.ActualMaterialListItem';
            this.layoutMap['medium.landscape']['MapEndPoint'] = 'generated.application.ui.layout.small.MapEndPoint';
            this.layoutMap['medium.landscape']['PlannedToolListItem'] = 'generated.application.ui.layout.small.PlannedToolListItem';
            this.layoutMap['medium.landscape']['ListHeaderWithSearch'] = 'generated.application.ui.layout.small.ListHeaderWithSearch';
            this.layoutMap['medium.landscape']['CrewLaborList'] = 'generated.application.ui.layout.small.CrewLaborList';
            this.layoutMap['medium.landscape']['DataSheetList'] = 'generated.application.ui.layout.small.DataSheetList';
            this.layoutMap['medium.landscape']['ScanHeader'] = 'generated.application.ui.layout.small.ScanHeader';
            this.layoutMap['medium.landscape']['CenteredBottom2Buttons'] = 'generated.application.ui.layout.small.CenteredBottom2Buttons';
            this.layoutMap['medium.landscape']['CalibrationItem4'] = 'generated.application.ui.layout.small.CalibrationItem4';
            this.layoutMap['medium.landscape']['CalibrationItem3'] = 'generated.application.ui.layout.small.CalibrationItem3';
            this.layoutMap['medium.landscape']['Progress'] = 'generated.application.ui.layout.small.Progress';
            this.layoutMap['medium.landscape']['MultiAssetListItem'] = 'generated.application.ui.layout.small.MultiAssetListItem';
            this.layoutMap['medium.landscape']['NotificationList'] = 'generated.application.ui.layout.small.NotificationList';
            this.layoutMap['medium.landscape']['MaterialToolList'] = 'generated.application.ui.layout.small.MaterialToolList';
            this.layoutMap['medium.landscape']['ActualToolListItem'] = 'generated.application.ui.layout.small.ActualToolListItem';
            this.layoutMap['medium.landscape']['Item2Desc2'] = 'generated.application.ui.layout.small.Item2Desc2';
            this.layoutMap['medium.landscape']['ListItem3Input1'] = 'generated.application.ui.layout.small.ListItem3Input1';
            this.layoutMap['medium.landscape']['LaborCraftRateLookupItem'] = 'generated.application.ui.layout.small.LaborCraftRateLookupItem';
            this.layoutMap['medium.landscape']['ServiceAddressLookup'] = 'generated.application.ui.layout.small.ServiceAddressLookup';

            if (this.layoutSize == 'medium') {
               dojo.require('generated.application.ui.layout.small.DataSheetStatus');
               dojo.require('generated.application.ui.layout.small.ListItem5Button1');
               dojo.require('generated.application.ui.layout.small.Item1Button1');
               dojo.require('generated.application.ui.layout.small.ListItem6Button1');
               dojo.require('generated.application.ui.layout.small.LaborAssignmentListItem');
               dojo.require('generated.application.ui.layout.small.KeyValueFormLayout');
               dojo.require('generated.application.ui.layout.small.Button2');
               dojo.require('generated.application.ui.layout.small.CalibrationPointsAnalogRepeatable');
               dojo.require('generated.application.ui.layout.small.FeatureAttributesList');
               dojo.require('generated.application.ui.layout.small.CalibrationDynamicCheck');
               dojo.require('generated.application.ui.layout.small.CalibrationTolError');
               dojo.require('generated.application.ui.layout.small.Item2SideBySide');
               dojo.require('generated.application.ui.layout.small.CalibrationReadings');
               dojo.require('generated.application.ui.layout.small.Item1Count1Button1');
               dojo.require('generated.application.ui.layout.small.CalibrationPointsDiscrete');
               dojo.require('generated.application.ui.layout.small.Item2');
               dojo.require('generated.application.ui.layout.small.MeterList');
               dojo.require('generated.application.ui.layout.small.CalibrationPointsAverageDiscrete');
               dojo.require('generated.application.ui.layout.small.CalibrationRange');
               dojo.require('generated.application.ui.layout.small.ActualLaborListItem');
               dojo.require('generated.application.ui.layout.small.CalibrationPointsFunction');
               dojo.require('generated.application.ui.layout.small.DirectionsListItem');
               dojo.require('generated.application.ui.layout.small.CrewToolList');
               dojo.require('generated.application.ui.layout.small.VendorNameAddressListItem');
               dojo.require('generated.application.ui.layout.small.ItemLookup');
               dojo.require('generated.application.ui.layout.small.AssetFunctionDetailsLayout');
               dojo.require('generated.application.ui.layout.small.CalibrationItem3Justify');
               dojo.require('generated.application.ui.layout.small.Button1Item1');
               dojo.require('generated.application.ui.layout.small.Item1Count1Button2');
               dojo.require('generated.application.ui.layout.small.WorkLogListItem');
               dojo.require('generated.application.ui.layout.small.CalibrationPointsAnalog');
               dojo.require('generated.application.ui.layout.small.AssetFunctionToleranceLayout');
               dojo.require('generated.application.ui.layout.small.PlannedMaterialListItem');
               dojo.require('generated.application.ui.layout.small.WorkListItem');
               dojo.require('generated.application.ui.layout.small.CalibrationPointsAverageAnalog');
               dojo.require('generated.application.ui.layout.small.FailureReportList');
               dojo.require('generated.application.ui.layout.small.portrait.MapView');
               dojo.require('generated.application.ui.layout.small.ListHeader');
               dojo.require('generated.application.ui.layout.small.Item1Button2list');
               dojo.require('generated.application.ui.layout.small.AssetFunctions');
               dojo.require('generated.application.ui.layout.small.CalibrationPointsDiscreteRepeatable');
               dojo.require('generated.application.ui.layout.small.CopyPlansListItem');
               dojo.require('generated.application.ui.layout.small.MapOfflineAreaList');
               dojo.require('generated.application.ui.layout.small.Item1Desc1');
               dojo.require('generated.application.ui.layout.small.AttachmentsListItem');
               dojo.require('generated.application.ui.layout.small.IdentifyFeaturesList');
               dojo.require('generated.application.ui.layout.small.portrait.MapDetail');
               dojo.require('generated.application.ui.layout.small.ActualMaterialListItem');
               dojo.require('generated.application.ui.layout.small.MapEndPoint');
               dojo.require('generated.application.ui.layout.small.PlannedToolListItem');
               dojo.require('generated.application.ui.layout.small.ListHeaderWithSearch');
               dojo.require('generated.application.ui.layout.small.CrewLaborList');
               dojo.require('generated.application.ui.layout.small.DataSheetList');
               dojo.require('generated.application.ui.layout.small.ScanHeader');
               dojo.require('generated.application.ui.layout.small.CenteredBottom2Buttons');
               dojo.require('generated.application.ui.layout.small.CalibrationItem4');
               dojo.require('generated.application.ui.layout.small.CalibrationItem3');
               dojo.require('generated.application.ui.layout.small.Progress');
               dojo.require('generated.application.ui.layout.small.MultiAssetListItem');
               dojo.require('generated.application.ui.layout.small.NotificationList');
               dojo.require('generated.application.ui.layout.small.MaterialToolList');
               dojo.require('generated.application.ui.layout.small.ActualToolListItem');
               dojo.require('generated.application.ui.layout.small.Item2Desc2');
               dojo.require('generated.application.ui.layout.small.ListItem3Input1');
               dojo.require('generated.application.ui.layout.small.LaborCraftRateLookupItem');
               dojo.require('generated.application.ui.layout.small.ServiceAddressLookup');
               dojo.require('generated.application.ui.layout.small.landscape.MapView');
               dojo.require('generated.application.ui.layout.small.landscape.MapDetail');
            }

            // 
            // LARGE.PORTRAIT
            // 
            this.layoutMap['large.portrait'] = {};
            this.layoutMap['large.portrait']['DataSheetStatus'] = 'generated.application.ui.layout.small.DataSheetStatus';
            this.layoutMap['large.portrait']['ListItem5Button1'] = 'generated.application.ui.layout.small.ListItem5Button1';
            this.layoutMap['large.portrait']['Item1Button1'] = 'generated.application.ui.layout.small.Item1Button1';
            this.layoutMap['large.portrait']['ListItem6Button1'] = 'generated.application.ui.layout.small.ListItem6Button1';
            this.layoutMap['large.portrait']['LaborAssignmentListItem'] = 'generated.application.ui.layout.small.LaborAssignmentListItem';
            this.layoutMap['large.portrait']['KeyValueFormLayout'] = 'generated.application.ui.layout.small.KeyValueFormLayout';
            this.layoutMap['large.portrait']['Button2'] = 'generated.application.ui.layout.small.Button2';
            this.layoutMap['large.portrait']['CalibrationPointsAnalogRepeatable'] = 'generated.application.ui.layout.small.CalibrationPointsAnalogRepeatable';
            this.layoutMap['large.portrait']['FeatureAttributesList'] = 'generated.application.ui.layout.small.FeatureAttributesList';
            this.layoutMap['large.portrait']['CalibrationDynamicCheck'] = 'generated.application.ui.layout.small.CalibrationDynamicCheck';
            this.layoutMap['large.portrait']['CalibrationTolError'] = 'generated.application.ui.layout.small.CalibrationTolError';
            this.layoutMap['large.portrait']['Item2SideBySide'] = 'generated.application.ui.layout.small.Item2SideBySide';
            this.layoutMap['large.portrait']['CalibrationReadings'] = 'generated.application.ui.layout.small.CalibrationReadings';
            this.layoutMap['large.portrait']['Item1Count1Button1'] = 'generated.application.ui.layout.small.Item1Count1Button1';
            this.layoutMap['large.portrait']['CalibrationPointsDiscrete'] = 'generated.application.ui.layout.small.CalibrationPointsDiscrete';
            this.layoutMap['large.portrait']['Item2'] = 'generated.application.ui.layout.small.Item2';
            this.layoutMap['large.portrait']['MeterList'] = 'generated.application.ui.layout.small.MeterList';
            this.layoutMap['large.portrait']['CalibrationPointsAverageDiscrete'] = 'generated.application.ui.layout.small.CalibrationPointsAverageDiscrete';
            this.layoutMap['large.portrait']['CalibrationRange'] = 'generated.application.ui.layout.small.CalibrationRange';
            this.layoutMap['large.portrait']['ActualLaborListItem'] = 'generated.application.ui.layout.small.ActualLaborListItem';
            this.layoutMap['large.portrait']['CalibrationPointsFunction'] = 'generated.application.ui.layout.small.CalibrationPointsFunction';
            this.layoutMap['large.portrait']['DirectionsListItem'] = 'generated.application.ui.layout.small.DirectionsListItem';
            this.layoutMap['large.portrait']['CrewToolList'] = 'generated.application.ui.layout.small.CrewToolList';
            this.layoutMap['large.portrait']['VendorNameAddressListItem'] = 'generated.application.ui.layout.small.VendorNameAddressListItem';
            this.layoutMap['large.portrait']['ItemLookup'] = 'generated.application.ui.layout.small.ItemLookup';
            this.layoutMap['large.portrait']['AssetFunctionDetailsLayout'] = 'generated.application.ui.layout.small.AssetFunctionDetailsLayout';
            this.layoutMap['large.portrait']['CalibrationItem3Justify'] = 'generated.application.ui.layout.small.CalibrationItem3Justify';
            this.layoutMap['large.portrait']['Button1Item1'] = 'generated.application.ui.layout.small.Button1Item1';
            this.layoutMap['large.portrait']['Item1Count1Button2'] = 'generated.application.ui.layout.small.Item1Count1Button2';
            this.layoutMap['large.portrait']['WorkLogListItem'] = 'generated.application.ui.layout.small.WorkLogListItem';
            this.layoutMap['large.portrait']['CalibrationPointsAnalog'] = 'generated.application.ui.layout.small.CalibrationPointsAnalog';
            this.layoutMap['large.portrait']['AssetFunctionToleranceLayout'] = 'generated.application.ui.layout.small.AssetFunctionToleranceLayout';
            this.layoutMap['large.portrait']['PlannedMaterialListItem'] = 'generated.application.ui.layout.small.PlannedMaterialListItem';
            this.layoutMap['large.portrait']['WorkListItem'] = 'generated.application.ui.layout.small.WorkListItem';
            this.layoutMap['large.portrait']['CalibrationPointsAverageAnalog'] = 'generated.application.ui.layout.small.CalibrationPointsAverageAnalog';
            this.layoutMap['large.portrait']['FailureReportList'] = 'generated.application.ui.layout.small.FailureReportList';
            this.layoutMap['large.portrait']['MapView'] = 'generated.application.ui.layout.small.portrait.MapView';
            this.layoutMap['large.portrait']['ListHeader'] = 'generated.application.ui.layout.small.ListHeader';
            this.layoutMap['large.portrait']['Item1Button2list'] = 'generated.application.ui.layout.small.Item1Button2list';
            this.layoutMap['large.portrait']['AssetFunctions'] = 'generated.application.ui.layout.small.AssetFunctions';
            this.layoutMap['large.portrait']['CalibrationPointsDiscreteRepeatable'] = 'generated.application.ui.layout.small.CalibrationPointsDiscreteRepeatable';
            this.layoutMap['large.portrait']['CopyPlansListItem'] = 'generated.application.ui.layout.small.CopyPlansListItem';
            this.layoutMap['large.portrait']['MapOfflineAreaList'] = 'generated.application.ui.layout.small.MapOfflineAreaList';
            this.layoutMap['large.portrait']['Item1Desc1'] = 'generated.application.ui.layout.small.Item1Desc1';
            this.layoutMap['large.portrait']['AttachmentsListItem'] = 'generated.application.ui.layout.small.AttachmentsListItem';
            this.layoutMap['large.portrait']['IdentifyFeaturesList'] = 'generated.application.ui.layout.small.IdentifyFeaturesList';
            this.layoutMap['large.portrait']['MapDetail'] = 'generated.application.ui.layout.small.portrait.MapDetail';
            this.layoutMap['large.portrait']['ActualMaterialListItem'] = 'generated.application.ui.layout.small.ActualMaterialListItem';
            this.layoutMap['large.portrait']['MapEndPoint'] = 'generated.application.ui.layout.small.MapEndPoint';
            this.layoutMap['large.portrait']['PlannedToolListItem'] = 'generated.application.ui.layout.small.PlannedToolListItem';
            this.layoutMap['large.portrait']['ListHeaderWithSearch'] = 'generated.application.ui.layout.small.ListHeaderWithSearch';
            this.layoutMap['large.portrait']['CrewLaborList'] = 'generated.application.ui.layout.small.CrewLaborList';
            this.layoutMap['large.portrait']['DataSheetList'] = 'generated.application.ui.layout.small.DataSheetList';
            this.layoutMap['large.portrait']['ScanHeader'] = 'generated.application.ui.layout.small.ScanHeader';
            this.layoutMap['large.portrait']['CenteredBottom2Buttons'] = 'generated.application.ui.layout.small.CenteredBottom2Buttons';
            this.layoutMap['large.portrait']['CalibrationItem4'] = 'generated.application.ui.layout.small.CalibrationItem4';
            this.layoutMap['large.portrait']['CalibrationItem3'] = 'generated.application.ui.layout.small.CalibrationItem3';
            this.layoutMap['large.portrait']['Progress'] = 'generated.application.ui.layout.small.Progress';
            this.layoutMap['large.portrait']['MultiAssetListItem'] = 'generated.application.ui.layout.small.MultiAssetListItem';
            this.layoutMap['large.portrait']['NotificationList'] = 'generated.application.ui.layout.small.NotificationList';
            this.layoutMap['large.portrait']['MaterialToolList'] = 'generated.application.ui.layout.small.MaterialToolList';
            this.layoutMap['large.portrait']['ActualToolListItem'] = 'generated.application.ui.layout.small.ActualToolListItem';
            this.layoutMap['large.portrait']['Item2Desc2'] = 'generated.application.ui.layout.small.Item2Desc2';
            this.layoutMap['large.portrait']['ListItem3Input1'] = 'generated.application.ui.layout.small.ListItem3Input1';
            this.layoutMap['large.portrait']['LaborCraftRateLookupItem'] = 'generated.application.ui.layout.small.LaborCraftRateLookupItem';
            this.layoutMap['large.portrait']['ServiceAddressLookup'] = 'generated.application.ui.layout.small.ServiceAddressLookup';

            // 
            // LARGE.LANDSCAPE
            // 
            this.layoutMap['large.landscape'] = {};
            this.layoutMap['large.landscape']['DataSheetStatus'] = 'generated.application.ui.layout.small.DataSheetStatus';
            this.layoutMap['large.landscape']['ListItem5Button1'] = 'generated.application.ui.layout.small.ListItem5Button1';
            this.layoutMap['large.landscape']['Item1Button1'] = 'generated.application.ui.layout.small.Item1Button1';
            this.layoutMap['large.landscape']['ListItem6Button1'] = 'generated.application.ui.layout.small.ListItem6Button1';
            this.layoutMap['large.landscape']['LaborAssignmentListItem'] = 'generated.application.ui.layout.small.LaborAssignmentListItem';
            this.layoutMap['large.landscape']['KeyValueFormLayout'] = 'generated.application.ui.layout.small.KeyValueFormLayout';
            this.layoutMap['large.landscape']['Button2'] = 'generated.application.ui.layout.small.Button2';
            this.layoutMap['large.landscape']['CalibrationPointsAnalogRepeatable'] = 'generated.application.ui.layout.small.CalibrationPointsAnalogRepeatable';
            this.layoutMap['large.landscape']['FeatureAttributesList'] = 'generated.application.ui.layout.small.FeatureAttributesList';
            this.layoutMap['large.landscape']['CalibrationDynamicCheck'] = 'generated.application.ui.layout.small.CalibrationDynamicCheck';
            this.layoutMap['large.landscape']['CalibrationTolError'] = 'generated.application.ui.layout.small.CalibrationTolError';
            this.layoutMap['large.landscape']['Item2SideBySide'] = 'generated.application.ui.layout.small.Item2SideBySide';
            this.layoutMap['large.landscape']['CalibrationReadings'] = 'generated.application.ui.layout.small.CalibrationReadings';
            this.layoutMap['large.landscape']['Item1Count1Button1'] = 'generated.application.ui.layout.small.Item1Count1Button1';
            this.layoutMap['large.landscape']['CalibrationPointsDiscrete'] = 'generated.application.ui.layout.small.CalibrationPointsDiscrete';
            this.layoutMap['large.landscape']['Item2'] = 'generated.application.ui.layout.small.Item2';
            this.layoutMap['large.landscape']['MeterList'] = 'generated.application.ui.layout.small.MeterList';
            this.layoutMap['large.landscape']['CalibrationPointsAverageDiscrete'] = 'generated.application.ui.layout.small.CalibrationPointsAverageDiscrete';
            this.layoutMap['large.landscape']['CalibrationRange'] = 'generated.application.ui.layout.small.CalibrationRange';
            this.layoutMap['large.landscape']['ActualLaborListItem'] = 'generated.application.ui.layout.small.ActualLaborListItem';
            this.layoutMap['large.landscape']['CalibrationPointsFunction'] = 'generated.application.ui.layout.small.CalibrationPointsFunction';
            this.layoutMap['large.landscape']['DirectionsListItem'] = 'generated.application.ui.layout.small.DirectionsListItem';
            this.layoutMap['large.landscape']['CrewToolList'] = 'generated.application.ui.layout.small.CrewToolList';
            this.layoutMap['large.landscape']['VendorNameAddressListItem'] = 'generated.application.ui.layout.small.VendorNameAddressListItem';
            this.layoutMap['large.landscape']['ItemLookup'] = 'generated.application.ui.layout.small.ItemLookup';
            this.layoutMap['large.landscape']['AssetFunctionDetailsLayout'] = 'generated.application.ui.layout.small.AssetFunctionDetailsLayout';
            this.layoutMap['large.landscape']['CalibrationItem3Justify'] = 'generated.application.ui.layout.small.CalibrationItem3Justify';
            this.layoutMap['large.landscape']['Button1Item1'] = 'generated.application.ui.layout.small.Button1Item1';
            this.layoutMap['large.landscape']['Item1Count1Button2'] = 'generated.application.ui.layout.small.Item1Count1Button2';
            this.layoutMap['large.landscape']['WorkLogListItem'] = 'generated.application.ui.layout.small.WorkLogListItem';
            this.layoutMap['large.landscape']['CalibrationPointsAnalog'] = 'generated.application.ui.layout.small.CalibrationPointsAnalog';
            this.layoutMap['large.landscape']['AssetFunctionToleranceLayout'] = 'generated.application.ui.layout.small.AssetFunctionToleranceLayout';
            this.layoutMap['large.landscape']['PlannedMaterialListItem'] = 'generated.application.ui.layout.small.PlannedMaterialListItem';
            this.layoutMap['large.landscape']['WorkListItem'] = 'generated.application.ui.layout.small.WorkListItem';
            this.layoutMap['large.landscape']['CalibrationPointsAverageAnalog'] = 'generated.application.ui.layout.small.CalibrationPointsAverageAnalog';
            this.layoutMap['large.landscape']['FailureReportList'] = 'generated.application.ui.layout.small.FailureReportList';
            this.layoutMap['large.landscape']['MapView'] = 'generated.application.ui.layout.small.landscape.MapView';
            this.layoutMap['large.landscape']['ListHeader'] = 'generated.application.ui.layout.small.ListHeader';
            this.layoutMap['large.landscape']['Item1Button2list'] = 'generated.application.ui.layout.small.Item1Button2list';
            this.layoutMap['large.landscape']['AssetFunctions'] = 'generated.application.ui.layout.small.AssetFunctions';
            this.layoutMap['large.landscape']['CalibrationPointsDiscreteRepeatable'] = 'generated.application.ui.layout.small.CalibrationPointsDiscreteRepeatable';
            this.layoutMap['large.landscape']['CopyPlansListItem'] = 'generated.application.ui.layout.small.CopyPlansListItem';
            this.layoutMap['large.landscape']['MapOfflineAreaList'] = 'generated.application.ui.layout.small.MapOfflineAreaList';
            this.layoutMap['large.landscape']['Item1Desc1'] = 'generated.application.ui.layout.small.Item1Desc1';
            this.layoutMap['large.landscape']['AttachmentsListItem'] = 'generated.application.ui.layout.small.AttachmentsListItem';
            this.layoutMap['large.landscape']['IdentifyFeaturesList'] = 'generated.application.ui.layout.small.IdentifyFeaturesList';
            this.layoutMap['large.landscape']['MapDetail'] = 'generated.application.ui.layout.small.landscape.MapDetail';
            this.layoutMap['large.landscape']['ActualMaterialListItem'] = 'generated.application.ui.layout.small.ActualMaterialListItem';
            this.layoutMap['large.landscape']['MapEndPoint'] = 'generated.application.ui.layout.small.MapEndPoint';
            this.layoutMap['large.landscape']['PlannedToolListItem'] = 'generated.application.ui.layout.small.PlannedToolListItem';
            this.layoutMap['large.landscape']['ListHeaderWithSearch'] = 'generated.application.ui.layout.small.ListHeaderWithSearch';
            this.layoutMap['large.landscape']['CrewLaborList'] = 'generated.application.ui.layout.small.CrewLaborList';
            this.layoutMap['large.landscape']['DataSheetList'] = 'generated.application.ui.layout.small.DataSheetList';
            this.layoutMap['large.landscape']['ScanHeader'] = 'generated.application.ui.layout.small.ScanHeader';
            this.layoutMap['large.landscape']['CenteredBottom2Buttons'] = 'generated.application.ui.layout.small.CenteredBottom2Buttons';
            this.layoutMap['large.landscape']['CalibrationItem4'] = 'generated.application.ui.layout.small.CalibrationItem4';
            this.layoutMap['large.landscape']['CalibrationItem3'] = 'generated.application.ui.layout.small.CalibrationItem3';
            this.layoutMap['large.landscape']['Progress'] = 'generated.application.ui.layout.small.Progress';
            this.layoutMap['large.landscape']['MultiAssetListItem'] = 'generated.application.ui.layout.small.MultiAssetListItem';
            this.layoutMap['large.landscape']['NotificationList'] = 'generated.application.ui.layout.small.NotificationList';
            this.layoutMap['large.landscape']['MaterialToolList'] = 'generated.application.ui.layout.small.MaterialToolList';
            this.layoutMap['large.landscape']['ActualToolListItem'] = 'generated.application.ui.layout.small.ActualToolListItem';
            this.layoutMap['large.landscape']['Item2Desc2'] = 'generated.application.ui.layout.small.Item2Desc2';
            this.layoutMap['large.landscape']['ListItem3Input1'] = 'generated.application.ui.layout.small.ListItem3Input1';
            this.layoutMap['large.landscape']['LaborCraftRateLookupItem'] = 'generated.application.ui.layout.small.LaborCraftRateLookupItem';
            this.layoutMap['large.landscape']['ServiceAddressLookup'] = 'generated.application.ui.layout.small.ServiceAddressLookup';

            if (this.layoutSize == 'large') {
               dojo.require('generated.application.ui.layout.small.DataSheetStatus');
               dojo.require('generated.application.ui.layout.small.ListItem5Button1');
               dojo.require('generated.application.ui.layout.small.Item1Button1');
               dojo.require('generated.application.ui.layout.small.ListItem6Button1');
               dojo.require('generated.application.ui.layout.small.LaborAssignmentListItem');
               dojo.require('generated.application.ui.layout.small.KeyValueFormLayout');
               dojo.require('generated.application.ui.layout.small.Button2');
               dojo.require('generated.application.ui.layout.small.CalibrationPointsAnalogRepeatable');
               dojo.require('generated.application.ui.layout.small.FeatureAttributesList');
               dojo.require('generated.application.ui.layout.small.CalibrationDynamicCheck');
               dojo.require('generated.application.ui.layout.small.CalibrationTolError');
               dojo.require('generated.application.ui.layout.small.Item2SideBySide');
               dojo.require('generated.application.ui.layout.small.CalibrationReadings');
               dojo.require('generated.application.ui.layout.small.Item1Count1Button1');
               dojo.require('generated.application.ui.layout.small.CalibrationPointsDiscrete');
               dojo.require('generated.application.ui.layout.small.Item2');
               dojo.require('generated.application.ui.layout.small.MeterList');
               dojo.require('generated.application.ui.layout.small.CalibrationPointsAverageDiscrete');
               dojo.require('generated.application.ui.layout.small.CalibrationRange');
               dojo.require('generated.application.ui.layout.small.ActualLaborListItem');
               dojo.require('generated.application.ui.layout.small.CalibrationPointsFunction');
               dojo.require('generated.application.ui.layout.small.DirectionsListItem');
               dojo.require('generated.application.ui.layout.small.CrewToolList');
               dojo.require('generated.application.ui.layout.small.VendorNameAddressListItem');
               dojo.require('generated.application.ui.layout.small.ItemLookup');
               dojo.require('generated.application.ui.layout.small.AssetFunctionDetailsLayout');
               dojo.require('generated.application.ui.layout.small.CalibrationItem3Justify');
               dojo.require('generated.application.ui.layout.small.Button1Item1');
               dojo.require('generated.application.ui.layout.small.Item1Count1Button2');
               dojo.require('generated.application.ui.layout.small.WorkLogListItem');
               dojo.require('generated.application.ui.layout.small.CalibrationPointsAnalog');
               dojo.require('generated.application.ui.layout.small.AssetFunctionToleranceLayout');
               dojo.require('generated.application.ui.layout.small.PlannedMaterialListItem');
               dojo.require('generated.application.ui.layout.small.WorkListItem');
               dojo.require('generated.application.ui.layout.small.CalibrationPointsAverageAnalog');
               dojo.require('generated.application.ui.layout.small.FailureReportList');
               dojo.require('generated.application.ui.layout.small.portrait.MapView');
               dojo.require('generated.application.ui.layout.small.ListHeader');
               dojo.require('generated.application.ui.layout.small.Item1Button2list');
               dojo.require('generated.application.ui.layout.small.AssetFunctions');
               dojo.require('generated.application.ui.layout.small.CalibrationPointsDiscreteRepeatable');
               dojo.require('generated.application.ui.layout.small.CopyPlansListItem');
               dojo.require('generated.application.ui.layout.small.MapOfflineAreaList');
               dojo.require('generated.application.ui.layout.small.Item1Desc1');
               dojo.require('generated.application.ui.layout.small.AttachmentsListItem');
               dojo.require('generated.application.ui.layout.small.IdentifyFeaturesList');
               dojo.require('generated.application.ui.layout.small.portrait.MapDetail');
               dojo.require('generated.application.ui.layout.small.ActualMaterialListItem');
               dojo.require('generated.application.ui.layout.small.MapEndPoint');
               dojo.require('generated.application.ui.layout.small.PlannedToolListItem');
               dojo.require('generated.application.ui.layout.small.ListHeaderWithSearch');
               dojo.require('generated.application.ui.layout.small.CrewLaborList');
               dojo.require('generated.application.ui.layout.small.DataSheetList');
               dojo.require('generated.application.ui.layout.small.ScanHeader');
               dojo.require('generated.application.ui.layout.small.CenteredBottom2Buttons');
               dojo.require('generated.application.ui.layout.small.CalibrationItem4');
               dojo.require('generated.application.ui.layout.small.CalibrationItem3');
               dojo.require('generated.application.ui.layout.small.Progress');
               dojo.require('generated.application.ui.layout.small.MultiAssetListItem');
               dojo.require('generated.application.ui.layout.small.NotificationList');
               dojo.require('generated.application.ui.layout.small.MaterialToolList');
               dojo.require('generated.application.ui.layout.small.ActualToolListItem');
               dojo.require('generated.application.ui.layout.small.Item2Desc2');
               dojo.require('generated.application.ui.layout.small.ListItem3Input1');
               dojo.require('generated.application.ui.layout.small.LaborCraftRateLookupItem');
               dojo.require('generated.application.ui.layout.small.ServiceAddressLookup');
               dojo.require('generated.application.ui.layout.small.landscape.MapView');
               dojo.require('generated.application.ui.layout.small.landscape.MapDetail');
            }

            // 
            // XLARGE.PORTRAIT
            // 
            this.layoutMap['xlarge.portrait'] = {};
            this.layoutMap['xlarge.portrait']['DataSheetStatus'] = 'generated.application.ui.layout.small.DataSheetStatus';
            this.layoutMap['xlarge.portrait']['ListItem5Button1'] = 'generated.application.ui.layout.small.ListItem5Button1';
            this.layoutMap['xlarge.portrait']['Item1Button1'] = 'generated.application.ui.layout.small.Item1Button1';
            this.layoutMap['xlarge.portrait']['ListItem6Button1'] = 'generated.application.ui.layout.small.ListItem6Button1';
            this.layoutMap['xlarge.portrait']['LaborAssignmentListItem'] = 'generated.application.ui.layout.small.LaborAssignmentListItem';
            this.layoutMap['xlarge.portrait']['KeyValueFormLayout'] = 'generated.application.ui.layout.small.KeyValueFormLayout';
            this.layoutMap['xlarge.portrait']['Button2'] = 'generated.application.ui.layout.small.Button2';
            this.layoutMap['xlarge.portrait']['CalibrationPointsAnalogRepeatable'] = 'generated.application.ui.layout.small.CalibrationPointsAnalogRepeatable';
            this.layoutMap['xlarge.portrait']['FeatureAttributesList'] = 'generated.application.ui.layout.small.FeatureAttributesList';
            this.layoutMap['xlarge.portrait']['CalibrationDynamicCheck'] = 'generated.application.ui.layout.small.CalibrationDynamicCheck';
            this.layoutMap['xlarge.portrait']['CalibrationTolError'] = 'generated.application.ui.layout.small.CalibrationTolError';
            this.layoutMap['xlarge.portrait']['Item2SideBySide'] = 'generated.application.ui.layout.small.Item2SideBySide';
            this.layoutMap['xlarge.portrait']['CalibrationReadings'] = 'generated.application.ui.layout.small.CalibrationReadings';
            this.layoutMap['xlarge.portrait']['Item1Count1Button1'] = 'generated.application.ui.layout.small.Item1Count1Button1';
            this.layoutMap['xlarge.portrait']['CalibrationPointsDiscrete'] = 'generated.application.ui.layout.small.CalibrationPointsDiscrete';
            this.layoutMap['xlarge.portrait']['Item2'] = 'generated.application.ui.layout.small.Item2';
            this.layoutMap['xlarge.portrait']['MeterList'] = 'generated.application.ui.layout.small.MeterList';
            this.layoutMap['xlarge.portrait']['CalibrationPointsAverageDiscrete'] = 'generated.application.ui.layout.small.CalibrationPointsAverageDiscrete';
            this.layoutMap['xlarge.portrait']['CalibrationRange'] = 'generated.application.ui.layout.small.CalibrationRange';
            this.layoutMap['xlarge.portrait']['ActualLaborListItem'] = 'generated.application.ui.layout.small.ActualLaborListItem';
            this.layoutMap['xlarge.portrait']['CalibrationPointsFunction'] = 'generated.application.ui.layout.small.CalibrationPointsFunction';
            this.layoutMap['xlarge.portrait']['DirectionsListItem'] = 'generated.application.ui.layout.small.DirectionsListItem';
            this.layoutMap['xlarge.portrait']['CrewToolList'] = 'generated.application.ui.layout.small.CrewToolList';
            this.layoutMap['xlarge.portrait']['VendorNameAddressListItem'] = 'generated.application.ui.layout.small.VendorNameAddressListItem';
            this.layoutMap['xlarge.portrait']['ItemLookup'] = 'generated.application.ui.layout.small.ItemLookup';
            this.layoutMap['xlarge.portrait']['AssetFunctionDetailsLayout'] = 'generated.application.ui.layout.small.AssetFunctionDetailsLayout';
            this.layoutMap['xlarge.portrait']['CalibrationItem3Justify'] = 'generated.application.ui.layout.small.CalibrationItem3Justify';
            this.layoutMap['xlarge.portrait']['Button1Item1'] = 'generated.application.ui.layout.small.Button1Item1';
            this.layoutMap['xlarge.portrait']['Item1Count1Button2'] = 'generated.application.ui.layout.small.Item1Count1Button2';
            this.layoutMap['xlarge.portrait']['WorkLogListItem'] = 'generated.application.ui.layout.small.WorkLogListItem';
            this.layoutMap['xlarge.portrait']['CalibrationPointsAnalog'] = 'generated.application.ui.layout.small.CalibrationPointsAnalog';
            this.layoutMap['xlarge.portrait']['AssetFunctionToleranceLayout'] = 'generated.application.ui.layout.small.AssetFunctionToleranceLayout';
            this.layoutMap['xlarge.portrait']['PlannedMaterialListItem'] = 'generated.application.ui.layout.small.PlannedMaterialListItem';
            this.layoutMap['xlarge.portrait']['WorkListItem'] = 'generated.application.ui.layout.small.WorkListItem';
            this.layoutMap['xlarge.portrait']['CalibrationPointsAverageAnalog'] = 'generated.application.ui.layout.small.CalibrationPointsAverageAnalog';
            this.layoutMap['xlarge.portrait']['FailureReportList'] = 'generated.application.ui.layout.small.FailureReportList';
            this.layoutMap['xlarge.portrait']['MapView'] = 'generated.application.ui.layout.small.portrait.MapView';
            this.layoutMap['xlarge.portrait']['ListHeader'] = 'generated.application.ui.layout.small.ListHeader';
            this.layoutMap['xlarge.portrait']['Item1Button2list'] = 'generated.application.ui.layout.small.Item1Button2list';
            this.layoutMap['xlarge.portrait']['AssetFunctions'] = 'generated.application.ui.layout.small.AssetFunctions';
            this.layoutMap['xlarge.portrait']['CalibrationPointsDiscreteRepeatable'] = 'generated.application.ui.layout.small.CalibrationPointsDiscreteRepeatable';
            this.layoutMap['xlarge.portrait']['CopyPlansListItem'] = 'generated.application.ui.layout.small.CopyPlansListItem';
            this.layoutMap['xlarge.portrait']['MapOfflineAreaList'] = 'generated.application.ui.layout.small.MapOfflineAreaList';
            this.layoutMap['xlarge.portrait']['Item1Desc1'] = 'generated.application.ui.layout.small.Item1Desc1';
            this.layoutMap['xlarge.portrait']['AttachmentsListItem'] = 'generated.application.ui.layout.small.AttachmentsListItem';
            this.layoutMap['xlarge.portrait']['IdentifyFeaturesList'] = 'generated.application.ui.layout.small.IdentifyFeaturesList';
            this.layoutMap['xlarge.portrait']['MapDetail'] = 'generated.application.ui.layout.small.portrait.MapDetail';
            this.layoutMap['xlarge.portrait']['ActualMaterialListItem'] = 'generated.application.ui.layout.small.ActualMaterialListItem';
            this.layoutMap['xlarge.portrait']['MapEndPoint'] = 'generated.application.ui.layout.small.MapEndPoint';
            this.layoutMap['xlarge.portrait']['PlannedToolListItem'] = 'generated.application.ui.layout.small.PlannedToolListItem';
            this.layoutMap['xlarge.portrait']['ListHeaderWithSearch'] = 'generated.application.ui.layout.small.ListHeaderWithSearch';
            this.layoutMap['xlarge.portrait']['CrewLaborList'] = 'generated.application.ui.layout.small.CrewLaborList';
            this.layoutMap['xlarge.portrait']['DataSheetList'] = 'generated.application.ui.layout.small.DataSheetList';
            this.layoutMap['xlarge.portrait']['ScanHeader'] = 'generated.application.ui.layout.small.ScanHeader';
            this.layoutMap['xlarge.portrait']['CenteredBottom2Buttons'] = 'generated.application.ui.layout.small.CenteredBottom2Buttons';
            this.layoutMap['xlarge.portrait']['CalibrationItem4'] = 'generated.application.ui.layout.small.CalibrationItem4';
            this.layoutMap['xlarge.portrait']['CalibrationItem3'] = 'generated.application.ui.layout.small.CalibrationItem3';
            this.layoutMap['xlarge.portrait']['Progress'] = 'generated.application.ui.layout.small.Progress';
            this.layoutMap['xlarge.portrait']['MultiAssetListItem'] = 'generated.application.ui.layout.small.MultiAssetListItem';
            this.layoutMap['xlarge.portrait']['NotificationList'] = 'generated.application.ui.layout.small.NotificationList';
            this.layoutMap['xlarge.portrait']['MaterialToolList'] = 'generated.application.ui.layout.small.MaterialToolList';
            this.layoutMap['xlarge.portrait']['ActualToolListItem'] = 'generated.application.ui.layout.small.ActualToolListItem';
            this.layoutMap['xlarge.portrait']['Item2Desc2'] = 'generated.application.ui.layout.small.Item2Desc2';
            this.layoutMap['xlarge.portrait']['ListItem3Input1'] = 'generated.application.ui.layout.small.ListItem3Input1';
            this.layoutMap['xlarge.portrait']['LaborCraftRateLookupItem'] = 'generated.application.ui.layout.small.LaborCraftRateLookupItem';
            this.layoutMap['xlarge.portrait']['ServiceAddressLookup'] = 'generated.application.ui.layout.small.ServiceAddressLookup';

            // 
            // XLARGE.LANDSCAPE
            // 
            this.layoutMap['xlarge.landscape'] = {};
            this.layoutMap['xlarge.landscape']['DataSheetStatus'] = 'generated.application.ui.layout.small.DataSheetStatus';
            this.layoutMap['xlarge.landscape']['ListItem5Button1'] = 'generated.application.ui.layout.small.ListItem5Button1';
            this.layoutMap['xlarge.landscape']['Item1Button1'] = 'generated.application.ui.layout.small.Item1Button1';
            this.layoutMap['xlarge.landscape']['ListItem6Button1'] = 'generated.application.ui.layout.small.ListItem6Button1';
            this.layoutMap['xlarge.landscape']['LaborAssignmentListItem'] = 'generated.application.ui.layout.small.LaborAssignmentListItem';
            this.layoutMap['xlarge.landscape']['KeyValueFormLayout'] = 'generated.application.ui.layout.small.KeyValueFormLayout';
            this.layoutMap['xlarge.landscape']['Button2'] = 'generated.application.ui.layout.small.Button2';
            this.layoutMap['xlarge.landscape']['CalibrationPointsAnalogRepeatable'] = 'generated.application.ui.layout.small.CalibrationPointsAnalogRepeatable';
            this.layoutMap['xlarge.landscape']['FeatureAttributesList'] = 'generated.application.ui.layout.small.FeatureAttributesList';
            this.layoutMap['xlarge.landscape']['CalibrationDynamicCheck'] = 'generated.application.ui.layout.small.CalibrationDynamicCheck';
            this.layoutMap['xlarge.landscape']['CalibrationTolError'] = 'generated.application.ui.layout.small.CalibrationTolError';
            this.layoutMap['xlarge.landscape']['Item2SideBySide'] = 'generated.application.ui.layout.small.Item2SideBySide';
            this.layoutMap['xlarge.landscape']['CalibrationReadings'] = 'generated.application.ui.layout.small.CalibrationReadings';
            this.layoutMap['xlarge.landscape']['Item1Count1Button1'] = 'generated.application.ui.layout.small.Item1Count1Button1';
            this.layoutMap['xlarge.landscape']['CalibrationPointsDiscrete'] = 'generated.application.ui.layout.small.CalibrationPointsDiscrete';
            this.layoutMap['xlarge.landscape']['Item2'] = 'generated.application.ui.layout.small.Item2';
            this.layoutMap['xlarge.landscape']['MeterList'] = 'generated.application.ui.layout.small.MeterList';
            this.layoutMap['xlarge.landscape']['CalibrationPointsAverageDiscrete'] = 'generated.application.ui.layout.small.CalibrationPointsAverageDiscrete';
            this.layoutMap['xlarge.landscape']['CalibrationRange'] = 'generated.application.ui.layout.small.CalibrationRange';
            this.layoutMap['xlarge.landscape']['ActualLaborListItem'] = 'generated.application.ui.layout.small.ActualLaborListItem';
            this.layoutMap['xlarge.landscape']['CalibrationPointsFunction'] = 'generated.application.ui.layout.small.CalibrationPointsFunction';
            this.layoutMap['xlarge.landscape']['DirectionsListItem'] = 'generated.application.ui.layout.small.DirectionsListItem';
            this.layoutMap['xlarge.landscape']['CrewToolList'] = 'generated.application.ui.layout.small.CrewToolList';
            this.layoutMap['xlarge.landscape']['VendorNameAddressListItem'] = 'generated.application.ui.layout.small.VendorNameAddressListItem';
            this.layoutMap['xlarge.landscape']['ItemLookup'] = 'generated.application.ui.layout.small.ItemLookup';
            this.layoutMap['xlarge.landscape']['AssetFunctionDetailsLayout'] = 'generated.application.ui.layout.small.AssetFunctionDetailsLayout';
            this.layoutMap['xlarge.landscape']['CalibrationItem3Justify'] = 'generated.application.ui.layout.small.CalibrationItem3Justify';
            this.layoutMap['xlarge.landscape']['Button1Item1'] = 'generated.application.ui.layout.small.Button1Item1';
            this.layoutMap['xlarge.landscape']['Item1Count1Button2'] = 'generated.application.ui.layout.small.Item1Count1Button2';
            this.layoutMap['xlarge.landscape']['WorkLogListItem'] = 'generated.application.ui.layout.small.WorkLogListItem';
            this.layoutMap['xlarge.landscape']['CalibrationPointsAnalog'] = 'generated.application.ui.layout.small.CalibrationPointsAnalog';
            this.layoutMap['xlarge.landscape']['AssetFunctionToleranceLayout'] = 'generated.application.ui.layout.small.AssetFunctionToleranceLayout';
            this.layoutMap['xlarge.landscape']['PlannedMaterialListItem'] = 'generated.application.ui.layout.small.PlannedMaterialListItem';
            this.layoutMap['xlarge.landscape']['WorkListItem'] = 'generated.application.ui.layout.small.WorkListItem';
            this.layoutMap['xlarge.landscape']['CalibrationPointsAverageAnalog'] = 'generated.application.ui.layout.small.CalibrationPointsAverageAnalog';
            this.layoutMap['xlarge.landscape']['FailureReportList'] = 'generated.application.ui.layout.small.FailureReportList';
            this.layoutMap['xlarge.landscape']['MapView'] = 'generated.application.ui.layout.small.landscape.MapView';
            this.layoutMap['xlarge.landscape']['ListHeader'] = 'generated.application.ui.layout.small.ListHeader';
            this.layoutMap['xlarge.landscape']['Item1Button2list'] = 'generated.application.ui.layout.small.Item1Button2list';
            this.layoutMap['xlarge.landscape']['AssetFunctions'] = 'generated.application.ui.layout.small.AssetFunctions';
            this.layoutMap['xlarge.landscape']['CalibrationPointsDiscreteRepeatable'] = 'generated.application.ui.layout.small.CalibrationPointsDiscreteRepeatable';
            this.layoutMap['xlarge.landscape']['CopyPlansListItem'] = 'generated.application.ui.layout.small.CopyPlansListItem';
            this.layoutMap['xlarge.landscape']['MapOfflineAreaList'] = 'generated.application.ui.layout.small.MapOfflineAreaList';
            this.layoutMap['xlarge.landscape']['Item1Desc1'] = 'generated.application.ui.layout.small.Item1Desc1';
            this.layoutMap['xlarge.landscape']['AttachmentsListItem'] = 'generated.application.ui.layout.small.AttachmentsListItem';
            this.layoutMap['xlarge.landscape']['IdentifyFeaturesList'] = 'generated.application.ui.layout.small.IdentifyFeaturesList';
            this.layoutMap['xlarge.landscape']['MapDetail'] = 'generated.application.ui.layout.small.landscape.MapDetail';
            this.layoutMap['xlarge.landscape']['ActualMaterialListItem'] = 'generated.application.ui.layout.small.ActualMaterialListItem';
            this.layoutMap['xlarge.landscape']['MapEndPoint'] = 'generated.application.ui.layout.small.MapEndPoint';
            this.layoutMap['xlarge.landscape']['PlannedToolListItem'] = 'generated.application.ui.layout.small.PlannedToolListItem';
            this.layoutMap['xlarge.landscape']['ListHeaderWithSearch'] = 'generated.application.ui.layout.small.ListHeaderWithSearch';
            this.layoutMap['xlarge.landscape']['CrewLaborList'] = 'generated.application.ui.layout.small.CrewLaborList';
            this.layoutMap['xlarge.landscape']['DataSheetList'] = 'generated.application.ui.layout.small.DataSheetList';
            this.layoutMap['xlarge.landscape']['ScanHeader'] = 'generated.application.ui.layout.small.ScanHeader';
            this.layoutMap['xlarge.landscape']['CenteredBottom2Buttons'] = 'generated.application.ui.layout.small.CenteredBottom2Buttons';
            this.layoutMap['xlarge.landscape']['CalibrationItem4'] = 'generated.application.ui.layout.small.CalibrationItem4';
            this.layoutMap['xlarge.landscape']['CalibrationItem3'] = 'generated.application.ui.layout.small.CalibrationItem3';
            this.layoutMap['xlarge.landscape']['Progress'] = 'generated.application.ui.layout.small.Progress';
            this.layoutMap['xlarge.landscape']['MultiAssetListItem'] = 'generated.application.ui.layout.small.MultiAssetListItem';
            this.layoutMap['xlarge.landscape']['NotificationList'] = 'generated.application.ui.layout.small.NotificationList';
            this.layoutMap['xlarge.landscape']['MaterialToolList'] = 'generated.application.ui.layout.small.MaterialToolList';
            this.layoutMap['xlarge.landscape']['ActualToolListItem'] = 'generated.application.ui.layout.small.ActualToolListItem';
            this.layoutMap['xlarge.landscape']['Item2Desc2'] = 'generated.application.ui.layout.small.Item2Desc2';
            this.layoutMap['xlarge.landscape']['ListItem3Input1'] = 'generated.application.ui.layout.small.ListItem3Input1';
            this.layoutMap['xlarge.landscape']['LaborCraftRateLookupItem'] = 'generated.application.ui.layout.small.LaborCraftRateLookupItem';
            this.layoutMap['xlarge.landscape']['ServiceAddressLookup'] = 'generated.application.ui.layout.small.ServiceAddressLookup';

            if (this.layoutSize == 'xlarge') {
               dojo.require('generated.application.ui.layout.small.DataSheetStatus');
               dojo.require('generated.application.ui.layout.small.ListItem5Button1');
               dojo.require('generated.application.ui.layout.small.Item1Button1');
               dojo.require('generated.application.ui.layout.small.ListItem6Button1');
               dojo.require('generated.application.ui.layout.small.LaborAssignmentListItem');
               dojo.require('generated.application.ui.layout.small.KeyValueFormLayout');
               dojo.require('generated.application.ui.layout.small.Button2');
               dojo.require('generated.application.ui.layout.small.CalibrationPointsAnalogRepeatable');
               dojo.require('generated.application.ui.layout.small.FeatureAttributesList');
               dojo.require('generated.application.ui.layout.small.CalibrationDynamicCheck');
               dojo.require('generated.application.ui.layout.small.CalibrationTolError');
               dojo.require('generated.application.ui.layout.small.Item2SideBySide');
               dojo.require('generated.application.ui.layout.small.CalibrationReadings');
               dojo.require('generated.application.ui.layout.small.Item1Count1Button1');
               dojo.require('generated.application.ui.layout.small.CalibrationPointsDiscrete');
               dojo.require('generated.application.ui.layout.small.Item2');
               dojo.require('generated.application.ui.layout.small.MeterList');
               dojo.require('generated.application.ui.layout.small.CalibrationPointsAverageDiscrete');
               dojo.require('generated.application.ui.layout.small.CalibrationRange');
               dojo.require('generated.application.ui.layout.small.ActualLaborListItem');
               dojo.require('generated.application.ui.layout.small.CalibrationPointsFunction');
               dojo.require('generated.application.ui.layout.small.DirectionsListItem');
               dojo.require('generated.application.ui.layout.small.CrewToolList');
               dojo.require('generated.application.ui.layout.small.VendorNameAddressListItem');
               dojo.require('generated.application.ui.layout.small.ItemLookup');
               dojo.require('generated.application.ui.layout.small.AssetFunctionDetailsLayout');
               dojo.require('generated.application.ui.layout.small.CalibrationItem3Justify');
               dojo.require('generated.application.ui.layout.small.Button1Item1');
               dojo.require('generated.application.ui.layout.small.Item1Count1Button2');
               dojo.require('generated.application.ui.layout.small.WorkLogListItem');
               dojo.require('generated.application.ui.layout.small.CalibrationPointsAnalog');
               dojo.require('generated.application.ui.layout.small.AssetFunctionToleranceLayout');
               dojo.require('generated.application.ui.layout.small.PlannedMaterialListItem');
               dojo.require('generated.application.ui.layout.small.WorkListItem');
               dojo.require('generated.application.ui.layout.small.CalibrationPointsAverageAnalog');
               dojo.require('generated.application.ui.layout.small.FailureReportList');
               dojo.require('generated.application.ui.layout.small.portrait.MapView');
               dojo.require('generated.application.ui.layout.small.ListHeader');
               dojo.require('generated.application.ui.layout.small.Item1Button2list');
               dojo.require('generated.application.ui.layout.small.AssetFunctions');
               dojo.require('generated.application.ui.layout.small.CalibrationPointsDiscreteRepeatable');
               dojo.require('generated.application.ui.layout.small.CopyPlansListItem');
               dojo.require('generated.application.ui.layout.small.MapOfflineAreaList');
               dojo.require('generated.application.ui.layout.small.Item1Desc1');
               dojo.require('generated.application.ui.layout.small.AttachmentsListItem');
               dojo.require('generated.application.ui.layout.small.IdentifyFeaturesList');
               dojo.require('generated.application.ui.layout.small.portrait.MapDetail');
               dojo.require('generated.application.ui.layout.small.ActualMaterialListItem');
               dojo.require('generated.application.ui.layout.small.MapEndPoint');
               dojo.require('generated.application.ui.layout.small.PlannedToolListItem');
               dojo.require('generated.application.ui.layout.small.ListHeaderWithSearch');
               dojo.require('generated.application.ui.layout.small.CrewLaborList');
               dojo.require('generated.application.ui.layout.small.DataSheetList');
               dojo.require('generated.application.ui.layout.small.ScanHeader');
               dojo.require('generated.application.ui.layout.small.CenteredBottom2Buttons');
               dojo.require('generated.application.ui.layout.small.CalibrationItem4');
               dojo.require('generated.application.ui.layout.small.CalibrationItem3');
               dojo.require('generated.application.ui.layout.small.Progress');
               dojo.require('generated.application.ui.layout.small.MultiAssetListItem');
               dojo.require('generated.application.ui.layout.small.NotificationList');
               dojo.require('generated.application.ui.layout.small.MaterialToolList');
               dojo.require('generated.application.ui.layout.small.ActualToolListItem');
               dojo.require('generated.application.ui.layout.small.Item2Desc2');
               dojo.require('generated.application.ui.layout.small.ListItem3Input1');
               dojo.require('generated.application.ui.layout.small.LaborCraftRateLookupItem');
               dojo.require('generated.application.ui.layout.small.ServiceAddressLookup');
               dojo.require('generated.application.ui.layout.small.landscape.MapView');
               dojo.require('generated.application.ui.layout.small.landscape.MapDetail');
            }


         }
,
         getLayout : function(layoutName, orientation) {

            this.screenOrientation = orientation;
            var screenBucket = this.layoutSize + '.' + this.screenOrientation;
            var proposedLayout = this.layoutMap[screenBucket][layoutName];
            if (!proposedLayout) {
               return proposedLayout;
            }
            return eval('new ' + proposedLayout + '()');

         }

      });
});

