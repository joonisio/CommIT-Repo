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

define("platform/model/state/StateMachineSupport", 
["dojo/_base/declare", "dojo/_base/lang", 
 "platform/auth/UserRolesManager"], function(declare, lang, UserRolesManager) {	
	return declare([], {
		configuration: {},
		stateToAlias: {},
		resourceName: "",
		constructor: function(options){
			this.setupMachine(options);
		},		
/**@memberOf platform.model.state.StateMachineSupport */
		canPerformTransition: function(from, to){
			return this._isValidTransition(from, to) && this._isAuthorizedTransition(to); 
		},		
		statesFrom: function(from){
			var filterFunction = lang.hitch(this, this._isAuthorizedTransition);
			return this.getConfiguredStatesFrom(from).filter(filterFunction);
		},
		fromStateToAlias: function(state){
			return this.stateToAlias[state] || state;
		},
		getResourceName: function(){
			return this.resourceName;
		},
		getConfiguredStatesFrom: function(from){
			return this.configuration[from] || [];
		},
		_isValidTransition: function(from, to){
			return (this.configuration[from] || []).indexOf(to) >= 0; 
		},
		_isAuthorizedTransition: function(to){
			var alias = this.fromStateToAlias(to) || to;			
			return UserRolesManager.isCurrentUserAuthorizedTo(this.resourceName, alias);			
		},
		setupMachine: function(options){
		    lang.mixin(this, options);
		}
	});		
});
