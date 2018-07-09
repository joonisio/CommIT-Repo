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

define("platform/ui/control/List",
	   ["dojo/_base/declare",
	     "platform/ui/control/_ControlBase",
	     "platform/ui/control/_ContainerControlBase",
	     "platform/ui/control/Container",
	     "platform/ui/control/Text",
	     "platform/ui/control/Button",
	     "platform/ui/control/CheckBox",
	     "platform/ui/control/Image",
	     "dijit/layout/ContentPane",
	     "platform/ui/widget/Label",
	     "platform/ui/control/Link",
	     "dojo/dom-construct",
	     "dojox/mvc/getStateful",
	     "dojox/mvc/StatefulArray",
	     "dojo/_base/lang",
	     "dojo/_base/array",
	     "dojo/on",
	     "dijit/focus",
	     "dojo/dom-style",
	     "dojo/dom-class",
	     "dojo/dom-attr",
	     "dojox/mvc/at",
	     "dojo/_base/event",
	     "dijit/registry",
	     "dojo/query",
	     "dojo/dom-geometry",
	     "dojo/topic",
	     "dojo/Deferred",
	     "platform/ui/widget/EdgeToEdgeStoreList",
	     "platform/ui/widget/SpecificationStoreList",
	     "dojox/mobile/ListItem",
	     "dojo/touch",
	     "dojox/gesture/tap",
	     "dojox/gesture/swipe",
	     "platform/translation/MessageService",
	     "platform/translation/DynamicMessage",
	     "platform/util/PlatformConstants",
	     "platform/model/ModelService",
	     "platform/store/SystemProperties",
	     "platform/model/AdditionalDataManager",
	     "platform/store/_ResourceMetadataContext",
	     "platform/comm/_ConnectivityChecker",
	     "dojo/fx",
	     "platform/ui/widget/_LongListMixin",
	     "platform/logging/Logger"],
function (declare, ControlBase, ContainerControlBase, Container, Text, Button, CheckBox, Image, ContentPane, Label, Link, domConstruct,
		getStateful, StatefulArray, lang, array, on, dijitFocus, domStyle, domClass, domAttr, at, event, registry, query, domGeometry,  topic, Deferred, EdgeToEdgeStoreList, SpecificationStoreList, ListItem, touch,
		tap, swipe, MessageService, DynamicMessage, PlatformConstants, ModelService, SystemProperties, AdditionalDataManager, ResourceMetadataContext, ConnectivityChecker, fx, LongListMixin, Logger) {
    return declare(ContainerControlBase, {
        listWidget: null,
        header: null,
        container: null,
        showHeader: true,
        hideSort: false,
        sortMenu: 'platform.sortMenu',
        isFiltered: false,
        label: null,
        lookupFilter: null,
        errorWatch: null,
        collapsible: false,
        collapsed: false,
        hideEmpty: false,
		badKeys: false,
		searchable: false,
		emptyRow: null,
		emptyRowLabel: null,
        refreshButton: null,
        reloadButton: null,
        sortLabel: null,
        labelElement: null,
        countLabel: null,
        exactButton: null,
        searchField: null,
        searchButton: null,
        errorImage: null,
        errorCountLabel: null,
        errorSeparator: null,
		
        constructor: function (options) {
            this._controlType = 'List';
            //for cloning
            if(options){
            	this.originalOptions = options;
            }
            else if(this.originalOptions) {
            	options = this.originalOptions;
            }
            this.moveTo = (this.transitionTo && this.transitionTo.length > 0) ? "#" + this.transitionTo : "";
            if (!options || !options.transition) {
                this.transition = 'slide';
            }
            this.translatedSortLabel = MessageService.createDynamicMessage('sortby', 'platform.handlers._ApplicationHandlerBase', 'resolveSortLabel');
            if (this.sortOptions) {
                this.sortOptions = this.sortOptions.children;
            }
            this.listItemTemplate["listControlId"] = this.id + this._controlType;
            if (options && options.hideEmpty) {
                this.hideEmpty = true;
            }
            if (options && options.collapsible) {
                this.collapsible = true;
                if (options.defaultcollapsed) {
                    this.collapsed = true;
                }
            }
            if (options && options.useLongList) {
            	this.useLongList = options.useLongList ;
            }
        },

/**@memberOf platform.ui.control.List */
        getFilterAndSearchQuery: function (lookupFilter) {
            var currentModelDataSet = this.getResource();
            var filter = (lookupFilter || currentModelDataSet.lookupFilter);
            this.lookupFilter = filter;
            filter = (lang.isArray(filter)) ? filter : [filter];

            var searchString = null;
            if (this.searchRecord) {
            	searchString = this.searchRecord.get("search");
            }
            var query = filter;
            if (searchString && searchString.length > 0 && !this.searchRecord.get("fromscan")) {
                query = [];
                array.forEach(this.searchAttributes.children, function (child) {
                    array.forEach(filter, function (filterItem) {
                        var obj = {};
                        obj[child.name] = searchString;
                        lang.mixin(obj, filterItem);
                        query.push(obj);
                    });
                });
            } else if (!filter[0]) {
                return null;
            }
            return query;
        },

        applyDatabaseFilterAndSearch: function () {
            var currentModelDataSet = this.getResource();
            var query = this.getFilterAndSearchQuery();
            var searchString = null;
            if (this.searchRecord) {
            	searchString = this.searchRecord.get("search");
            }
            var isExactMatch = ((currentModelDataSet.lookupFilter && currentModelDataSet.lookupFilterExactMatch === false) ? false : true);

            if (searchString && searchString.length > 0) {
                isExactMatch = this.searchRecord.get('exact');
            }
            var self = this;
            if (query && Object.keys(query[0]).length) {
                return ModelService.filtered(currentModelDataSet.getResourceName(), currentModelDataSet.getQueryBase(), query, null, false, isExactMatch).
		    	then(function (dataSet) {
		    	    self.application.addResource(dataSet);
		    	});
            } else {
                return ModelService.all(currentModelDataSet.getResourceName(), currentModelDataSet.getQueryBase(), null, false).
		    	then(function (dataSet) {
		    	    self.application.addResource(dataSet);
		    	});
            }
        },

        build: function () {
            //		summary:
            //			Build the control
            //
            //		description:
            //			This is where we setup all internals and create any widgets
            if (!this.initialized) {
                this.initialized = true;
                if (this.viewControl) { //some lists (long press menu) don't have a specific view
                    this.viewControl.lists.push(this);
                }
            }
            this.useLongList = (this.useLongList != false && this.application.useLongLists != false) ;
            
            this.logger.timerStart('build list', 1);
            
            var currentModelDataSet = this.getResource();
            var metadata = (currentModelDataSet && currentModelDataSet.getMetadata());
            var serverOnlyMode = (metadata && metadata.serverOnlyMode);
            
            var performStoreSearch = this._setupSearchCriteria(metadata);
            var self = this;

            var listResourcePromise = null;
            if (this.viewControl && this.viewControl.isLookup() && currentModelDataSet) {
                var result = this.applyFilterToSet();
                if (result && result.then) {
                    result.then(function () {
                        currentModelDataSet = self.getResource();
                        //The handler set a json filter, so let's reload with filter applied in jsonstore
                        //or if you can perform a JSONStore search and there is a search value then apply that filter                      
                        if (currentModelDataSet.lookupFilter || performStoreSearch) {
                            listResourcePromise = self.applyDatabaseFilterAndSearch();
                        } else {
                            self.createMyResources();
                        }
                    });
                } else {
                    //The handler set a json filter, so let's reload with filter applied in jsonstore
                    //or if you can perform a JSONStore search and there is a search value then apply that filter                      
                    if (currentModelDataSet.lookupFilter || performStoreSearch) {
                        listResourcePromise = this.applyDatabaseFilterAndSearch();
                    } else {
                        this.createMyResources();
                    }
                }

            } else if (!serverOnlyMode && currentModelDataSet &&
					   this.searchRecord &&
					   currentModelDataSet.isFiltered() &&
					   this.searchRecord.get('fromscan')) {

                var searchString = this.searchRecord.get('search');
                currentModelDataSet.clearFilterAndSort().filter(searchString);

            } else {
                this.createMyResources();
            }

            this.sortOptionMenuItems = new Array();
            this.sortIndexResource = this.application.getResource('PlatformListSortResource');
            var sortIndexSet = this.sortIndexResource.clearFilterAndSort().filter("listid == '" + this.id + "'");
            var orderByUsed = null;
            if (sortIndexSet.count() == 0) {
                var index = 0;
                var orderBy = (metadata && metadata.orderBy);
                if (orderBy) {
                    array.some(this.sortOptions, function (sortOption, i) {
                        var sortOptionOrderBy = self.concatSortParams(self.getSortParams(i));
                        if (orderBy == sortOptionOrderBy) {
                            orderByUsed = sortOptionOrderBy;
                            index = i;
                            return true;
                        }
                        return false;
                    });
                }
                this.sortIndexResource.clearFilterAndSort();
                this.sortIndexRecord = this.sortIndexResource.createNewRecord();
                this.sortIndexRecord.set('index', index);
                this.sortIndexRecord.set('listid', this.id);
                this.sortIndexRecord.set('resourcename', this.resource);
                this.sortIndexRecord.set('orderby', orderByUsed);
                this.sortIndex = index;
                ModelService.save(this.sortIndexResource);
            }
            else {
                this.sortIndexRecord = sortIndexSet.getRecordAt(0);
                this.sortIndex = this.sortIndexRecord.get('index');
            }

            var listItemActions = this.listItemTemplate['itemactions'];
            if (listItemActions && listItemActions.children) {
                this['itemactions'] = listItemActions.children;
            }
            delete this.listItemTemplate['itemactions'];

            this.buildSortMenu();

            this.baseWidget = new ContentPane({
                'class': 'list'
            });


            if (this.showHeader) {
                // use a container with a layout so that truncation occurs
                this.header = new Container({
                    'cssClass': 'listHeader',
                    layout: (this.searchable ? 'ListHeaderWithSearch' : 'ListHeader')
                });
                this.header.setParentReference(this);
                //Need this control id for later to dynamically generate the ids
                this.header["listControlId"] = this.id + this._controlType;

                var sortable = this.hasSorting();

                // Sort needs the labels
                // We will not show the sort if the list is searchable
                // We will allow forcing to show the Label instead of the sort text
                if (sortable && !this.searchable && !this.hideSort) {
                    this.sortLabel = new Link({
                        control: this,
                        label: '',
                        labelClassName: (this.sortOptions.length <= 1 ? 'non' : '') + 'sortLabel textappearance-medium',
                        layoutInsertAt: 'sortLabel',
                        role: 'region'
                    });
                    this.header.addChild(this.sortLabel);
                }
                else if (this.label && !this.searchable) {
                    //We will not support the label if the list is searchable
                    this.labelElement = new Text({
                        control: this,
                        value: this.label,
                        layoutInsertAt: 'sortLabel',
                        role: 'region',
                        cssClass: 'nonsortLabel textappearance-medium'
                    });
                    this.header.addChild(this.labelElement);
                }
                var resource = this.getResource();

                var onErrorPage = resource._queryBaseName == '_errored';

                // If not on the error page, the count is the main count otherwise, we'll get from the error page
                if (!onErrorPage) {
                    this.countLabel = new Text({
                        control: this,
                        labelClassName: 'listCount textappearance-medium',
                        label: ' ',
                        editable: false,
                        cssClass: 'count',
                        role: 'presentation',
                        layoutInsertAt: 'count'
                    });
					this.header.addChild(this.countLabel);
                }


                //If this is a searchable List
                if (this.searchable) {
                	var list = this;
                	//domClass.add(this.header.domNode, 'listHeaderSearch');
                	this.header.cssClass += ' listHeaderSearch';
                	this.exactButton = new Button({
                        control: this,
                        label: MessageService.createStaticMessage('Exact').getMessage(),
                        layoutInsertAt: 'searchModifier',
                        resource: 'PlatformListSearchResource',
                        resourceAttribute: 'exact',
						cssClass : 'searchOptionsButton',
                        onTap: function () {
                            list.toggleExactSearch();
                        }
                    });

                    this.exactButton.states = {
                        'false': {
                            'label': MessageService.createStaticMessage('Contains'),
                        },
                        'true': {
                            'label': MessageService.createStaticMessage('Matches'),
                        },
                    };
                    this.exactButton.defaultState = 'false';
	    			
                    this.header.addChild(this.exactButton);

                    this.searchField = new Text({
                        control: this,
                        editable: true,
                        placeHolder: MessageService.createStaticMessage('Search').getMessage(),
                        layoutInsertAt: 'searchField',
                        resource: 'PlatformListSearchResource',
                        resourceAttribute: 'search'
                    });

                    this.header.addChild(this.searchField);

                    this.searchButton = new Button({
                        control: this,
                        layoutInsertAt: 'searchButton',
                        image: 'action_lookup_OFF.png',
                        'default': true,
						border : true,
                        onTap: function () {
                            list.search();
                        }
                    });
 
                    this.header.addChild(this.searchButton);

                } else {
                    //This is not a searchable list so it can have errors and refresh etc
                    var insertAt = 'errorCount';
                    var separatorDisplay = 'display: none;';
                    var errorClassName = 'errorCount textappearance-medium';
                    var errorImageDisplay = 'display: none;';

                    if (onErrorPage) {
                        insertAt = 'count';
                        errorClassName = 'listCount textappearance-medium';
                    }

                    this.errorImage = new Image({
                        control: this,
                        'image': 'msg_error_small.png',
                        layoutInsertAt: 'errorImage',
                        style: errorImageDisplay
                    });
                    this.header.addChild(this.errorImage);
                    this.errorCountLabel = new Text({
                        control: this,
                        labelClassName: errorClassName,
                        label: '0',
                        editable: false,
                        cssClass: 'count',
                        role: 'presentation',
                        layoutInsertAt: insertAt
                    });
                    this.header.addChild(this.errorCountLabel);
                    this.errorSeparator = new Text({
                        control: this,
                        labelClassName: 'errorSeparator textappearance-medium',
                        label: '',
                        value: '-',
                        editable: false,
                        cssClass: 'count',
                        layoutInsertAt: 'separator',
                        style: separatorDisplay
                    });
                    this.header.addChild(this.errorSeparator);

                    //Hide the error icons on the error Page or on the child page
                    this.hideErrorIcons = new Boolean(onErrorPage || (resource != null && resource.getParent() != null));

                    //only transitional resources can be uploaded and result in errors
                    this.refreshButton = new Button({
                        control: this,
                        cssClass: 'refreshIcon',
                        layoutInsertAt: 'refreshIcon',
                        style: 'display: none;'

                    });
                    this.refreshButton.label = MessageService.createStaticMessage('Refresh').getMessage();
                    this.header.addChild(this.refreshButton);
                    this.reloadButton = new Button({
                        control: this,
                        cssClass: 'reloadIcon',
                        layoutInsertAt: 'refreshIcon',
                        style: 'display: none;'
                    });

                    this.reloadButton.label = MessageService.createStaticMessage('Reload').getMessage();
                    this.header.addChild(this.reloadButton);
                }

                 this.baseWidget.addChild(this.header.build());

                // add ability to collapse and expand list
                if (this.collapsible) {
                    this.makeCollapsible();
                }
                if (this.errorCountLabel) {
                    this.errorCountLabel.setDisplay(false);  //Need to hide it because of the promise delay in getting error count
                    if (!this.errorWatch) {
                        this.errorWatch = topic.subscribe(PlatformConstants.DATA_REFRESH_TOPIC + '/' + resource.getResourceName(),
  							  lang.hitch(this, this.checkForErrors));
                    }
                }
                this.checkForErrors();
                domStyle.set(this.countLabel.labelElement.domNode, "background-size", "contain");
                domStyle.set(this.countLabel.labelElement.domNode, "background-position-y", "50%");
                domStyle.set(this.countLabel.labelElement.domNode, "background-repeat", "no-repeat");

                if (this.errorCountLabel && this.errorCountLabel.baseWidget) {
                    this.addHandler(on(this.errorCountLabel.baseWidget.domNode, touch.press, lang.hitch(this, function () {
                        var queries = this.viewControl.queries.children;
                        for (var index = 0; index < queries.length; index++) {
                            if (queries[index].queryBase == PlatformConstants.ERRORED_QUERYBASE) {
                                this.viewControl.changeQueryBase(index);
                                break;
                            }
                        }
                    })));
                }

                // safe to call this now AFTER the header has been built, otherwise it will recreate the link
                // Some lists are sorted but don't have sort labels showing due to space
                if (sortable && this.sortLabel != null) {
                    this.setSortLabel();

                    this.sortLabelDomNode = this.sortLabel.baseWidget.domNode;
                    domAttr.set(this.sortLabel.baseWidget.domNode,'aria-label', this.sortLabel.baseWidget.domNode.textContent);
                    if (this.sortOptions && this.sortOptions.length > 1) {
                        //                	   ConnectivityChecker.checkConnectivityAvailable().then(function(isConnectionAvailable){
                        //   							if (!isConnectionAvailable){
                        //   								domStyle.set(self.sortLabel.baseWidget.domNode, 'display', 'none');
                        //   							}
                        //                	   });
                        this.addHandler(on(this.sortLabelDomNode, touch.press, lang.hitch(this, function (e) {
                            if (!this._isSortMenuShowing()) {
                                this.ui.showMenu(this.sortMenu, e, this.sortLabelDomNode, this.sortOptionMenuItems, 'sortMenu');
                            } else {
                                this.ui.hideCurrentMenu();
                            }
                        })));
                    }
                }
            }

            this.buildFindByScan();
            if (!listResourcePromise) {
                if (this.getResource().getParent()) {
                    this.applySort(true);
                }
                this.buildListWidget();
	    		if(this.getResource() && this.showHeader){
                    //set list count
                    this.getResource().getListCount().then(function (count) {
                        self.countLabel.setLabel(count);
                    });
                }
	    		//Need to hide the busy icon after building the list
	    		this.application.hideBusy();
            } else {
                var emptyList = true;
                this.buildListWidget(emptyList);
                listResourcePromise.then(function () {
                	//Refresh will reload and hide the busy icon
                    self.refresh();
                });
            }

            this.baseWidget.addChild(this.listWidget);
	                
            if (this.getResource().count() == 0) {
                this.emptyRow = new ContentPane();
                var listLabel = MessageService.createStaticMessage('norecords').getMessage();
                if (this.parentControl && this.parentControl.isLookup()) {
                    var lastDownloadDateTime = SystemProperties.getProperty('lastDownloadDateTime');
                    if (!lastDownloadDateTime) {
                        listLabel = MessageService.createStaticMessage('nolookupdata').getMessage();
                    }
                }
                this.emptyRowLabel = (new Label(
					{
					    control: this,
					    labelClassName: 'listEmpty',
					    label: listLabel
					}
    			)).build();
                this.emptyRow.addChild(this.emptyRowLabel);
                this.baseWidget.addChild(this.emptyRow);
            }

            var createdBaseWidget = this.inherited(arguments);

            this.logger.timerEnd('build list', 1);
            
			query('.mblListItemRightIcon', createdBaseWidget.domNode).forEach(function(itemIcon, index, arr){
				domAttr.set(itemIcon.firstElementChild,'role','img');
				domAttr.set(itemIcon.firstElementChild,'alt', MessageService.createStaticMessage('details').getMessage());
                domAttr.set(itemIcon.parentElement,'role','listitem');
			});

            return createdBaseWidget;
        },

        _setupSearchCriteria: function(metadata) {
        	var performStoreSearch = false;
            this.searchResource = this.application.getResource('PlatformListSearchResource');
            var searchSet = this.searchResource.clearFilterAndSort().filter("listid == '" + this.id + "'");
           
            this.searchable = (this.searchAttributes && this.searchAttributes.children.length > 0);
            this.logger.trace("Is the List Id " + this.id +" Searchable? " + this.searchable);
            if (this.searchable) {
                if (!metadata){
                	metadata = ResourceMetadataContext.getResourceMetadata(this.resource);
                }
                //Check to see if all search attributes are indexed.  If so allow JSONStore search, otherwise
   	            //search will be in memory as it always has, if the list doesn't have a filter method.
       	        this['canSearchStore'] = !array.some(this.searchAttributes.children, function (child) {
           	 		if (child.name) {
               	    	var field = metadata.getField(child.name);
                   		return (field && !field.index);
                   	}
               	});
            }
            if (searchSet.count() == 0) {
                this.searchResource.clearFilterAndSort();
                this.searchRecord = this.searchResource.createNewRecord();
                this.searchRecord.set('search', "");
                this.searchRecord.set('exact', false);
                this.searchRecord.set('listid', this.id);
                this.searchRecord.set('fromscan', false);
                this.application.modelService.save(this.searchResource);
            }
            else {
                this.searchRecord = searchSet.getRecordAt(0);
                if (this.searchRecord.get('querybase') != this.getResource()._queryBaseName) {
                    this.searchRecord.set('querybase', "");
                    this.searchRecord.set('search', "");
                    this.searchRecord.set('fromscan', false);
                }
                else if (this.canSearchStore){
                	//If you can perform a JSONStore search and there is a search value then apply that filter
                	var searchValue =  this.searchRecord.get('search');
                	performStoreSearch = (searchValue && searchValue.length > 0);
                }
            }
            return performStoreSearch;
        },

        hideShowReloadButton: function () {
            var deferred = new Deferred();
            if (this.reloadButton && this.reloadButton['justReloaded']) {
                delete this.reloadButton['justReloaded'];
                deferred.resolve(false);
            }
            else {
                var self = this;
                ConnectivityChecker.checkConnectivityAvailable().then(function (hasConnection) {
                    var showReload = false;
                    if (self.reloadButton && hasConnection) {
                        var resource = self.getResource();
                        if (resource) {
                            showReload = resource.getMetadata().dataPastFetchLimit(resource.getQueryBase());
                        }
                        self.reloadButton.setDisplay(showReload);
                        if (showReload) {
                            self.refreshButton.setDisplay(false);
                        }
                    }
                    deferred.resolve(showReload);
                });
            }
            return deferred.promise;
        },

        showRefreshButton: function () {
            if (this.refreshButton) {
                var self = this;
                this.hideShowReloadButton().then(function (hide) {
                    if (!hide) {
                        self.refreshButton.setDisplay(true);
                    }
                });
            }
        },

        checkForErrors: function () {
        	if(this.viewControl.transitioningOut){
        		return;
        	}
            var self = this;
            var resource = this.getResource();
            var resourceMetadata = resource.getMetadata();
            if (!resourceMetadata.additionalData && !resourceMetadata.isSystem && !resourceMetadata.isLocal()) {
                if (resource._queryBaseName == PlatformConstants.ERRORED_QUERYBASE) {
                    //Showing errored records so no need to show the error count
                    this.errorCountLabel.setDisplay(false);
                    this.errorSeparator.setDisplay(false);
                    this.errorImage.setDisplay(false);
                }
                else {
                    ModelService.countErrored(resourceMetadata.getResourceName()).then(function (count) {
                        var hasErrors = count > 0;
                        if (self.viewControl) {
                            self.viewControl.setQueryErrorMarker(hasErrors);
                        }
                        if (hasErrors) {
                            self.errorCountLabel.setLabel(count + "");
                        }
                        if (self.errorCountLabel) {
                        	self.errorCountLabel.setDisplay(hasErrors);
                       	 	//hide these on the error page or if no errors
                       	 	var display = (hasErrors && !self.hideErrorIcons.valueOf());
                        	self.errorSeparator.setDisplay(display);
                        	self.errorImage.setDisplay(display);
                        }
                    });
                }
            }
        },

        buildSortMenu: function () {
            if (this.hasSorting() || this.showHeader) {
                this.sortOptionMenuItems = new Array();
                array.forEach(this.sortOptions, lang.hitch(this, function (action, index) {
    				this.sortOptionMenuItems.push({label: action.label.getMessage(), listControl: this, index: index, eventHandlers: [
                             {
                                 'event': 'click',
                                 'class': 'platform.handlers._ApplicationHandlerBase',
                                 'method': 'changeSort',
                             }],
                        cssIconClass: (index != this.sortIndex ? '' : 'menuItemSelected')
                    });
                    this.sortOptionMenuItems.push({ label: '-' });
                }));
            }
        },

        buildListWidget: function (isEmpty) {
            var self = this;
            var resource = this.getResource();
            var store = (isEmpty) ? null : resource;
            
            if (store!=null && store!==undefined && store._metaData!==undefined ) {
            	Logger.log("[List] showing count " + store.count() + " for this resource: " + store._metaData.name);
            } else if (resource!==undefined && resource._metaData!==undefined) {
            	Logger.log("[List] store is empty for this resource: " + resource._metaData.name);
            }

            //Will check if FindByScan needed and build accordingly.
            var requires = new Array();
            //TODO make this totally dynamic, but since require is async will require rework of list buildout.
            requires.push(this.mixinclass == 'SpecificationStoreList'?SpecificationStoreList:EdgeToEdgeStoreList);

        	var min = this['displayPageSize']?parseInt(this['displayPageSize']):20;
          	if(this.useLongList){
          		if(store && store.count()>min){
          			requires.push(LongListMixin);
          		}
          		else{
          			this.useLongList = false;
          		}
          	}
          		
            this.listWidget = new declare(requires)({ 
                store: store,
                control: this,
                style: 'display: none',
                'class': 'list'+(this['cssClass']?' '+this['cssClass']:'')
            });
            if (store && this.viewControl && this.viewControl.isLookup()) {
                //   		 		var count = store.count();
                //   		 		if (store.hasNextPageOfData()){
                //   		 			count += "+";
                //   		 		}

                store.getListCount().then(function (count) {
                    self.countLabel.setLabel(count);
                });

            }
            if(this.badKeys){
            	this.logger.log("[Warning] While building list "+this.id+". Keys defined in resource do not provide for uniqueness across rows.", 1);
            }
            if(this.viewControl){
            	domClass.remove(this.viewControl.baseWidget.domNode, 'loadingView');
            }
        },

        getSortParams: function (index) {
            var sortArray = new Array();
            if (!this.sortOptions) {
                return sortArray;
            }
            var currentSortOptions = this.sortOptions[index].children;
            for (var index = 0; index < currentSortOptions.length; index++) {
                var option = currentSortOptions[index];
                sortArray.push(option.name + (option.direction ? ' ' + option.direction : ''));
            }
            return sortArray;
        },

        isFindByScanShown: function(){
        	//Will return true if the FindByScan control is shown
            return (this.findByScan && this.findByScan.hideShowFindByScan());
        },

        getCurrentSortLabel: function () {
            return this.sortOptions[this.sortIndex].label.getMessage();
        },

        changeSort: function (index) {
            var listResource = this.getResource();
            if (listResource && listResource.getMetadata().serverOnlyMode) {
                var self = this;
                ConnectivityChecker.checkConnectivityAvailable().then(function (isConnectionAvailable) {
                    if (isConnectionAvailable) {
                        self._changeSortInner(index);
                    }
                    else {
                        self.application.hideBusy();
                        self.application.showMessage(MessageService.createStaticMessage("sortFailedConnection").getMessage());
                    }
                });
            }
            else {
                this._changeSortInner(index);
            }
        },
        _changeSortInner: function (index) {
            this._syncWithAppResource();
            this.setSortIndex(index);
            this.applySort(true);
        },

        setSortIndex: function (index) {
            this.sortIndex = index;
            this.sortIndexRecord.set('index', index);
            this.sortIndexRecord.set('orderby', this.concatSortParams(this.getSortParams(index)));
            ModelService.save(this.sortIndexResource);
        },

        setSortLabel: function () {
            if (this.sortLabel != null) {
                if (!this.sortLabelDomNode || !this.hasSorting() || !this.sortIndex) {
                    this.sortLabel.setLabel('');
                }
                this.sortLabel.setLabel(this.translatedSortLabel.getMessage(this));
            }
        },

        hasSorting: function () {
            return this.sortOptions && this.sortOptions.length > 0;
        },

        applySearchAndSort: function (forceClear) {
            var cleared = forceClear;
            var listResource = this.getResource();
            if (forceClear) {
                listResource.clearFilterAndSort();
                this.applyFilterToSet();
            }
            var searchString = this.searchRecord.get("search");
            if (searchString && searchString.length > 0) {
                var filterString = '';
                if (this.searchRecord.get("fromscan")) {
                    filterString = searchString;
                }
                else if (this.searchAttributes && this.searchAttributes.children) {
                    if (this.searchRecord.get('exact')) {
                        array.forEach(this.searchAttributes.children, function (child) {
                            if (child.name) {
                                filterString += child.name + " ~ '" + searchString + "'|";
                            }
                        });
                    } else {
                        array.forEach(this.searchAttributes.children, function (child) {
                            if (child.name) {
                                filterString += child.name + " ~ '*" + searchString + "*'|";
                            }
                        });
                    }

                    if (filterString && filterString.length > 1) {
                        filterString = filterString.slice(0, -1);
                    }
                }
                if (filterString.length > 0) {
                    if (!cleared) {
                        listResource.clearFilterAndSort();
                        this.applyFilterToSet();
                        cleared = true;
                    }
                    listResource.filter(filterString);
                }
            }
            //this.applySort(forceClear);
        },

        concatSortParams: function (sortParams) {
            var orderBy = '';
            array.forEach(sortParams, function (sortParam) {
                if (orderBy.length > 0) {
                    orderBy += ',';
                }
                orderBy += sortParam;
            });
            return orderBy;
        },

        applySort: function (cleared) {
            if (this.hasSorting()) {
                if (!this.sortIndex) {
                    this.sortIndex = 0;
                }
                var self = this;
                var sortParams = this.getSortParams(this.sortIndex);
                if (sortParams.length > 0) {
                    var listResource = this.getResource();
                    if (listResource.count() > 0) {
                        if (listResource._queryBaseName != PlatformConstants.SEARCH_RESULT_QUERYBASE && !listResource.isFiltered() && (!listResource.isDirty() || listResource._getSaveStage() > 0)) {
                            self.application.showBusy();
                            ModelService.sort(listResource, this.concatSortParams(sortParams))
							.then(function (dataSet) {
							    var resourceID = dataSet.getParent() ?
										dataSet.getParent().getOwner().name + '.' + dataSet.getRelationNameWithParent() : listResource.getResourceName();
							    dataSet['resourceID'] = resourceID;
							    self.application.addResource(dataSet);
							    self.setResourceObject(dataSet);
							    self.getResource().setCurrentIndex(0);
							    self.refresh();
							    self.application.hideBusy();
							});
                        }
                        else {
                            if (!cleared) {
                            	var parentView = this.viewControl;
    							//Only clear and reapply the filter if it's set on the parent view
    							//Usually this is only for Lookups
    							if (parentView && parentView.filterClass && parentView.filterMethod) {
                                listResource.clearFilterAndSort();
                                this.applyFilterToSet();
    							}
                                cleared = true;
                            }
                            if (this.ui.movingBack) {
                                listResource.sortKeepIndex.apply(listResource, sortParams);
                            }
                            else {
                                listResource.sort.apply(listResource, sortParams);
                                this.setSortLabel();
                                this.getResource().setCurrentIndex(0);
                                this.refresh();
                            }
                        }
                        listResource['sortParams'] = sortParams;
                    }
                }
            }
        },

        search: function () {
            //If a JSONStore query filter is defined
            //refresh the view so build() will apply
            //the filter in JSONStore, otherwise let
            //the legacy filter run
            this.application.showBusy();
            if (this.lookupFilter || this.canSearchStore) {
                //Keep the search string before refreshing the view
                //so we're sure it will be available when rebuild the list
                var searchResource = this.application.getResource('PlatformListSearchResource');
                var self = this;
                ModelService.save(searchResource).
	    		always(function () {
	    		    self.getResource().lookupFilter = self.lookupFilter;
	    		    return self.applyDatabaseFilterAndSearch();
	    		}).
				always(function () {
				    self.refresh();
				});

                return;
            }

            this.logger.log('[List search] One or more search attributes for the list ' + this.artifactId + ' are not defined as indexes on the resource ' + this.getResource().getResourceName() + ' so search will only be on the current resource pages in memory');
            this.searchRecord.set('querybase', this.getResource()._queryBaseName);
            this.applySearchAndSort(true);
            this.destroyList();

            // handle empty result
            var count = this.getResource().count();
            if (count == 0) {
                this.emptyRow = new ContentPane();
                this.emptyRowLabel = (new Label(
    					{
    					    control: this,
    					    labelClassName: 'listEmpty',
    					    label: MessageService.createStaticMessage('norecords').getMessage()
    					}
    			)).build();
                this.emptyRow.addChild(this.emptyRowLabel);
                this.baseWidget.addChild(this.emptyRow);
            }

            this.buildListWidget();
            this.baseWidget.addChild(this.listWidget);
            this.countLabel.labelElement.innerText = count;
            domStyle.set(this.listWidget.domNode, 'display', 'inline');
            this.application.hideBusy();
        },

        toggleExactSearch: function () {
            var currentValue = this.searchRecord.get('exact');
            this.searchRecord.set('exact', !currentValue);
        },

        applyFilterToSet: function () {
            var parentView = this.viewControl;
            if (parentView && parentView.filterClass && parentView.filterMethod) {
                var handlerClass = this.application[parentView.filterClass];
                if (handlerClass) {
                    if (handlerClass[parentView.filterMethod]) {
                        return handlerClass[parentView.filterMethod](this);
                    }
                }
            }
        },

        addChild: function (child) {
            switch (child._controlType) {
                case 'SortOptions':
                    this.sortOptions = child;
                    child.setParentReference(this);
                    return;
                    break;
                default:
                    this.inherited(child);
                    break;
            }
        },

        build_scan_list: function (resource) {
            this.setMyResourceObject(resource);
            this.application.addResource(resource);

            this.searchRecord.set('querybase', this.getResource()._queryBaseName);
            //this.applySearchAndSort(true);
            this.destroyList();
            var count = this.getResource().count();
            if (count == 0) {
                this.emptyRow = new ContentPane();
                this.emptyRowLabel = (new Label(
    					{
    					    control: this,
    					    labelClassName: 'listEmpty',
    					    label: MessageService.createStaticMessage('norecords').getMessage()
    					}
    			)).build();
                this.emptyRow.addChild(this.emptyRowLabel);
                this.baseWidget.addChild(this.emptyRow);
            }

            this.buildListWidget();
            this.baseWidget.addChild(this.listWidget);
            this.countLabel.labelElement.innerText = count;
            domStyle.set(this.listWidget.domNode, 'display', 'inline');
            //We do this since if the user scrolls and scans, the list is added to the container
            //but the container scroll position is not reset and list hides.
            this.baseWidget.domNode.parentNode.style.transform = "translate3d(0,0,0)";

        },

        destroyList: function () {
            if (this.emptyRow) {
                array.forEach(this.emptyRow.getChildren(), function (child) {
                    if (child.control && child.control.destroy) {
                        child.control.destroy();
                    }
                });
                this.emptyRow.destroy();
            }
            if (this.listWidget) {
                array.forEach(this.listWidget.getChildren(), function (child) {
                    if (child.control && child.control.destroy) {
                        child.control.destroy();
                    }
                });
                this.listWidget.destroy();
            }
        },

        destroyListItems: function () {
            if (this.listWidget) {
                array.forEach(this.listWidget.getChildren(), function (child) {
                    if (child.control && child.control.destroy) {
                        child.control.destroy();
                    }
                    child.destroy();
                });
            }
        },

        destroyHeader: function () {
            if (this.header) {
                this.header.destroy();
            }
        },

        destroy: function () {
            if (this.refreshButton && this.refreshButton.clickHandler) {
                this.refreshButton.clickHandler.remove();
            }
            if (this.reloadButton && this.reloadButton.clickHandler) {
                this.reloadButton.clickHandler.remove();
            }
            this.destroyHeader();
            this.destroyList();
            this.inherited(arguments);
            if (this.errorWatch) {
                this.errorWatch.remove();
                this.errorWatch = null;
            }
            this.refreshButton = null;
            this.reloadButton = null;
            this.header = null;
            this.sortLabel = null;
            this.labelElement = null;
            this.countLabel = null;
            this.exactButton = null;
            this.searchField = null;
            this.searchButton = null;
            this.errorImage = null;
            this.errorCountLabel = null;
            this.errorSeparator = null;
            this.refreshButton = null;
            this.reloadButton = null;
            this.emptyRow = null;
            if (this.emptyRowLabel){
            	if (this.emptyRowLabel.destroy){
                	this.emptyRowLabel.destroy();
            	}
            	if (this.emptyRowLabel.domNode){
                   	domConstruct.destroy(this.emptyRowLabel.domNode);
            	}
                this.emptyRowLabel = null;
            }
            this.listWidget = null;
        },

        postCreate: function () {
            //this.inherited(arguments);
            this.listWidget.startup();
            if (this.refreshButton && !this.refreshButton.clickHandler) {
                this.refreshButton.clickHandler = on(this.refreshButton.baseWidget.domNode, tap, lang.hitch(this, function () {
                    dijitFocus.focus(this.refreshButton.baseWidget.domNode);
                    this.refresh();
                }));
            }
            if (this.reloadButton && !this.reloadButton.clickHandler) {
                this.reloadButton.clickHandler = on(this.reloadButton.baseWidget.domNode, tap, lang.hitch(this, function () {
                    dijitFocus.focus(this.reloadButton.baseWidget.domNode);
                    this.ui.show("Platform.ConfirmReloadWorkList");
                }));
            }
            this.hideShowReloadButton();
            domStyle.set(this.listWidget.domNode, 'display', 'inline');
            var children = this.listWidget.getChildren();
            if (this.hideEmpty && children.length == 0) {
                this.listWidget.control.setDisplay(false);
            }
            else if (this.collapsed) {
                this.collapse();
            }
        },

        buildFindByScan: function () {
            if (this.findByScan) {
                this.findByScan.setParentReference(this);
                this.baseWidget.addChild(this.findByScan.build());
            }
        },

        doHideHeader: function () {
            if (this.header && this.header.baseWidget) {
                domStyle.set(this.header.baseWidget.domNode, 'display', 'none');
            }
        },

        doShowHeader: function () {
            if (this.header && this.header.baseWidget) {
                domStyle.set(this.header.baseWidget.domNode, 'display', '');
            }
        },

        reload: function () {
            var resource = this.getResource();
            var self = this;
            ConnectivityChecker.checkConnectivityAvailable().then(function (hasConnection) {
                if (hasConnection) {
                    self.ui.show("Platform.ReloadingCurrentWorklist");
                    var progressRecord = self.application.getResource('PlatformProgressResource').getRecordAt(0);
                    progressRecord.set('progressMsg', MessageService.createResolvedMessage('reloadingWorkListProgress', ['0']));
                    ModelService.reloadAllPages(resource.name, resource.getQueryBase()).then(function (resultSet) {
                        resultSet['resourceID'] = resource.getResourceName();
                        self.application.addResource(resultSet);
                        self.reloadButton.setDisplay(false);
                        self.reloadButton['justReloaded'] = true;
                        self.refresh();
                        self.ui.hideCurrentDialog();
                    }, function (error) {
                        self.logger.error('Error reloading resource ' + resource.getResourceName());
                        var dataSet = error.dataSet;
                        if (dataSet) {
                            dataSet['resourceID'] = resource.getResourceName();
                            self.application.addResource(dataSet);
                        }
                        self.ui.hideCurrentDialog();
                    }, function (progress) {
                        progressRecord.set('progressMsg', MessageService.createResolvedMessage('reloadingWorkListProgress', [progress]));
                    });
                }
                else {
                    var message = MessageService.createStaticMessage('reloadFailedNoConnectivity').getMessage();
                    self.application.showMessage(message);
                }
            });
        },

        refresh: function (preventSort) {
            this._syncWithAppResource();
            if (!preventSort && this.hasSorting()) {
                this.setSortLabel();
            }
            this.destroyList();
            this.buildListWidget();
            this.baseWidget.addChild(this.listWidget);
            domStyle.set(this.listWidget.domNode, 'display', 'inline');
            this.buildSortMenu();
            var resource = this.getResource();
            var self = this;
            var onErrorPage = resource._queryBaseName == '_errored';
            //Hide the error icons on the error Page or on the child page
            this.hideErrorIcons = new Boolean(onErrorPage || (resource != null && resource.getParent() != null));
            if (resource._metaData.local) {
            	//maybe we can put this condition with && of the if above, but for this fixpack I think that is not a good idea
            	if(self.errorCountLabel){
            		self.errorCountLabel.set('label', resource.count());
            	}                
            }
            else {
                var resourceMetadata = resource.getMetadata();
                if (!resourceMetadata.additionalData && !resourceMetadata.isSystem) {
                    this.checkForErrors();
                }
	    	}
            //set list count
    		if(this.showHeader){
    			resource.getListCount().then(function (count) {
    				self.countLabel.setLabel(count);
    			});
    		}
            this.hideShowReloadButton();
            if (this.refreshButton) {
                this.refreshButton.setDisplay(false);
            }
            this.ensureRecordFocus();
            this.application.hideBusy();
        },

        makeCollapsible: function () {
            var self = this;
            this.addHandler(on(self.header.baseWidget, 'click', function (e) {
                self.nextPrevButtonSkip = false;
                e.stopPropagation();
                self.toggleCollapse();
            }));
            self.collapsible = true;
        },

        toggleCollapse: function () {
            if (this.collapsed) {
                this.expand();
                this.refresh();
            }
            else {
                this.collapse();
            }
        },

        collapse: function () {
            array.forEach(this.listWidget.getChildren(), function (child) {
                fx.wipeOut({ node: child.containerNode }).play();
            });
            this.collapsed = true;
        },

        expand: function () {
            array.forEach(this.listWidget.getChildren(), function (child) {
                fx.wipeIn({ node: child.containerNode }).play();
            });
            this.collapsed = false;
        },

        _showCountLableWaitingIcon: function () {
            this.countLabel.setLabel('      ');
            domStyle.set(this.countLabel.labelElement.domNode, "background-image", "url(idx/mobile/themes/common/idx/images/loadingIndicatorWhite.gif)");
        },

        _hideCountLableWaitingIcon: function () {
            domStyle.set(this.countLabel.labelElement.domNode, "background-image", "");
        },


        _syncWithAppResource: function () {
            var appResource = this.application.getResource(this.getResource().name);
            if (this.getResource() != appResource) {
                this.setMyResourceObject(appResource);
            }
        },
        _isSortMenuShowing: function () {
            return this.ui.currentMenu && this.ui.currentMenu.id == this.sortMenu;
        },
		orientationChange : function(){
			var list = this;
			window.setTimeout(function(){
				list.fixTransitionIcons();
			}, 100);
		},

		fixTransitionIcons: function(){
			var list = this;
			query('.mblListItemRightIcon', list.listWidget.domNode).forEach(function(itemIcon, index, arr){
				var itemBox = domGeometry.position(itemIcon.parentNode);
				domStyle.set(itemIcon, 'margin-top', (itemBox.h/2)+'px');
			});
		},
		
	    ensureRecordFocus : function(item) {
	    	this.inherited(arguments);
	    	var itemIndex = 0;
	    	if(item){
	    		itemIndex = parseInt(domAttr.get(item.domNode, 'resourceIndex'))
	    	}
	    	else {
	    		itemIndex = this.getResource()._currentIndex - this.listWidget.startIndex;
	    	}
	    	itemIndex = this.listWidget.startIndex>0?itemIndex+1:itemIndex;
		    query('li', this.listWidget.domNode).forEach(function(li, index){
		    	if(itemIndex != index){
		    		domClass.remove(li, 'currentRecord');	
		    	}
		    	else {
		    		domClass.add(li, 'currentRecord');
		    	}
		    });
		    return true;
	    }
    
    });
});