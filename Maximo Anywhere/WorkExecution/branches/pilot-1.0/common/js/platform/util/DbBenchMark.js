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

define( "platform/util/DbBenchMark", 
		[ "dojo/_base/declare",
		  "platform/store/ResourceMetadata", 
	      "platform/store/PersistenceManager",
	      "platform/model/ModelService"],
	function(declare, ResourceMetadata, PersistenceManager, ModelService) {
		return declare(null, {
			name: 'DbBenchMark',
			
			resourcePromise: null,
			
			constructor: function(){
				var resourceMBLMU = new ResourceMetadata({resourceName:'DbBenchMark'}).
	               setLocal( true ).
	               addField({
	                  'index' : true, 
	                  'dataType' : 'string', 
	                  'precision' : 0, 
	                  'name' : 'dbIndex', 
	                  'local' : true, 
	               }).
	               addField({
	                  'index' : false, 
	                  'dataType' : 'string', 
	                  'precision' : 0, 
	                  'name' : 'value', 
	                  'local' : true, 
	               }).setQueryBases([
	                                {name:'getDbBenchMark', queryString:'savedQuery=getDbBenchMark'}
	                                ]);
				
				PersistenceManager.initCollection(resourceMBLMU);
				
	            this.resourcePromise = PersistenceManager.activateOrCreateCollections({userName: 'wilson', password: 'wilson'});
				
			},
			
/**@memberOf platform.util.DbBenchMark */
			getData: function(){
				
//							var modelService = new ModelService();
						 this.resourcePromise.then(function(){
							 	var perfc = new TrackTime('DbBenchMark','getDat','DbBenchMark inserting 300 records', 'yes' );
					   			perfc.startTracking();
								ModelService.all("DbBenchMark").then(function(resourceSet){
									for (var i=0;i<300;i++)
									{
									    var newRec = resourceSet.createNewRecord();
									    newRec.set('dbIndex', 'dbIndex'+i);
									    newRec.set('value', 'value'+i);				    
										
									}
									ModelService.save(resourceSet);
									perfc.stopTracking();
								});
						 });
				
			},
			
			getAll: function(){
				this.resourcePromise.then(function(){
					var perfc1 = new TrackTime('DbBenchMark','getAll','DbBenchMark getAll records', 'yes' );
		   			perfc1.startTracking();
					ModelService.all("DbBenchMark").then(function(resourceSet){
						/*for (var i=0;i<10;i++)
						{*/
//							alert(resourceSet.get(1).value);
							perfc1.stopTracking();
							displayTimeTrack();
						/*}*/
					});
			 });
				
			},
			
			queryLike: function(){
				this.resourcePromise.then(function(){
					var perfc2 = new TrackTime('DbBenchMark','queryLike','DbBenchMark query Like dbIndex1 ', 'yes' );
		   			perfc2.startTracking();
					ModelService.filtered('DbBenchMark', null, {dbIndex: 'dbIndex1'}).then(function(resourceSet){
//						alert(resourceSet.get(1).value);
						perfc2.stopTracking();
						displayTimeTrack();
					});
				});
			},
			
			queryExact: function(){
				this.resourcePromise.then(function(){
					var perfc3 = new TrackTime('DbBenchMark','queryExact','DbBenchMark query Exact dbIndex1', 'yes' );
		   			perfc3.startTracking();
					ModelService.filtered('DbBenchMark', null, {dbIndex: 'dbIndex1'}).then(function(resourceSet){
						resourceSet.filter("dbIndex == 'dbIndex1'");
//						alert(resourceSet.get(1).value);
						perfc3.stopTracking();
						displayTimeTrack();
						
					});
				});
			},
			
			sort: function(){
				this.resourcePromise.then(function(){
					var perfc3 = new TrackTime('DbBenchMark','queryExact','DbBenchMark sort dbIndex desc', 'yes' );
		   			perfc3.startTracking();
					ModelService.filtered('DbBenchMark', null, {dbIndex: 'dbIndex1'}).then(function(resourceSet){
						resourceSet.sort("dbIndex desc");
//						alert(resourceSet.get(1).value);
						perfc3.stopTracking();
						displayTimeTrack();
					});
				});
			}
			
		});
	});
