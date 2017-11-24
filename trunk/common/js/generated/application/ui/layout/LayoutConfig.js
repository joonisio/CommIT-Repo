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
// Build: 2017-11-23 18:08:46
//----------------------------------------------------------------//
define("generated/application/ui/layout/LayoutConfig",
   [],
function() {

         //
         // AUTO-GENERATED FILE CREATED ON: 2017-11-23 18:08:46
         //
   // private constants
   var FLD_LAYOUT_SIZE = 'layout_size';
   var FLD_MIN_WIDTH = 'min_width';
   var FLD_MAX_WIDTH = 'max_width';

   // private state data
   var LAYOUT_CONFIGURATIONS = [];
   var screenConfig;

   screenConfig = {};
   screenConfig[FLD_LAYOUT_SIZE] = 'small';
   screenConfig[FLD_MIN_WIDTH] = '1';
   screenConfig[FLD_MAX_WIDTH] = '3';
   LAYOUT_CONFIGURATIONS.push(screenConfig);

   screenConfig = {};
   screenConfig[FLD_LAYOUT_SIZE] = 'medium';
   screenConfig[FLD_MIN_WIDTH] = '3';
   screenConfig[FLD_MAX_WIDTH] = '5.5';
   LAYOUT_CONFIGURATIONS.push(screenConfig);

   screenConfig = {};
   screenConfig[FLD_LAYOUT_SIZE] = 'large';
   screenConfig[FLD_MIN_WIDTH] = '5.5';
   screenConfig[FLD_MAX_WIDTH] = '8';
   LAYOUT_CONFIGURATIONS.push(screenConfig);

   screenConfig = {};
   screenConfig[FLD_LAYOUT_SIZE] = 'xlarge';
   screenConfig[FLD_MIN_WIDTH] = '8';
   screenConfig[FLD_MAX_WIDTH] = '15';
   LAYOUT_CONFIGURATIONS.push(screenConfig);

   return {
   // public constants - accessed as functions
   FLD_LAYOUT_SIZE : function() { return FLD_LAYOUT_SIZE },
   FLD_MIN_WIDTH : function() { return FLD_MIN_WIDTH },
   FLD_MAX_WIDTH : function() { return FLD_MAX_WIDTH },

      getLayoutConfigs : function() {
         return LAYOUT_CONFIGURATIONS;
      },
   };
});

