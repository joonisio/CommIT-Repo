define("platform/auth/UserSessionHelper", [
	   "dojo/_base/lang",
       "dojo/_base/array",
	   "dojox/string/Builder"
	   ],	function(lang, arrayUtil, StringBuilder) {
	
	/* User Session Helper
	 * set of methods to help in user session manipulation (cookie)
	 */
	return {

		// Given a sessionid, returns a string updating and/or adding new tokens.
/**@memberOf platform.auth.UserSessionHelper */
		updateSession: function(sessionid, setCookie) {
			var sessionidMap = this.mapCookie(sessionid);
			var setCookieMap = this.mapCookie(setCookie);
			arrayUtil.forEach(this.getCookieIds(setCookie), function(id) {
				if(setCookieMap[id]) {
					sessionidMap[id] = setCookieMap[id];
				}
				else {
					sessionidMap[id] = null;
				}
			});
			return this.getCookieFromMap(sessionidMap);
		},
		
		// Given a Set-Cookie, returns the token ids
		getCookieIds: function(setCookie) {
			var setCookieArray = null;
			if(lang.isArray(setCookie)) {
				setCookieArray = setCookie;
			}
			else {
				setCookieArray = setCookie.trim().split(';');
			}
			
			var setCookieKeys = [];
			arrayUtil.forEach(setCookieArray, function(item) {
				var equalIndexOf = item.indexOf('=');
				var hasValue = equalIndexOf > -1;
				if(hasValue) {
					setCookieKeys.push(item.slice(0, equalIndexOf).trim());
				}
				else {
					setCookieKeys.push(item.slice(0).trim());
				}
				
			});
			return setCookieKeys;
		},
		
		// Given a Set-Cookie, maps it returning the content in a JSON map style
		mapCookie: function(setCookie) {
			var map = {};
			var setCookieArray = null;
			if(lang.isArray(setCookie)) {
				setCookieArray = setCookie;
			}
			else {
				setCookieArray = setCookie.trim().split(';');
			}
			arrayUtil.forEach(setCookieArray, function(item) {
				var equalIndexOf = item.indexOf('=');
				var hasValue = equalIndexOf > -1;
				if(hasValue) {
					var key = item.slice(0, equalIndexOf).trim();
					var value = item.slice(equalIndexOf+1); 
					map[key] = value;
				}
				else {
					map[item.slice(0).trim()] = null;
				}
			});
			return map;
		},
		
		// Given a JSON map, returns a cookie containing all tokens
		getCookieFromMap: function(map) {
			cookieBuilder = new StringBuilder();
			var first = true;
			for(var member in map) {
				if(!first) {
					cookieBuilder.append('; ');
				}
				cookieBuilder.append(member);
				first = false;
				if(map[member]) {
					cookieBuilder.append('=' + map[member]);
				}
			}
			return cookieBuilder.toString();
		}
	};
});
	 
