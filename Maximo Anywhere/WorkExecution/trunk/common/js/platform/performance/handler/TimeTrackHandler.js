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

define("platform/performance/handler/TimeTrackHandler",
	   [ "dojo/_base/declare",
        "platform/handlers/_ApplicationHandlerBase",
        "platform/model/ModelService",
        "dojo/store/Memory",
        "dojo/cookie"],
       function(declare, ApplicationHandlerBase,ModelService, Memory,cookie) {
       return declare( ApplicationHandlerBase, {
                      
/**@memberOf platform.performance.handler.TimeTrackHandler */
                      enableDisableTT: function(eventContext){
                      
                      if(trackTimeEnabled){
                      trackTimeEnabled = false;
                      localStorage.trackTimeEnabled = trackTimeEnabled;
                      
                      }else {
                      trackTimeEnabled = true;
                      localStorage.trackTimeEnabled = trackTimeEnabled;
                      
                      }
                      
                      },
                      
                      setLabel: function(eventContext){
                      
                      require(["platform/translation/MessageService"],
                              function(MessageService){
                              if(trackTimeEnabled){
                              eventContext.set('label', MessageService.createStaticMessage('Disable Performance Tracking').getMessage(this));
                              }else {
                              eventContext.set('label', MessageService.createStaticMessage('Enable Performance Tracking').getMessage(this));
                              }
                              });
                      
                      },
                      
                      saveNew: function(eventContext){
                      
                      var timeTrackSet= this.application.getResource("timeTrack");
                      
                      var newtimeTrack= timeTrackSet.createNewRecord();
                      newtimeTrack.set('ttid', 'New');
                      newtimeTrack.set('content', perfStore);
                      
                      ModelService.save(timeTrackSet);
                      
                      },
                      
                      
                      
                      saveOld: function(eventContext){
                      var timeTrackSet= this.application.getResource("timeTrack");
                      
                      var newtimeTrack= timeTrackSet.createNewRecord();
                      newtimeTrack.set('ttid', 'Old');
                      newtimeTrack.set('content', perfStore);
                      
                      ModelService.save(timeTrackSet);
                      
                      },
                      
                      viewNew: function(eventContext){
                      var cur = this;
                      ModelService.filtered('timeTrack', null, {ttid: 'New'}).then(function(resourceSet){
                                                                                   resourceSet.filter("ttid == 'New'");
                                                                                   perfStore = null;//resourceSet.getRecordAt(0).get('content');
                                                                                   perfStore = new Memory({data: resourceSet.getRecordAt(0).get('content')['data']});
                                                                                   cur.renderTT(eventContext);
                                                                                   });
                      
                      },
                      
                      
                      
                      viewOld: function(eventContext){
                      var cur = this;
                      ModelService.filtered('timeTrack', null, {ttid: 'Old'}).then(function(resourceSet){
                                                                                   resourceSet.filter("ttid == 'Old'");
                                                                                   perfStore = null;//resourceSet.getRecordAt(0).get('content');
                                                                                   perfStore = new Memory({data: resourceSet.getRecordAt(0).get('content')['data']});
                                                                                   cur.renderTT(eventContext);
                                                                                   });
                      
                      },
                      
                      clear: function(eventContext){
                      perfStore = null;
                      this.renderTT(eventContext);
                      },
                      
                      removeAll: function(eventContext){
                      //TODO: Update Labor and Crew fields with any new values
                      alert('OLD');
                      //eventContext.setMyResourceObject(eventContext.resourceObject);
                      },
                      
                      emailCurrent: function(eventContext){
                      //TODO: Update Labor and Crew fields with any new values
                      var cur = this;
                      
                      var emailContent = {
                      subject:     null,
                      body:        null,
                      to:          ["email@to.send"],
                      cc:          null,
                      bcc:         null,
                      attachments: null,
                      isHtml:      false
                      };
                      
                      require([ "platform/email/EmailPlugin","dojo/date/locale","dojox/mobile/ToolBarButton", "dojo/on",
                               "platform/translation/MessageService"],
                              function(EmailPlugin, locale, ToolBarButton, on, MessageService){
                              WL.Device.getNetworkInfo(function (networkInfo) {
                                                       var body  = '';
                                                       
                                                       body  += cur._creatTextEmail(networkInfo);
                                                       
                                                       //var args = [body,'email@to.send',MessageService.createStaticMessage('Track Performance Data Report').getMessage(this)];
                                                       emailContent['body'] = body;
                                                       emailContent['subject'] = MessageService.createStaticMessage('Track Performance Data Report').getMessage(this);
                                                       var email =  new EmailPlugin();
                                                       email.sendEmail(emailContent, eventContext);
                                                       
                                                       });
                              });
                      },
                      
                      _creatTextEmail: function(networkInfo){
                      var inner = '';
                      
                      require(["platform/translation/MessageService"],
                              function(MessageService){
                              inner += MessageService.createStaticMessage('Device Info').getMessage(this) + ' <br />';
                              
                              inner +='============================================================================================================= <br />';
                              
                              inner+=	MessageService.createStaticMessage('Operating System: ').getMessage(this);
                              
                              inner+=WL.Client.getEnvironment() + ", ";
                              
                              inner+=	MessageService.createStaticMessage('Locale/Language: ').getMessage(this);
                              
                              inner+=WL.App.getDeviceLocale() +"/"+WL.App.getDeviceLanguage() + ", ";
                              
                              
                              inner+=	MessageService.createStaticMessage('Connected: ').getMessage(this);
                              if(networkInfo){
                              if(networkInfo.isNetworkConnected == 'true'){
                              inner+= MessageService.createStaticMessage('Yes').getMessage(this);
                              }else{
                              inner+= MessageService.createStaticMessage('No').getMessage(this);
                              }
                              }
                              
                              
                              inner+=	 MessageService.createStaticMessage('carrier Name: ').getMessage(this);
                              
                              if(networkInfo){
                              inner+= networkInfo.carrierName + ", <br />";
                              }
                              
                              
                              inner+=	MessageService.createStaticMessage('Network Connection Type: ').getMessage(this);
                              
                              if(networkInfo){
                              inner+= networkInfo.networkConnectionType + ", ";
                              }
                              
                              
                              
                              inner+=	MessageService.createStaticMessage('Telephony Network Type: ').getMessage(this);
                              
                              if(networkInfo){
                              inner+= networkInfo.telephonyNetworkType + ", <br />";
                              }
                              
                              inner +='============================================================================================================= <br />';
                              inner += MessageService.createStaticMessage('Performance Data').getMessage(this) + ' <br />';
                              inner +='============================================================================================================= <br />';
                              
                              
                              inner+=	MessageService.createStaticMessage('Process, ').getMessage(this);
                              
                              inner+= MessageService.createStaticMessage('Processing Time, ').getMessage(this);
                              
                              inner+= MessageService.createStaticMessage('Start and Stop Times, ').getMessage(this);
                              
                              inner+= MessageService.createStaticMessage('Synchronous? ').getMessage(this) + '<br />';
                              
                              //build data
                              if(perfStore ==null){
                              inner += MessageService.createStaticMessage('No data to display ').getMessage(this) + '<br />';
                              }else{
                              perfStore.query(function(object) {
                                              
                                              
                                              inner+=	object.description + ", ";
                                              
                                              
                                              inner+= object.elapsed/1000+ ", ";
                                              
                                              inner+=  dojo.date.locale.format(new Date(object.start), {datePattern: "yyyy-MM-dd", timePattern: "HH:mm:ss.SSS"});
                                              inner+= " / ";
                                              inner+=  dojo.date.locale.format(new Date(object.stop), {datePattern: "yyyy-MM-dd", timePattern: "HH:mm:ss.SSS"}) + ", ";
                                              
                                              inner+=	object.isSync + "<br />";
                                              
                                              
                                              });
                              
                              }
                              
                              inner +='============================================================================================================= <br />';
                              inner += MessageService.createStaticMessage('End').getMessage(this) + ' <br />';
                              inner +='============================================================================================================= <br />';
                              });
                      		  
                      	return inner.replace(/<br\s*[\/]?>/gi,"\n");
                      
                      },
                      
                      dbBenchMark: function(eventContext){
                      //TODO: Update Labor and Crew fields with any new values
                      alert('OLD');
                      //eventContext.setMyResourceObject(eventContext.resourceObject);
                      },
                      
                      renderTT: function(eventContext){
                      
                      WL.Device.getNetworkInfo(function (networkInfo) {
                                               require(["platform/translation/MessageService"],
                                                       function(MessageService){
                                                       //TimeTrack.startTracking();
                                                       var tt = dojo.query("[id='Platform.TimeTrackReport']").query("[class='mblScrollableViewContainer']");
                                                       //TimeTrack.stopTracking();
                                                       //var inner ='<div>';
                                                       //table with device info
                                                       var inner = '<table style="width: 100%" bgcolor="white"  border="1" cellspacing="0">';
                                                       inner+='<tr>';
                                                       inner+='<th >';
                                                       inner+=	MessageService.createStaticMessage('Operating System').getMessage(this);
                                                       inner+='</th>';
                                                       
                                                       
                                                       inner+='<td>';
                                                       inner+=WL.Client.getEnvironment();
                                                       inner+='</td>';
                                                       
                                                       inner+='<th >';
                                                       inner+=	MessageService.createStaticMessage('Locale/Language').getMessage(this);
                                                       inner+='</th>';
                                                       
                                                       inner+='<td>';
                                                       inner+=WL.App.getDeviceLocale() +"/"+WL.App.getDeviceLanguage();
                                                       inner+='</td>';
                                                       
                                                       
                                                       inner+='</tr>';
                                                       //device info
                                                       inner+='<tr>';
                                                       inner+='<th >';
                                                       inner+=	MessageService.createStaticMessage('Connected').getMessage(this);
                                                       inner+='</th>';
                                                       
                                                       inner+='<td>';
                                                       if(networkInfo){
                                                       if(networkInfo.isNetworkConnected == 'true'){
                                                       inner+= MessageService.createStaticMessage('Yes').getMessage(this);
                                                       }else{
                                                       inner+= MessageService.createStaticMessage('No').getMessage(this);
                                                       }
                                                       }
                                                       inner+='</td>';
                                                       
                                                       inner+='<th >';
                                                       inner+=	MessageService.createStaticMessage('Carrier Name').getMessage(this);
                                                       inner+='</th>';
                                                       
                                                       inner+='<td>';
                                                       if(networkInfo){
                                                       inner+= networkInfo.carrierName;
                                                       }
                                                       
                                                       inner+='</td>';
                                                       
                                                       inner+='</tr>';
                                                       
                                                       inner+='<tr>';
                                                       inner+='<th >';
                                                       inner+=	MessageService.createStaticMessage('Network Connection Type').getMessage(this);
                                                       inner+='</th>';
                                                       
                                                       inner+='<td>';
                                                       
                                                       if(networkInfo){
                                                       inner+= networkInfo.networkConnectionType;
                                                       }
                                                       
                                                       inner+='</td>';
                                                       
                                                       inner+='<th >';
                                                       inner+=	MessageService.createStaticMessage('Telephony Network Type').getMessage(this);
                                                       inner+='</th>';
                                                       
                                                       inner+='<td>';
                                                       if(networkInfo){
                                                       inner+= networkInfo.telephonyNetworkType;
                                                       }
                                                       
                                                       inner+='</td>';
                                                       
                                                       inner+='</tr>';
                                                       
                                                       inner += '</table>';
                                                       //inner+='</div>';
                                                       
                                                       inner+='<br>';
                                                       inner+='<br>';
                                                       inner+='<br>';
                                                       
                                                       
                                                       
                                                       //render info
                                                       //inner +='<div>'
                                                       inner += '<table style="width: 100%" bgcolor="white"  border="1" cellspacing="0">';
                                                       //build header
                                                       inner+='<tr>';
                                                       inner+='<th >';
                                                       inner+=	MessageService.createStaticMessage('Process').getMessage(this);
                                                       inner+='</th>';
                                                       inner+='<th>';
                                                       inner+= MessageService.createStaticMessage('Processing Time').getMessage(this);
                                                       inner+='</th>';
                                                       inner+='<th >';
                                                       inner+= MessageService.createStaticMessage('Start and Stop Times').getMessage(this);
                                                       inner+='</th>';
                                                       inner+='<th >';
                                                       inner+= MessageService.createStaticMessage('Synchronous?').getMessage(this);
                                                       inner+='</th>';
                                                       
                                                       inner+='</tr>';
                                                       
                                                       //build data
                                                       if(perfStore ==null){
                                                       inner += MessageService.createStaticMessage('No data to display ').getMessage(this);
                                                       }else{
                                                       perfStore.query(function(object) {
                                                                       
                                                                       inner+='<tr>';
                                                                       inner+='<td >';
                                                                       inner+=	object.description;
                                                                       inner+='</td>';
                                                                       if((object.elapsed/1000)>1){
                                                                       inner+='<td style="color: red" >';
                                                                       }else{
                                                                       inner+='<td >';
                                                                       }
                                                                       inner+= object.elapsed/1000;
                                                                       inner+='</td>';
                                                                       
                                                                       inner+='<td >';
                                                                       inner+=  dojo.date.locale.format(new Date(object.start), {datePattern: "yyyy-MM-dd", timePattern: "HH:mm:ss.SSS"});
                                                                       inner+= " / ";
                                                                       inner+=  dojo.date.locale.format(new Date(object.stop), {datePattern: "yyyy-MM-dd", timePattern: "HH:mm:ss.SSS"});
                                                                       inner+='</td>';
                                                                       inner+='<td >';
                                                                       inner+=	object.isSync;
                                                                       inner+='</td>';
                                                                       
                                                                       inner+='</tr>';
                                                                       
                                                                       });
                                                       
                                                       }
                                                       
                                                       inner += '</table>';
                                                       //inner+='</div>';
                                                       tt.attr('innerHTML', inner );
                                                       
                                                       });
                                               });
                      },
                      
                      
                      
                      
                      });
       });
