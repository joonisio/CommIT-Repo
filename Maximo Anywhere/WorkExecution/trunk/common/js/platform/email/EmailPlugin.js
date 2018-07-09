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

/**
 * Class responsibly to call the Email plugin
 */
define("platform/email/EmailPlugin",
	   [ "dojo/_base/declare", "platform/translation/MessageService",
        "platform/warning/PlatformRuntimeWarning",
        "dojo/_base/lang"],
       function(declare, MessageService, PlatformRuntimeWarning, lang) {
       return declare( null, {
                      name: 'EmailPlugin',
                      properties: null,
                      sharingListener: null,
                      /**
                       * Method responsible by call the email plugin, it will call the device email client and 
                       * present a success or fail message.
                       * The input parameters are a json like the {defaults} with the email information and a context where the email message will be displayed
                       * i.g 
                       * var email =  new EmailPlugin();
                       * email.sendEmail(emailContent, eventContext);
                       * both are required
                       * 
                       * @param {JSON} option with all the email fiels
                       * @param {envContext} context where the message will be presented
                       * 
                       * 
                       */
/**@memberOf platform.email.EmailPlugin */
                      sendEmail: function(options, curContext) {
	                      var callbackFn = null,
	                      options    = options || {};
	                      
	                      var defaults = {
	                      subject:     null,
	                      body:        null,
	                      to:          null,
	                      cc:          null,
	                      bcc:         null,
	                      attachments: null,
	                      isHtml:      false
	                      }
	                      
	                      for (var key in defaults) {
	                    	if (options[key] == null)
	                          {
	                              defaults[key] = "";
	                          }
	                         else if (options[key] != undefined) {
	                            defaults[key] = options[key];
	                        }
	                      }
	                      
	                      if(WL.Client.getEnvironment() == 'preview'){
	                      
	                    	  curContext.ui.showMessage(MessageService.createStaticMessage('EMAIL_ERROR').getMessage(this));
	                      } else if (WL.Client.getEnvironment() == 'windows8')
	                      {
	                          this.sendEmailW8([defaults]);

	                      }  else {
	                    	  var callbackFnOk = function (message) {
	                    		  curContext.ui.showMessage(MessageService.createStaticMessage('Log was sent.').getMessage(this));
	                          };
	                          
	                          var callbackFnError = function (message) {
	                        	  curContext.ui.showMessage(MessageService.createStaticMessage('SEND_EMAIL_ERROR').getMessage(this) + message);
	                          };
	                      cordova.exec(callbackFnOk , 
	                    		  callbackFnError, 
	                                   "EmailPlugin", "sendMail", [defaults]);
	                      }
                      
                      },
                      
                      /**
                       * Method to check if device has email client
                       */
                      
                      isEmailAvailable:function(args){
                    	  var callbackFn = function () {
                              callback.apply(scope || window, arguments);
                          };

                          cordova.exec(callbackFn, null, 'EmailPlugin', 'isEmailAvailable', []);
                      },
                      
                      //Windows 8 email functions
                      sendEmailW8: function(args){
                          this.properties = args[0];
                          this.sharingListener =  lang.hitch(this, this.shareTextHandler);
                          var dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
                          dataTransferManager.addEventListener("datarequested", this.sharingListener);
                          Windows.ApplicationModel.DataTransfer.DataTransferManager.showShareUI();
                      },

                      shareTextHandler: function (e) {
                       var request = e.request;
                       request.data.properties.title = "Share Log";
                       request.data.properties.description = "Anywhere Application Log";
                       //Need to preserve the line breaks by formatting as HTML
                       var htmlFormatted = Windows.ApplicationModel.DataTransfer.HtmlFormatHelper.createHtmlFormat(this.properties.body);
                       request.data.setHtmlFormat(htmlFormatted);
                          
                       //Need to unregister ourself after the sharing has finished (so we don't respond if they share directly)
                       var dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
                       dataTransferManager.removeEventListener("datarequested", this.sharingListener);
                      },

                      getCCRecepients: function (ccprop) {
                          if (ccprop == "")
                              return "";
                          var ccString = "";
                          for (var i in ccprop) {
                              ccString += ccprop[i] + "\;";
                          }

                          return ccString;

                      },
                        
                      getBCCRecepients: function (ccprop) {
                          if (ccprop == "")
                              return "";
                          var ccString = "";
                          for (var i in ccprop) {
                              ccString += ccprop[i] + "\;";
                          }

                          return ccString;

                      }
                      
                      });
       
       				
       });
