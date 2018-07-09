

define("platform/auth/SampleChallengeHandler", [ 
	"dojo/_base/lang",
	"dojo/_base/declare",
	"platform/logging/Logger" ,
	"platform/auth/CustomChallengeHandler",
	"platform/store/SystemProperties",
	"platform/auth/UserAuthenticationManager"
], function(lang, declare, Logger, CustomChallengeHandler, SystemProperties, UserAuthenticationManager) {
	/*
	 *  This is a Sample Challenge Handler code to handle a 401 Basic Authentication Proxy between the Device and the Worklight Server 
	 * 
	 */
	return declare(null, {
		CUSTOM_AUTH_REALM_NAME : 'CustomAuthenticationRealm',
		
		constructor: function(){
			Logger.trace('Registering SampleChallengeHandler');
			//Override the CustomChallengeHandler methods with these
			lang.mixin(CustomChallengeHandler, this);
		},

		/*
		 * evaluates the response from server, if authStatus is returned, 
		 * then, we determine if this is a response from CustomAuthenticatorRealm.
		 */
/**@memberOf platform.auth.SampleChallengeHandler */
		isCustomResponse: function(response) {
			//Need to skip init and login in case they're blocked by the proxy, they will be resent automatically by worklight
			if (response.request.url.indexOf('init') > 0 || response.request.url.indexOf('login') > 0 || response.request.url.indexOf('loguploader') > 0) {
				return false;
			}
			//Need to check for direct 401 bounce on the query request to handle the initial rejection by the MobileFirst proxy
			if((response.request.url.indexOf('query') > 0 && response.status=='401')|| (response.responseJSON && response.responseJSON.authStatus) || (UserAuthenticationManager._isServerLoginFailure(response) && !UserAuthenticationManager.isCachingUserInfo())){
				Logger.trace('[CustomChallangeHandler.isCustomResponse] true - authStatus');
				return true;
			}
			else {
				Logger.trace('[CustomChallangeHandler.isCustomResponse] false');
				return false;
			}
		},
		
		/*
		 * Send Login credentials to your authentication service, you are passed a user and password from the login form
		 * 
		 * ATTN: You do not return a response to this method, you resolve or reject the passed in deferred thread
		 * based on the asynchronous response from the server.
		 * 
		 * If you override this method, don't forget to indicate that you're in the middle of authentication
		 * by setting and checking the isAuthenticating boolean to handle possible multiple threads.
		 * 
		 */
		login: function(user, pwd, deferred) {
			
			this.isAuthenticating = true;
			//Assuming I need to pass Basic Authorization headers to be let through..
			WL.Client.addGlobalHeader("Authorization", "Basic " + btoa(user+":"+pwd));
			var self = this;
			var sysPropDeferred = SystemProperties.loadPlatformProperties();
			sysPropDeferred.always(function(){
				self.getLoginOptions(user, pwd)
				.then(lang.hitch(self, function(loginOptions) {
					Logger.trace('CustomChallengeHandler login calling submitLoginForm');
					
					//For some reason I have to explicitly pass the Basic Authorization headers to the submitLogin Form, it doesn't pickup from the GlobalHeader..
					loginOptions.headers = {"Authorization": "Basic " + btoa(user + ":" +pwd)};
					var resubmit = true; 
					var afterSubmit = function(response) {
						Logger.trace('CustomChallengeHandler.sendLogin');
						if(self._isAuthenticated(response)) {
							Logger.trace('[CustomChallengeHandler] User successfully authentication against realm "' + self.REALM + '"');								
							deferred.resolve(response);
							self.isAuthenticating = false;
						}
						else if (resubmit && (response['responseJSON'] && response['responseJSON']['challenges'] 
								&& response['responseJSON']['challenges']['wl_antiXSRFRealm']) 
								|| response.status == '401' 
								||  response.status == '500'){
								//This is the XSRF error.  So call the client login to get the token needed to get past this
								//The submit the login again
								WL.Client.login(self.CUSTOM_AUTH_REALM_NAME);
								resubmit = false;
								self.submitLoginForm(self.getAuthURL(), loginOptions, lang.hitch(self,afterSubmit)); 
						}
						else{
							var responseError = self._parseAuthenticationError(response);
							deferred.reject(responseError);
							self.isAuthenticating = false;
						}
					};
					self.submitLoginForm(self.getAuthURL(), loginOptions, lang.hitch(self,afterSubmit)); 
			}));
			});
		},
		
		initialize: function() {
			console.log("initializing");
		}
	
	});
});
