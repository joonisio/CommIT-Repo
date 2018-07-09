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

define("platform/ui/widget/_StoreListMixin", [
        "platform/model/ModelData",
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/dom-construct",
        "dojox/mobile/_StoreListMixin",
        "dojox/mobile/ListItem",
        "dojo/_base/lang",
        "dojo/touch",
        "dojo/on",
        "dojox/gesture/tap",
        "dojo/query",
        "dijit/focus", 
        "dojo/_base/event",
        "dijit/registry",
        "dojo/dom-class",
        "platform/translation/MessageService", 
        "platform/logging/Logger",
        "platform/ui/DeviceEnv",
        "platform/util/PlatformConstants",
        "platform/model/ModelService",
        "dojox/mvc/Output",
        "dojo/when",
        "dojo/dom-attr"], 
function(ModelData, array, declare, domConstruct, StoreListMixin, ListItem, lang, touch, on, tap, query, dijitFocus, event, registry, 
		domClass, MessageService, Logger, DeviceEnv, PlatformConstants, ModelService, Output, when, domAttr) {
	// module:
	// dojox/mobile/_StoreListMixin

	return declare(StoreListMixin, {
	    // summary:
	    // Mixin for widgets to generate the list items corresponding to
	    // the dojo/store data provider object.
	    // description:
	    // Mixin for widgets to generate the list items corresponding to
	    // the dojo/store data provider object.
	    // By mixing this class into the widgets, the list item nodes are
	    // generated as the child nodes of the widget and automatically
	    // regenerated whenever the corresponding data items are modified.
		LONGTAPTHRESHOLD: 1000,  // Long tap threshold in ms
		pageSize: 15,
		endIndex: 0,
		startIndex: 0,
		currentQueryBase: '',
		
/**@memberOf platform.ui.widget._StoreListMixin */
		generateList: function(/*Array*/items){
						
			var controlResource = this.control.getResource();
			if ((this.control.displayPageSize) && (this.control.displayPageSize > 0)) {
				this.pageSize = parseInt(this.control.displayPageSize,10);
			}
			else if(this.control.useLongList){
				this.pageSize = 3000;
			}
			
			var index = controlResource.getCurrentIndex();
			if ((index > -1) && (index < controlResource.count())) {
				this.setPageBasedOnIndex(index);
			} else {
				this.setPageBasedOnIndex(0);
			}
			//The list header is not shown if the findByScan control is visible or fi not on the first page of results
			if (this.control.isFindByScanShown() || ((this.startIndex > 0) && (this.control.hideEmpty == false))) {
				this.control.doHideHeader();
			} else {
				this.control.doShowHeader();	
			}
			
			this.endIndex = this.control.useLongList ? 10000 : (this.startIndex+this.pageSize > items.length) ? items.length : this.startIndex+this.pageSize;
			this.control.application.log('using startindex {0} and endindex {1}', 1, [this.startIndex, this.endIndex]);
			var pageItems = this.control.useLongList?items:items.slice(this.startIndex,this.endIndex);
						
			this.control.destroyListItems();
									
			var hasPrevious = this.control.useLongList?false:(this.startIndex > 0);
			var hasNext = this.control.useLongList?false:((items.length>this.endIndex) || ((this.endIndex + this.pageSize) > controlResource.count()) && (!controlResource.isFiltered()) && (controlResource.hasNextPageOfData()));
						
			//inserted for server only mode =, if the number of the itens downloaded was reach
			//we will not download the next 200 but hide the next page button.
			if (controlResource.getMetadata().serverOnlyMode && items.length == this.endIndex){
				hasNext = false;
			}
			
			if (hasPrevious || (hasNext && hasPrevious)) {
				this.addChild(this.createOverflowItem(hasPrevious, hasNext));
			}
			
			var self = this;
			array.forEach(pageItems, function(item, index){
				when(this.createListItem(item, index), function(createdItem) {
					self.addChild(createdItem);
					if(item[self.childrenProperty]) {
						array.forEach(item[self.childrenProperty], function(child, index){
							when(self.createListItem(child, index), function(createdItem) {
								self.addChild(createdItem);
							});
						}, self);
					}
				});				
			}, self);

			if (hasPrevious || hasNext) {
				this.addChild(this.createOverflowItem(hasPrevious, hasNext));			
			}
				
			domAttr.set(self.domNode, 'role', 'list');
			
			if (controlResource.count() > 0 && controlResource.getCurrentIndex() === -1){
				controlResource.setCurrentIndex(this.startIndex);
			}
		},
		
		setPageBasedOnIndex: function(index){
			this.startIndex = (Math.floor(index/this.pageSize)) * this.pageSize;
		},
		
		_afterPageChange : function(resource, newIndex){
			resource.setCurrentIndex(newIndex);
			if (this.control.hideEmpty) {
				this.control.parentControl.scrollIntoView(this.control);										
			} else {
				this.control.parentControl.baseWidget.scrollTo({x: 0, y: 0});	
			}
			this.control.refresh(true);
			this.control.application.hideBusy();
		},

		_pageForward: function(metrics){
			var resource = this.control.getResource(); 
			if ((this.endIndex + this.pageSize) > resource.count() && !resource.getMetadata().additionalData &&
					((metrics && (!metrics.isAllDataDownloaded() || metrics.getServerCount() > resource.count())) || resource.hasNextPageOfData())){
				var self = this;
				var loadNextPage = function(useLocal) { 
					ModelService.loadNextPage(resource, useLocal).then(function(result){
						if (result) {
							Logger.trace('loaded new page of data, set count=' + self.control.getResource().count());
							self._afterPageChange(resource, self.endIndex);
						}
						else {
							self.control.application.hideBusy();
							Logger.error('There was an error loading the next page of data');
							self.control.ui.showMessage(MessageService.createStaticMessage('nofetchnextpage').getMessage());
						}
					});
				};
				if (metrics){
					this.control.application.showBusy();
					metrics.canGetNextPageFromLocal(resource.getPageCountInMemory() + 1).then(function(useLocal){
						if(useLocal || resource.hasNextPageOfData()){
							//Has a next page of data that can be loaded into the resource
							loadNextPage(useLocal);
						}
						else if (resource.count() > self.endIndex){
							//There is data remaining to be display on the next list page so show it 
							self._afterPageChange(resource, self.endIndex);  
						}
						else{
							//No longer a next page after a refresh so tell user they are at the last page
							self._afterPageChange(resource, self.startIndex); 
							self.control.ui.showMessage(MessageService.createStaticMessage('listAtLastWhenNextPage').getMessage());
						}
					});
					return;
				}
				else if (resource.hasNextPageOfData()) {
					this.control.application.showBusy();
					loadNextPage(false);
					return;
				}
			}
			this._afterPageChange(resource, this.endIndex);
		},

		page: function(direction, item){
			var resource = this.control.getResource(); 
			var metaData = resource.getMetadata();
			var metrics = metaData.getResourceMetrics(resource.getQueryBase());
			
			if (metrics){
    			var latestResource = this.control.application.getResource(resource.name);
				if (resource != latestResource){
					//Resource for the list was refreshed so use the new on
					this.control.setMyResourceObject(latestResource);
					resource = latestResource;
	    			if(this.control.refreshButton){
	    				this.control.refreshButton.setDisplay(false);
	    			}
				}
			}
			if (direction == 1){
				this._pageForward(metrics);
			}
			else{
				this._afterPageChange(resource, (this.startIndex - this.pageSize) > 0 ? (this.startIndex - this.pageSize) : 0);
			}
		},

        createOverflowItem: function(hasPrevious, hasNext) {

        	var moreItem = this.control.createWidget(ListItem, {
            	variableHeight : false,
            	parentControl: this,
            	clickable: false 
            });
            
            domClass.add(moreItem.domNode, 'pagingRow');
            moreItem.labelNode.hidden=true;
            
            if (hasPrevious) {
                var prevWidget = this.control.createWidget(Output, {
                	listControl: this,
                	layout: 'left',
    				'class': 'previousButton'
    			});

    			moreItem.addChild(prevWidget, 0);
                prevWidget.domNode.innerHTML = '<span>&nbsp;</span>';
    			
                this.control.addHandler(on(prevWidget, tap, lang.hitch(prevWidget, function(e){
    				this.listControl.control.nextPrevButtonSkip=true;
    				this.listControl.page(-1, prevWidget);
    			})));
            }

            if (hasNext) {
                var nextWidget = this.control.createWidget(Output, {
                	listControl: this,
                	layout: 'right',
                	role: 'presentation',
                	'aria-label': MessageService.createStaticMessage('next').getMessage(),
    				'class': 'nextButton'
    			});
                                
    			moreItem.addChild(nextWidget);
    			nextWidget.domNode.innerHTML = '<span>&nbsp;</span>';
    			    			
    			this.control.addHandler(on(nextWidget, tap, lang.hitch(nextWidget, function(e){
    				this.listControl.control.nextPrevButtonSkip=true;
    				this.listControl.page(1, nextWidget);
    			})));
            }
                        
            return moreItem;
        },
		
	    getDataCss : function(cssAttributes, record){
	    	var css = '';
	    	if(cssAttributes){
	   			array.forEach(cssAttributes, function(attribute){
    				var value = record.get(attribute);
    				if(!isNaN(value)){ //cannot have numeric css class
    					value = '_' + value;
    				}
	    			css += ' ' + value;
	   			});
	    	}
	    	return css;
	    },
        
	    createListItem : function(/* Object */item, index) {
		    // summary:
		    // Creates a list item widget.
	    	this.control.logger.timerStart('build list item', 2);
	    	
		    var temp = lang.clone(this.control.listItemTemplate);
		    var currentRecord = item;
		    
		    temp.setParentReference(this.control);
		    temp.currentRecord = currentRecord;
		    
		    this.moveTo = (currentRecord.transitionTo) ? currentRecord.transitionTo : (this.control.transitionTo) ? this.control.transitionTo : '';
		    this.transition = (currentRecord.transition) ? currentRecord.transition : "slide";

		    var props = {
		        variableHeight : true,
		        control : temp,
		        item : item,
		        transitionInfo : {
		            moveTo : this.moveTo,
		            transition : this.transition
		        },
		        currentRecord : currentRecord,
		        'class' : (this.control.listItemTemplate['cssClass']?this.control.listItemTemplate['cssClass']:'') + ((currentRecord.transitionTo || this.control.transitionTo)?'':' hiddenChevron') + this.getDataCss(this.control.listItemTemplate.cssAttributes, currentRecord)
		    }; 

	    	props['id'] =  this.control.getId() + '_' + item.getKeyDataAsString();
	    	
	    	var oldWidget = registry.byId(props.id);
	    	var count = -1;
			while(oldWidget){
				count++;
				oldWidget = registry.byId(props.id+'_'+count);
				this.control.badKeys = true;
			}
			if(count>=0){
				props['id'] = props.id +'_' + count;
			}

			props['class'] = props['class'] + ((index%2 != 0)?" oddListItem":" evenListItem");  

		    var listItem = this.control.createWidget(ListItem, props);

		    temp.listControlId = props.id; 
		    listItem.addChild(temp.build());

		    array.forEach(item['eventHandlers'], lang.hitch(listItem, function(handler) {
		    	if(handler.event=='click'){
		    		listItem.set('clickable', true);
		    		listItem.control.addHandler(on(listItem.domNode, touch.press, lang.hitch({'handler':handler,'listItem':listItem}, function(e) {
					    if (this.listItem.control.enabled == false) {
						    return;
					    }
					    dijitFocus.focus(this.listItem.domNode);
					    listItem.control.ui.hideCurrentMenu();
					    var handlerClass = listItem.control.application[this.handler['class']];
					    if(!handlerClass){
					    	listItem.control.application.log("No class({1}) found for defined click event of control({0}).", 0, [ listItem.control.artifactId, this.handler['class'] ]);
					    	return;
					    } 
					    if(!handlerClass[this.handler.method]){
					    	listItem.control.application.log("No handler({2}.{1}) found for defined click event of control({0}).", 0, [ listItem.control.artifactId, this.handler.method, this.handler['class'] ]);
					    	return;
					    }
					    if(listItem.item.closeDialog){
					    	listItem.control.ui.hideCurrentDialog();
					    }
				    	handlerClass[this.handler.method](this.listItem.control);
		    		})));
		    	}
		    }));

		    array.forEach(temp['eventHandlers'], lang.hitch(listItem, function(handler) {
		    	if(handler.event=='click'){
		    		listItem.set('clickable', true);
		    	}
		    }));
		    
		    if(this.moveTo && this.moveTo.length>0){
		    	listItem.set('clickable', true);
		    	var that = this;
    		    this.control.addHandler(on(listItem.domNode, tap, function(e) {
    		    	that.setCurrentRecord(listItem);
    			    event.stop(e);
    		    }));
		    }
		    
		    if (this.control.itemactions && this.control.itemactions.length > 0) {
		    	listItem.set('clickable', true);
		    	this.control.addHandler(on(listItem.domNode, 'click', lang.hitch(listItem.control, function(e) {
				    event.stop(e);
			    })));

			    tap.holdThreshold = this.LONGTAPTHRESHOLD;
			    this.control.addHandler(on(listItem.domNode, tap.hold, lang.hitch(listItem.control, function(e) {
				    Logger.trace('tap.hold');
				    event.stop(e);
				    this.ensureRecordFocus();
				    //this.getResource().setCurrentIndexByRecord(this.getCurrentRecord());
				    // need to setup data for longPress here
				    var actions = this.parentControl.itemactions;

				    if(this.currentRecord.isErrored()){
				    	actions = this.parentControl.ui.errorActions.children;
				    }
				    
				    if (actions && actions.length){ 
					    var longPress = this.application.getResource(PlatformConstants.LONGPRESS_RESOURCE);
					    if (longPress) {
						    longPress.data = new Array();
						    var control = this.parentControl;
						    array.forEach(actions, lang.hitch(longPress, function(action) {
						    	var show = true;
					    		action.display = true;
					    		action.enabled = true;
					    		array.some(action['eventHandlers'], lang.hitch(listItem, function(handler) {
							    	if(handler.event=='render') {
									    var handlerClass = listItem.control.application[handler['class']];

									    // Attach the list item control
									       action.setParentReference(listItem.control);
									    
									    handlerClass[handler.method](action);
									    if(!action.clickable()){
									    	show = false;
									    }
							    	}
					    		}));
					    		if(show){
    							    var rec = longPress.createNewRecord(false);
    							    if(!rec.getMetadata()['keyFields']){
    							    	rec.getMetadata()['keyFields'] = [{'name':'identifier'}];
    							    }
    							    array.forEach(Object.keys(action), lang.hitch(rec, function(key) {
    								    var value = action[key];
    								    if (key == 'label') {
    									    rec[key] = control.application.getProperty(value);
    								    } else if (key == 'transitionTo') {
    									    rec[key] = value;
    								    }
    								    rec["identifier"] = action.id;
    							    }));
    							    if(action.eventHandlers){
    							        rec['eventHandlers'] = action.eventHandlers;
    							    }
    							    rec['closeDialog'] = true;
					    		}
						    }));
						    if(longPress.data.length == 0){
						    	return;
						    }
						    longPress.parentRecord = this.currentRecord;
						    var dialog = registry.byId(this.LIST_LONGPRESS);
						    if (dialog) {
							    var label = '';
							    try {
								    label = listItem.control.parentControl.recordLabel;
								    if (label) {
								    	dialog.parentControl.label = label;
									    dialog.parentControl.resolverClass = label.resolverClass;
									    dialog.parentControl.resolverFunction = label.resolverMethod;
								    }
							    } catch (error) {
								    delete dialog.parentControl.label;
							    }
							    this.ui.show(dialog.id);
							    dialog.parentControl.opener = listItem.domNode;
						    }
					    }

				    }
			    })));
		    }
		    
		    temp.render();
		    this.setListIcons(listItem);
		    var currentIndex = this.control.getResource().getCurrentIndex();
			if(index==currentIndex){
		    	domClass.add(listItem.domNode, 'currentRecord');
			}
			else {
				domClass.remove(listItem.domNode, 'currentRecord');
			}

		    this.control.logger.timerEnd('build list item', 2);
		    domAttr.set(listItem.domNode, 'resourceIndex', this.startIndex+index);
		    domAttr.set(listItem.domNode, 'aria-label', item.wonumanddescription);
		    domAttr.set(listItem.domNode, 'role', 'listitem');
		    return listItem;
	    },
	    
	    setCurrentRecord : function(listItem){
	    	if(listItem.control.ui.currentMenu){
	    		listItem.control.ui.hideCurrentMenu();
	    		return;
	    	}
	    	if(listItem.control.enabled == false){
	    		return;
	    	}
		    if(!listItem.control.ensureRecordFocus(listItem)){
		    	listItem.control.ui.showMessage(MessageService.createStaticMessage('listmismatch').getMessage());
		    	return;
		    }
		    this.control.ensureRecordFocus(listItem);
		    var resource = listItem.control.getResource();
		    if(resource.name == PlatformConstants.LONGPRESS_RESOURCE){
		    	listItem.control.ui.hideCurrentDialog();
		    }
		    var transitionView = listItem.control.ui.getViewFromId(listItem.transitionInfo.moveTo);
		    try {
		    	var committed = listItem.control.getResource().getCurrentRecord().wasCommittedToServer();
		    	if(committed || !transitionView.editableView){
			    	if(listItem.control.ui.isViewOnStack(listItem.transitionInfo.moveTo)>0){
			    		listItem.control.ui.returnToView(listItem.transitionInfo.moveTo);
			    	}
			    	else {
			    		listItem.control.ui.show(listItem.transitionInfo.moveTo, listItem.transitionInfo.transition);
			    	}
		    	}
		    	else {
		    		listItem.control.ui.show(transitionView.editableView, listItem.transitionInfo.transition, null, PlatformConstants.VIEW_MODE_OVERRIDE_EDIT);
		    	}
		    }
		    catch(error){
		    	listItem.control.ui.show(listItem.transitionInfo.moveTo, listItem.transitionInfo.transition);
		    }
	    },
	    
	    setListIcons: function(listItem){
	    	
		    var currentRec = listItem.currentRecord;
		    var errored = currentRec.isErrored();
		    if(errored){
		    	domClass.add(listItem.domNode, 'recordError');
		    	// if this listItem is errored, we know we have to show the error marker
		    	if (this.control.viewControl) {
		    		this.control.viewControl.setQueryErrorMarker(true);
		    	}
		    }
		    else {
		    	domClass.remove(listItem.domNode, 'recordError');
		    }
		    		    
		    if(!listItem.hasErrorLockWatches){
    	    	this.control.addResourceWatchHandle(currentRec.watch(PlatformConstants.ERRORED_ATTRIBUTE, lang.hitch({storeList: this, listItem: listItem}, function(attrName, oldValue, newValue){
    				this.storeList.setListIcons(this.listItem);
    		    })));
		    }
		    listItem.hasErrorLockWatches = true;
	    }
	    
	});
});
