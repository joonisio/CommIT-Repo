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

define("platform/store/_DataAccessStrategyProviderContext",
[ 
 "platform/store/_DataAccessStrategyProvider"
], 
function(DataAccessStrategyProvider){

	var _dataAccessStrategyProvider;

	return {

		
/**@memberOf platform.store._DataAccessStrategyProviderContext */
		setDataAccessStrategyProvider: function(dataAccessStrategyProvider)
		{
			_dataAccessStrategyProvider = dataAccessStrategyProvider;
		},
		
		getDataAccessStrategyProvider: function()
		{
			if (_dataAccessStrategyProvider)
			{
				return _dataAccessStrategyProvider;
			}
			
			_dataAccessStrategyProvider = DataAccessStrategyProvider;
			return _dataAccessStrategyProvider;
		},
		
	};
});
