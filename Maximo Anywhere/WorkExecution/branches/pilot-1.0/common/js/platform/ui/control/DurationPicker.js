/*
 * Licensed Materials - Property of IBM
 * "Restricted Materials of IBM"
 *
 * 5725-M39
 *
 * (C) COPYRIGHT IBM CORP. 2013 All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp. 
 *
 */

define("platform/ui/control/DurationPicker",
		[ "dojo/_base/declare",
		  "platform/ui/control/_ControlBase",
		  "dijit/layout/ContentPane",
		  "dojox/mobile/ValuePicker",
		  "dojox/mobile/ValuePickerSlot",
		  "dojo/on",
		  "dojo/_base/lang",
		  "dojo/_base/array",
		  "platform/format/FormatterService",
		  "platform/ui/widget/Label",
		  "dojo/touch",
		  "dijit/focus",
		  "dojo/query",
		  "dojo/dom-attr",
		  "platform/translation/MessageService",
		  "platform/exception/PlatformRuntimeException",
		  "platform/logging/Logger",
		  "dojo/dom-construct",], 
function(declare, ControlBase, ContentPane, ValuePicker, ValuePickerSlot, on, lang, array, FormatterService, Label, touch, dijitFocus, query, domAttr, MessageService, PlatformRuntimeException, Logger, domConstruct) {
	return declare( ControlBase, {
		sep: ":",
		labelClassName: 'controlLabel horizontal lookupPickerLabel',
		durationLabel: null,
		
		constructor : function(options) {
			this._controlType = 'DurationPicker';
		},

/**@memberOf platform.ui.control.DurationPicker */
		build : function() {
			// summary:
			// Build the control
			//
			// description:
			// This is where we setup all internals and create any
			// widgets
			this.baseWidget = this.createWidget(ContentPane, {
				id: this.getId(),
				style: 'margin: 5px;'
			});
			var duration = this.getResource().getCurrentRecord().get("duration");
	        var formattedDuration = FormatterService.toDisplayableValue(duration, 'duration', this.application.getUserLocale());
	        if(formattedDuration==''){
	        	formattedDuration = '0:00';
	        }
			var durationHoursMins = formattedDuration.split(":");
			array.forEach(durationHoursMins, function(val, index){
				if(typeof durationHoursMins[index] == undefined || typeof durationHoursMins[index] == ''){
					durationHoursMins[index] = '0';
				}
			});
			this.valuePicker = this.createWidget(ValuePicker, {
				id: this.getId() + '_vPicker',
			   'class': 'durationPicker'
			});
			
			this.hourSlot = this.createWidget(ValuePickerSlot, {labelFrom: 0, labelTo: 999, value: durationHoursMins[0], style:{width:" 90px"}});
			this.valuePicker.addChild(this.hourSlot);
			
			this.minuteSlot = this.createWidget(ValuePickerSlot, {labelFrom: 00, labelTo: 59, value: durationHoursMins[1], zeroPad: 2, style:{width:" 90px"}});
			this.valuePicker.addChild(this.minuteSlot);

			this.labelFor = this.valuePicker.id;
		    this.durationLabel = (new Label({control: this, label:MessageService.createStaticMessage('hoursandminutes').getMessage()})).build();
		    	this.addHandler(on(this.durationLabel, touch.press, lang.hitch(this, function(e){
		    		dijitFocus.focus(this.hourSlot.inputNode.domNode);
		    	})));
	    	this.baseWidget.addChild(this.durationLabel);
			
			this.baseWidget.addChild(this.valuePicker);
			
			return this.inherited(arguments);
			
		},

		updateDateFromWidget: function(widget){
			var newValue = this.getRawValue();
			if (newValue!='err') {
				this.getResource().getCurrentRecord().set('duration', newValue );
			}
		},
		
		getValue: function(){
			return this.hourSlot.value+this.sep+this.minuteSlot.value;
		},
		
		getRawValue: function() {
			try {
				return FormatterService.fromDisplayableValue(this.getValue(), 'duration', this.application.getUserLocale());
			} catch (throwable) {
				switch (true) {
				case (throwable instanceof PlatformRuntimeException):
					//Little hack to make the message only show once even though there are 3 keyup events sent
					if (this.application && this.application.ui && this.application.ui.getCurrentDialog()!=null) {
						this.application.showMessage(throwable.getMessage());
					}
					break;
				default: 
					Logger.error(throwable);
					break;
				}
			}
			return 'err';
		},
		
		postCreate : function() {
			// summary:
			// To be implemented by children
			//
			// description:
			// Will be called after all controls are built and placed in
			// the DOM
			
			query(".mblValuePickerSlotButton", this.baseWidget.domNode).forEach(function(button, index, arr){
				var parent = button.parentNode;
				domAttr.set(button, {"id":parent.id+(button.title=="+"?"_plus":"_minus")});
			});

			
			this.baseWidget.startup();
			this.valuePicker.startup();
			
			on(this.valuePicker, 'valuechanged', lang.hitch(this, function(){
				this.updateDateFromWidget();
			}));
			on(this.hourSlot, 'keyup', lang.hitch(this, function(){
				this.onKeyup(this, this.hourSlot);
			}));
			on(this.minuteSlot, 'keyup', lang.hitch(this, function(){
				this.onKeyup(this, this.minuteSlot);
			}));

			this.inherited(arguments);
			
		},
		
		// added to handle keyup events
		// valuechanged isn't firing when the valuepickerslot is edited with keyboard (is this a dojo bug??)
		// this function will catch the keyup event, set the slot.value, and update the picker
		onKeyup : function(picker, slot) {
			var inputNodeValue = slot.inputNode.value;
			if (inputNodeValue){
				slot.value = inputNodeValue;
			}
			picker.updateDateFromWidget();
		},

		destroy : function() {
			// summary:
			// Destroy this control's baseWidget
			//
			// description:
			// Use to clean up this object
			this.inherited(arguments);

		    if (this.valuePicker) {
		    	this.valuePicker.destroyRecursive();
		    	this.valuePicker = null;
		    }
		    if (this.hourSlot) {
		    	this.hourSlot = null;
		    }
		    if (this.minuteSlot) {
		    	this.minuteSlot = null;
		    }
		    if (this.durationLabel){
		    	domConstruct.destroy(this.durationLabel);
		    	this.durationLabel = null;
		    }
		}
	});
});
