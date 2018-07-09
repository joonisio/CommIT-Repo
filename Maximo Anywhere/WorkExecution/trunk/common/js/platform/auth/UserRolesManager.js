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

define("platform/auth/UserRolesManager",
[ "platform/store/_ResourceMetadataContext",
  "dojo/_base/lang"], function(ResourceContext, lang) {
	var _rolesCache = {};
	var _currentUser = null;
	return {
/**@memberOf platform.auth.UserRolesManager */
		isCurrentUserAuthorizedTo : function(resourceName, aliasOrMethodName) {
			return this._atLeastOneRoleOrNoRoleNeeded(this._lookupRequiredRoles(resourceName, aliasOrMethodName));
		},
		isCurrentUserInRole : function(roleName) {			
			roleName = roleName || "";
			return _rolesCache[roleName] === roleName;
		},
		isCurrentUserInOneRole: function(roles){
			roles = roles || [];
			if(roles.length == 0){
				return false;
			}
			return roles.some(lang.hitch(this, this.isCurrentUserInRole));
		},
		_atLeastOneRoleOrNoRoleNeeded: function(neededRoles){
			return neededRoles.length == 0 || neededRoles.filter(lang.hitch(this, this.isCurrentUserInRole)).length > 0;
		},
		_lookupRequiredRoles: function(resourceName, alias){
			var resource = ResourceContext.getResourceMetadata(resourceName);
			if(resource){
				return resource.getRequiredRolesFor(alias);
			}
			return [];
		},
		addRolesToCurrentUser: function(roles /*array*/){
			if(roles && roles["forEach"]){
				var self = this;
				roles.forEach(function(value){					
					_rolesCache[value] = value;
				});
			}
		},
		resetRoles: function(){
			_rolesCache = {}; 
		},
		getCurrentUser: function(){
			return _currentUser;
		},
		setCurrentUser: function(user){
			_currentUser = user;
		}
	};
});
