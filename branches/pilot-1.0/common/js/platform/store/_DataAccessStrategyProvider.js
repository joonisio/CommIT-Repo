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

define("platform/store/_DataAccessStrategyProvider",
[ 
 "platform/store/_ServerPreferredDataAccessStrategy",
 "platform/store/_LocalDataAccessStrategy",
 "platform/store/_InMemoryOnlyDataAccessStrategy"
], 
function(ServerPreferredDataAccessStrategy, LocalDataAccessStrategy, InMemoryOnlyDataAccessStrategy){
	
	return {

/**@memberOf platform.store._DataAccessStrategyProvider */
		getDataAccessStrategy: function(resourceMetadata){
			var dataAccessStrategy;
			
			if (resourceMetadata.inMemory
				|| resourceMetadata.name == "PlatformLoginResource"){  //TODO Remove this OR condition when CodeGen properly generates
														   				//the soft attribute and they and it's declared in the artifact
				dataAccessStrategy = new InMemoryOnlyDataAccessStrategy(resourceMetadata);
				
			} else if (resourceMetadata.local === true || resourceMetadata.additionalData === true){
				dataAccessStrategy = new LocalDataAccessStrategy(resourceMetadata);
				
			} else {
				dataAccessStrategy = new ServerPreferredDataAccessStrategy(resourceMetadata);
			}
			
			return dataAccessStrategy;
		},
		
		getDataAccessStrategyForDependents: function(topResourceMetadata, dependentResourceMetadata){
			var dataAccessStrategy;
			
			if (dependentResourceMetadata.inMemory
				|| dependentResourceMetadata.name == "PlatformLoginResource"){  //TODO Remove this OR condition when CodeGen properly generates
														   				//the soft attribute and they and it's declared in the artifact
				dataAccessStrategy = new InMemoryOnlyDataAccessStrategy(topResourceMetadata, dependentResourceMetadata);
				
			} else if (dependentResourceMetadata.local === true || dependentResourceMetadata.additionalData === true){
				dataAccessStrategy = new LocalDataAccessStrategy(topResourceMetadata, dependentResourceMetadata);
				
			} else {
				dataAccessStrategy = new ServerPreferredDataAccessStrategy(topResourceMetadata, dependentResourceMetadata);
			}
			
			return dataAccessStrategy;
		},
	};
});
