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

define("platform/ui/control/DateTimePicker",
		[ "dojo/_base/declare",
		  "platform/ui/control/_ControlBase",
		  "dijit/layout/ContentPane",
		  "dojox/mobile/ValuePickerDatePicker",
		  "dojox/mobile/ValuePickerTimePicker",
		  "dojox/mobile/ValuePickerSlot",
		  "platform/ui/widget/Label",
		  "dojo/touch",
		  "dijit/focus",
		  "dojo/on",
		  "dojo/_base/lang",
		  "dojo/_base/array",
		  "dojo/query",
		  "dojo/dom-attr",
		  "dojo/dom-class",
		  "platform/translation/MessageService",
		  "platform/logging/Logger",
		  "dijit/registry",
		  "dojo/dom-construct",], 
function(declare, ControlBase, ContentPane, DatePicker, TimePicker, ValuePickerSlot, Label, touch, dijitFocus, on, lang, array, query, domAttr, domClass, MessageService, Logger, registry, domConstruct) {
	return declare( ControlBase, {
		time: false,
		date: false,
		labelClassName: 'controlLabel horizontal lookupPickerLabel',
		dateLabel: null,
		timeLabel: null,
		
		constructor : function(options) {
			this._controlType = 'DateTimePicker';
			// Need to override the ValuePickerSlot methods to fix bug 
			//188766: APAR IV76233: Android 5 Date picker selector keeps scrolling forever,
			// If Dojo fixes this bug themselves, can remove this
			lang.extend(ValuePickerSlot, {
/**@memberOf platform.ui.control.DateTimePicker */
				_onClick: function(e){
					// summary:
					//		Internal handler for click events.
					// tags:
					//		private
					if(e && e.type === "keydown" && e.keyCode !== 13){ return; }
					if(this.onClick(e) === false){ return; } // user's click action
					domClass.add(e.currentTarget, "mblValuePickerSlotButtonSelected");
					
					var node = e.currentTarget;
					if(node === this.plusBtnNode || node === this.minusBtnNode){
						this._btn = node;
					}
					this.spin(this._btn === this.plusBtnNode ? 1 : -1);
					setTimeout(lang.hitch(this, function(e){
						domClass.remove(this._btn, "mblValuePickerSlotButtonSelected");
					}), 300);
				},
				startup: function(){
					if(this._started){ return; }
					this._handlers = [
						this.connect(this.plusBtnNode, "onclick", "_onClick"),
						this.connect(this.minusBtnNode, "onclick", "_onClick"),
						this.connect(this.plusBtnNode, "onkeydown", "_onClick"), // for desktop browsers
						this.connect(this.minusBtnNode, "onkeydown", "_onClick"), // for desktop browsers
						this.connect(this.inputNode, "onchange", lang.hitch(this, function(e){
							this._onChange(e);
						}))
					];
					this.inherited("startup", arguments);
					this._set(this.plusBtnLabel);
				}
			});
		},

		build : function() {
			// summary:
			// Build the control
			//
			// description:
			// This is where we setup all internals and create any
			// widgets
			
			this.setupType();
			this.baseWidget = this.createWidget( ContentPane, {
				id: this.getId(),
				style: 'margin: 5px;'
			});
			var date = this.getResource().getCurrentRecord().getAsDateOrNull('date');
			Logger.trace(date);
			if(date==null || date < 0){
				date = new Date();
			}
			
			if(this.time || !this.date){
				var timeValues = new Array(date.getHours(),date.getMinutes());
				timeValues[0]=date.getHours().toString();
				var mins = date.getMinutes();
				timeValues[1]=((mins<10)?'0':'')+date.getMinutes().toString();
				this.timeWidget = this.createWidget(TimePicker, {
					id: this.getId() + '_tPicker',
				   'class': 'timePicker',
					values: timeValues
				});

				this.labelFor = this.timeWidget.id;
			    this.timeLabel = (new Label({
			    	idExtension: '_timeLabel',
			    	control: this, 
			    	label: MessageService.createStaticMessage('time').getMessage()
			    })).build();
			    on(this.timeLabel, touch.press, lang.hitch(this, function(e){
			    	dijitFocus.focus(this.timeWidget.domNode);
			    }));
		    	this.baseWidget.addChild(this.timeLabel);
		    	this.baseWidget.addChild(this.timeWidget);
			}

			if(this.date){
				//month is 0 based, but widget expects 1 based. And use date, not utc-date as we need local.
				var dateValues = new Array(date.getUTCFullYear(),date.getUTCMonth()+1,date.getDate()); 
				this.dateWidget = this.createWidget(DatePicker, {
					id: this.getId() + '_dPicker',
				   'class': 'datePicker',
					values: dateValues
				});
				this.labelFor = this.dateWidget.id;
			    this.dateLabel = (new Label({
			    	idExtension: '_dateLabel',
			    	control: this, 
			    	label:MessageService.createStaticMessage('date').getMessage()
			    })).build();
			    on(this.dateLabel, touch.press, lang.hitch(this, function(e){
			    	dijitFocus.focus(this.dateWidget.domNode);
			    }));
		    	this.baseWidget.addChild(this.dateLabel);
				this.baseWidget.addChild(this.dateWidget);
			}
			
			var returnVal = this.inherited(arguments);
			
			if(this.time && this.date && this.dialogControl && this.dialogControl.label)
			{
				this.dialogControl.label.textMsg = MessageService.createStaticMessage('DateTimeLookup.datetimelabel').getMessage();
			}
			else if (this.time && !this.date)
			{
				this.dialogControl.label.textMsg = MessageService.createStaticMessage('DateTimeLookup.timelabel').getMessage();
			}
			else if (!this.time && this.date)
			{
				this.dialogControl.label.textMsg = MessageService.createStaticMessage('DateTimeLookup.datelabel').getMessage();
			}
			
			return returnVal;
		},

		setupType: function(){
			var currentObject = this.application.ui.currentObjectStack[this.application.ui.currentObjectStack.length-1];
			var resourceSet = currentObject.getResource();
			var currentResource = resourceSet.getCurrentRecord();
			var fieldInfo = currentResource.getMetadata().getField(currentObject['resourceAttribute']);
			switch(fieldInfo.dataType){
				case 'date':
					this.date = true;
					this.time = false;
					break;
				case 'datetime':
					if(fieldInfo.usage == 'time') {
						this.date = false;
						this.time = true;
					}
					else if(fieldInfo.usage == 'date') {
						this.date = true;
						this.time = false;
					}
					else {
						this.date = true;
						this.time = true;
					}
					break;
				case 'time':
					this.time = true;
					this.date = false;
					break;
			}
		},
		
		getCurrentDate: function(){
			var newDate = new Date();
			if(this.dateWidget){
				var date = this.dateWidget.get('value').split('-');
				newDate = new Date(date[0],date[1]-1,date[2]);
			}
			if(this.timeWidget){
				newDate.setHours(this.timeWidget.get('values')[0]);
				newDate.setMinutes(this.timeWidget.get('values')[1]);
			}
			
			return newDate;
		},
		
		updateDateFromWidget: function(widget){
			//this.getResource().getCurrentRecord().set('date', this.getCurrentDate());
			this.getResource().getCurrentRecord().setDateValue('date', this.getCurrentDate());
		},
		
		postCreate : function() {
			// summary:
			// To be implemented by children
			//
			// description:
			// Will be called after all controls are built and placed in
			// the DOM
			if(this.dateWidget){
				this.dateWidget.startup();
				//Needed to separate events as combining them did not work
				on(this.dateWidget, 'MonthSet', lang.hitch(this, function(){
					this.updateDateFromWidget(this.dateWidget);
				}));
				on(this.dateWidget, 'DaySet', lang.hitch(this, function(){
					this.updateDateFromWidget(this.dateWidget);
				}));
				on(this.dateWidget, 'YearSet', lang.hitch(this, function(){
					this.updateDateFromWidget(this.dateWidget);
				}));
			}
			if(this.timeWidget){
				this.timeWidget.startup();
				on(this.timeWidget, 'ValueChanged', lang.hitch(this, function(slot){
					if(!this.oldValue || this.oldValue != this.value){
						this.oldValue = this.value;
						this.updateDateFromWidget(this.timeWidget);
					}
				}));
				var control = this;
				dojo.query('.mblValuePickerSlotInput', this.baseWidget.domNode).forEach(function(slot){
					on(slot, 'change', function(){
						if(!this.oldValue || this.oldValue != this.value){
							this.oldValue = this.value;
							control.updateDateFromWidget(control.timeWidget);
						}
					});
				});
				var slots = this.timeWidget.getSlots();
				array.forEach(slots, function(slot, index){
					if(slot.get('value')==0){
						slot.set('value', '00');
					}
				});
				var ampmButton = query(".mblToolBarButton", this.timeWidget.domNode)[0];
				if(ampmButton){
					var newId = '_AM_PM';
					domAttr.set(ampmButton, {'id':newId,'aria-controls': newId});
				}
			}
			
			query('.mblValuePickerSlot', this.baseWidget.domNode).forEach(function(slot, index, arr){
				var slotId = slot.id.substring(0, slot.id.lastIndexOf('_')+1) + index;
				domAttr.set(slot, {'id':slotId});
				query('.mblValuePickerSlotButton', slot).forEach(function(button){
					var newId = slotId+(button.title=='+'?'_plus':'_minus');
					domAttr.set(button, {'id':newId,
										 'aria-controls': newId});
				});
				query('.mblValuePickerSlotInput', slot).forEach(function(input){
					var newId = slotId + '_input';
					domAttr.set(input, {   'id':newId,
						 					'aria-controls': newId});
				});
			});
			
			this.baseWidget.startup();
			
			this.inherited(arguments);
			this.updateDateFromWidget();
		},

		destroy : function() {
			// summary:
			// Destroy this control's baseWidget
			//
			// description:
			// Use to clean up this object
			this.inherited(arguments);

        	if(this.dateLabel){
        		domConstruct.destroy(this.dateLabel);
            	this.dateLabel = null;
        	}
        	if(this.timeLabel){
        		domConstruct.destroy(this.timeLabel);
            	this.timeLabel = null;
        	}
		    if (this.dateWidget) {
		    	this.dateWidget.destroyRecursive();
		    	this.dateWidget = null;
		    }

		    if (this.timeWidget) {
		    	this.timeWidget.destroyRecursive();
		    	this.timeWidget = null;
		    }
		}
	});
});
