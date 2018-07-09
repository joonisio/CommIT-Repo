/*
 * Licensed Materials - Property of IBM
 * "Restricted Materials of IBM"
 *
 * 5725-M39
 *
 * (C) COPYRIGHT IBM CORP. 2015 All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp. 
 *
 */
define("platform/ui/widget/SpecificationMixin", 
	   [ "dojo/_base/array",
	     "platform/ui/widget/_StoreListMixin",
	     "dojo/_base/declare",
	     "dojo/_base/lang",
	     "dojo/Deferred",
	     "dojo/promise/all",
	     "dojo/on",
	     "dojo/touch",
	     "dojox/mobile/ListItem",
	     "platform/handlers/_ApplicationHandlerBase",
	     "platform/model/ModelService",
	     "platform/translation/MessageService",
		 "platform/logging/Logger",
	     "platform/ui/control/ComboBox",
	     "platform/ui/control/Text",
	     "platform/translation/SynonymDomain"
	     ],
function(arrayUtil, StoreListMixin, declare, lang, Deferred, all, on, touch, ListItem, ApplicationHandlerBase, ModelService, MessageService, Logger, ComboBox, Text, SynonymDomain) {
	
	CONTROL_STYLE = 'display: inline; padding: 2px 10px 2px 10px !important';
	COMBOBOX_MAX_LENGTH = 4;
	LAYOUT_INSERT_AT = 'input1';
	var count = 0;
	
	return declare([StoreListMixin], {
			
		maxdomains : null,
				
/**@memberOf platform.ui.widget.SpecificationMixin */
		onComplete: function(/*Array*/items){
			// summary:
			//		A handler that is called after the fetch completes.
			
			var self = this;
			
			if (items.length > 0) {
				Logger.trace("[SPECIFICATIONS] Generating specification list of length: " + items.length);
				if (self.maxdomains == null) {
					Logger.trace("[SPECIFICATIONS] initializing maxdomain for the first time");
					ModelService.all('maxdomain', 'getmaxdomain').then(function(domains) {
						self.maxdomains = domains; 
						self.generateList(items);
					});
				}
				else {
					self.generateList(items);	
				}
			} else {
				Logger.trace("[SPECIFICATIONS] No specifications to render");
			}
		},			
		
		createListItem : function(/* Object */item) {
			var self = this;
			
			var deferred = new Deferred();
			
			var temp = lang.clone(self.control.listItemTemplate);
		    var currentRecord = item;
			temp.currentRecord = currentRecord;
			temp.setParentReference(self.control);	
			
			var props = {
				variableHeight : true,
			    control : temp,
			    item : item,
			    currentRecord : currentRecord,
			    'class' : (this.control.listItemTemplate['cssClass']?this.control.listItemTemplate['cssClass']:'') + ((currentRecord.transitionTo || this.control.transitionTo)?'':'hiddenChevron')
			};
			
			var uniqattrid = item.get('assetattrid');			
	    	props['id'] =  this.control.getId() + '_' + uniqattrid.replace(/\s+/g, '_');
	    	
		    var listItem = this.control.createWidget(ListItem, props);

		    temp.listControlId = props.id; 
			
			listItem.addChild(temp.build());
			
			if(item.domainid) {
				self.maxdomains.clearFilterAndSort();
				var maxdomain = self.maxdomains.filter('domainid == $1', item.domainid).getCurrentRecord();
				if (!maxdomain) {
					//Check to see if we have a valid domain
					Logger.errorJSON("[SPECIFICATIONS] While attempting to render", item);
					Logger.error("[SPECIFICATIONS] Could not find maxdomain for: " + item.domainid + " failing over to text control ");
					controlPromise = self._buildTextBoxControl(self.control, item, props.id);
				} else {
					//Using domain to build domain based control
					controlPromise = self._buildDomainBasedControl(self.control, item, maxdomain, props.id);
				}
			}
			else {
				controlPromise = self._buildTextBoxControl(self.control, item, props.id);
			}
			controlPromise.then(lang.hitch(self, function(inputControl) {				 
				on(inputControl, touch.press, function(e) {
					e.stopPropagation();
				});	
				inputControl.setParentReference(self.control.parentControl);
				inputControl.setMyResourceObject(self.control.getResource());
				inputControl.currentRecord = item;
				listItem.addChild(inputControl.build());
				deferred.resolve(listItem);
			}));
		
			return deferred.promise;
		},
				
		_buildTextBoxControl: function(parentControl, woSpec, parentId) {
			var deferred = new Deferred();
			var assetAttrTypes = parentControl.application.getResource("assetattrtypes");
			var resAttrName = (woSpec['datatype'] == SynonymDomain.resolveToDefaultExternal(assetAttrTypes, 'ALN')) ? 'alnvalue' : 'numvalue';
			var props = {
//				control: parentControl,
				id : parentId + "_tbcontrol",
				editable : true,
				placeHolder : MessageService.createStaticMessage('tapToEnter').getMessage(),
				layoutInsertAt : LAYOUT_INSERT_AT,
				resource : parentControl.resource,
				resourceAttribute : resAttrName,
				currentRecord : woSpec,
				style: CONTROL_STYLE,
				modelData: woSpec,
				required : woSpec.mandatory
			};
			
		    var inputControl = parentControl.createWidget(Text, props);			
			deferred.resolve(inputControl);
			return deferred.promise;
		},
		
		_buildDomainBasedControl: function(parentControl, woSpec, maxdomain, parentId) {
			var deferred = new Deferred();
			var domainType = null, resAttrName = null; lookupName = null;
			var domainTypes = parentControl.application.getResource("domaintypes");
			var domainObject = null;
			domainTypes.clearFilterAndSort();
			switch(maxdomain.domaintype) {
				case SynonymDomain.resolveToDefaultExternal(domainTypes, 'ALN'):
					domainObject = maxdomain.alndomain.data ? maxdomain.alndomain.data : maxdomain.alndomain;
					domainType = 'alndomain';
					resAttrName = 'alnvalue';
					lookupName = 'Inspection.alnDomainLookup';
					break;
				case SynonymDomain.resolveToDefaultExternal(domainTypes, 'NUMERIC'):
					domainObject = maxdomain.numericdomain.data ? maxdomain.numericdomain.data : maxdomain.numericdomain;
					domainType = 'numericdomain';
					resAttrName = 'numvalue';
					lookupName = 'Inspection.NumericLookup';
					break;
				default:
					domainObject = maxdomain.alndomain.data ? maxdomain.alndomain.data : maxdomain.alndomain;
					domainType = 'alndomain';
					resAttrName = 'alnvalue';
					lookupName = 'Inspection.alnDomainLookup';
					break;
			}
			var inputControl = null;
			maxdomain.getModelDataSet(domainType, true)
			.then(function() {
				maxdomain[domainType].clearFilterAndSort();
				if(maxdomain[domainType].count() > COMBOBOX_MAX_LENGTH) {
					// textbox with a lookup
					var props = {
//						control: parentControl,
						editable : false,
						id : parentId + "_tbcontrol",
						placeHolder : {textMsg: MessageService.createStaticMessage('selectFromList').getMessage()},
						layoutInsertAt : LAYOUT_INSERT_AT,
						resource : parentControl.resource,
						resourceAttribute : resAttrName,
						currentRecord : woSpec,
						lookup: lookupName,
						lookupAttribute: 'description',
						style: CONTROL_STYLE,
						modelData: woSpec,
						dynamicBuild : true,
						required : woSpec.mandatory
					};
				    inputControl = parentControl.createWidget(Text, props);
				}
				else {
					// combobox
					var props = {
						attrType: woSpec.datatype, 
//						control: parentControl,
						id : parentId + "_combocontrol",
						editable : false,
						placeHolder : MessageService.createStaticMessage('tapToSelect').getMessage(),
						layoutInsertAt : LAYOUT_INSERT_AT,
						resource : parentControl.resource,
						resourceAttribute : resAttrName,
						currentRecord : woSpec,
						style: CONTROL_STYLE,
						cssClass: "specificationText",
						domain: domainObject,
						domainIdAttr: domainType + 'id',
						domainSearchAttr: 'description',
						modelData: woSpec,
						required : woSpec.mandatory
					};
					inputControl = parentControl.createWidget(ComboBox, props);
				}
				deferred.resolve(inputControl);
			});
			return deferred.promise;
		},
		
	});
});
