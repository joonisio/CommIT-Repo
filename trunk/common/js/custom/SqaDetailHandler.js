define("custom/SqaDetailHandler", 
	   [ "dojo/_base/declare",
	     "dojo/_base/array",
		  "dojo/_base/lang",
		  "custom/SqaObject",
	     "platform/handlers/_ApplicationHandlerBase",
	     "platform/comm/CommunicationManager",
	     "custom/SqaObject", 
	     "platform/translation/SynonymDomain",
	     "platform/model/ModelService",
	     "platform/translation/MessageService",
	     "application/handlers/CommonHandler",
	     "application/business/FieldUtil",
	     "platform/exception/PlatformRuntimeException",
	     "platform/warning/PlatformRuntimeWarning",
	     "platform/auth/UserManager",
	     "platform/util/PlatformConstants",
	     "application/business/WpEditSettings",
	     "platform/util/AsyncAwareMixin",
	     "platform/logging/Logger",
	     "application/handlers/FailureCodeHandler",
	     "platform/store/PersistenceManager",
	     "platform/geolocation/GeoLocationTrackingService",
	     "platform/map/MapProperties"],
function(declare, arrayUtil, lang,SqaObject, ApplicationHandlerBase, CommunicationManager,sqa, SynonymDomain, ModelService, MessageService, CommonHandler, FieldUtil, PlatformRuntimeException, PlatformRuntimeWarning, UserManager, PlatformConstants, WpEditSettings, AsyncAwareMixin, Logger, FailureCodeHandler,PersistenceManager,GeoLocationTrackingService,MapProperties) 
{
	var listSizeArray = ['plusgaudlinelistsize'];
	var questionArray =['Peralatan Perlindungan Diri (PPD) - Topi Keselamatan',
	                    '\'Vest\' Keselamatan',
	                    'Kasut Keselamatan',
	                    'Sarung tangan',
	                    'Pakaian Kalis Arka (AFS/FRS)',
	                    'Tool & Equipment',
	                    'Instrument',
	                    'Kenderaan',
	                    'Peralatan lalulintas',
	                    'Komposisi Pasukan (AP/ST/CP)',
	                    'NIOSH TNB Safety Passport - NTSP',
	                    'Test B4 Touch - TBT (AP & Pekerja)',
	                    'NSL, Notis AWAS, Notis BAHAYA, Notis PENGUJIAN & Penghadang (Warning Tape)',
	                    'Tool Box Talk',
	                    'Permit to Work - PTW',
	                    'HIRADC',
	                    'Ruang Terkurung',
	                    'Prosidur Kerja',
	                    'Pengurusan Bahan Buangan Terjadual (jika Berkaitan)'];
	var loadingLists = false;
	return declare( [ApplicationHandlerBase, AsyncAwareMixin],{	
		
		initSqa : function(eventContext){
			console.log('custom.SqaDetailHandler');
			var actualSqa = CommonHandler._getAdditionalResource(eventContext,"sqa").getCurrentRecord();
			
			//console.log(actualSqa);
		
			//check number of question.if question empty it will automatically populate the question from audit template
			var noOfQuestion= actualSqa.plusgaudlinelist.data.length;
			var questions = [];
			var sqlineaSet= CommonHandler._getAdditionalResource(eventContext,"sqa.plusgaudlinelist");
			console.log(sqlineaSet);
			
			if(noOfQuestion==0){
				console.log("question is empty");
				var j =0;
				var newSQA= null;

				for(var i=0;i<questionArray.length;i++){
				newSQA= sqlineaSet.createNewRecord();
				j =i+1;
				newSQA.set('description',questionArray[i]);
				newSQA.set('question_longdescription',j.toString());
				newSQA.set('linenum',j);
				}
				
				var sqaSet =sqlineaSet.getParent().getOwner();
				ModelService.save(sqaSet).then(function(){
					console.log("saved");
//					var currSqa = sqlineaSet.getCurrentRecord();
//					currSqa.deleteLocal();
					});	
				console.log(actualSqa);
			}	else{	
				
				var total = 0;
				var totalYes=0;
				var percentage =0;
				
				arrayUtil.forEach(sqlineaSet.data, function(sqline){
					if(sqline.linescore!= null){
						total = total +sqline.linescore;
					}
					if(sqline.yes!==false){
						totalYes = totalYes +sqline.linescore;
					}
					
				});
				percentage = Math.floor(totalYes/total*100);

				actualSqa.set("percentage",percentage);
				actualSqa.set("score",total);
			}
			
			//console.log(actualSqa.get('plusgauditid'));
			
		},
		
		initSqaLine:function(eventContext){
			console.log('initSqaLine');
			var actualSqa = CommonHandler._getAdditionalResource(eventContext,"sqa.plusgaudlinelist").getCurrentRecord();
			actualSqa.deleteLocal();
		},
		
		filterSqaQuestion:function(eventContext){
			console.log('filterSqaQuestion');
			var actualSqa = CommonHandler._getAdditionalResource(eventContext,"sqa").getCurrentRecord();
			var id = actualSqa.get('plusgauditid');
			console.log(id);
			
			if (id != null) {
				console.log('plusgauditid is not null');
				ModelService.filtered('audlineResource', null,[{plusgauditid: id}], 1000, null,null,null,null).then(function(locset){
					console.log(locset);
					eventContext.application.addResource(locset);
					eventContext.ui.show('WorkExecution.SqaLineView2');
				}).otherwise(function(error) {
					console.log('error');
					console.log(JSON.stringify(error));
				});
		} else {
			Logger.trace("plusgauditid is null");
			eventContext.application.addResource(null);
			//eventContext.ui.show('WorkExecution.SqaLineView');
		}
			
		},
		

		
		saveSqa : function(eventContext){
			var actualSqa2 = CommonHandler._getAdditionalResource(eventContext,"sqa");
//			var actualSqaline = CommonHandler._getAdditionalResource(eventContext,"sqa.plusgaudline");
//			console.log(actualSqaline);
			var self = this;
			ModelService.save(actualSqa2).then(function(){
					self.ui.hideCurrentView(PlatformConstants.CLEANUP);	
			});
			
		},
		
		saveSqaStatus : function(eventContext){		
			var sqa = CommonHandler._getAdditionalResource(eventContext,"sqa");
			
			var statusChangeResource = CommonHandler._getAdditionalResource(eventContext,"statusChangeResource").getCurrentRecord();
		
			/*var sqaStatusSet= CommonHandler._getAdditionalResource(eventContext,"sqa.plusgauditchstatusList");
			newSqaStatus = sqaStatusSet.createNewRecord();
			
			newSqaStatus.set("changedate",statusChangeResource.get("changedate"));
			newSqaStatus.set("statusdesc",statusChangeResource.get("statusdesc"));
			newSqaStatus.set("memo",statusChangeResource.get("memo"));
			*/
			currSQA = sqa.getCurrentRecord();
			
			currSQA.openPriorityChangeTransaction();
			
			currSQA.set("status", statusChangeResource.get("status"));
			currSQA.set("statusdesc", statusChangeResource.get("status"));
			currSQA.set("memo",statusChangeResource.get("memo"));
			//currSQA.set("statusdate", statusChangeResource.get("changedate"));
			currSQA.setDateValue("statusdate",statusChangeResource.getAsDateOrNull("changedate"));	
			currSQA.setDateValue("changestatusdate",statusChangeResource.getAsDateOrNull("changedate"));
			
			/*var sqaSet =sqaStatusSet.getParent().getOwner();
			
			ModelService.save(sqaSet).then(function(){
				console.log('save sqa status completed');
				
			}).otherwise(function(error) {
			  self.ui.showMessage(error.message);
			});*/
			
			ModelService.save(sqa).then(function(){
				console.log('save sqa completed');
				console.log(sqa);
				
			}).otherwise(function(error) {
			  self.ui.showMessage(error.message);
			});
			
			this.ui.hideCurrentView();
		},

		
		SBCheckboxHandler: function(eventContext){
			var newValue = !eventContext.checkBoxWidget.get('value');
			console.log(newValue);
			var sqa = CommonHandler._getAdditionalResource(eventContext,"sqa.plusgaudlinelist").getCurrentRecord();
			
			
			if(newValue){
				sqa.set('linescore',1);
				sqa.set('no',false);
				sqa.set('notapplicable',false);
			}else{
				sqa.set('linescore',null);
			}		
			
		},
		
		NotApplicableHandler: function(eventContext){
			var newValue = !eventContext.checkBoxWidget.get('value');
			console.log(newValue);
			var sqa = CommonHandler._getAdditionalResource(eventContext,"sqa.plusgaudlinelist").getCurrentRecord();
			if(newValue){
				sqa.set('linescore',0);
				sqa.set('no',false);
				sqa.set('yes',false);
			}else{
				sqa.set('linescore',null);
			}	
			
		},
		
		USBHandler: function(eventContext){
			var newValue = !eventContext.checkBoxWidget.get('value');
			console.log(newValue);
			var sqa = CommonHandler._getAdditionalResource(eventContext,"sqa.plusgaudlinelist").getCurrentRecord();
			if(newValue){
				sqa.set('linescore',null);
				sqa.set('yes',false);
				sqa.set('notapplicable',false);
			}	
			
		},
		
		
		
		refreshAllListSizes: function(eventContext){	
			if(!loadingLists){
				var permit = eventContext.application.getResource('permit').getCurrentRecord();
				attributes.forEach(function(listAttribute, index){
					var list = permit.getLoadedModelDataSetOrNull(listAttribute);
					var cachedList = eventContext.application.getResource('permit.' + listAttribute);
					if (cachedList && cachedList.isDirty()){
						//race condition:
						//related resource changes weren't updated to jsonstore
						//before we get here, so rely on what's in memory that's
						//most accurate state until data goes to server
						
						list = cachedList;
					}

					if (list && listAttribute === 'attachments'){
						list.clearFilterAndSort();
						//list.filter("urlType == null || urlType == 'FILE'");
					}
					
					/* if we created some new record in the set, show it regardless if we downloaded data or not */
					if(list && (permit.isComplexAttributeLoaded(listAttribute) || list.count() > 0)){
						permit.set(listSizeArray[index], list.count() + "");
					}else{
						permit.set(listSizeArray[index], "--");
					}
				});

			}			
		},
		
		
		
		initAddSqaView: function(eventContext) {
			var view = eventContext.viewControl;
			var sqaSet=null;
			var workOrder = this.application.getResource("workOrder").getCurrentRecord(); 
			var wonum = workOrder.get('wonum');
			
			if(!view.isOverrideEditMode()){
				sqaSet= CommonHandler._getAdditionalResource(eventContext,"workOrder.sqalist");
				var newSQA= sqaSet.createNewRecord();
				SqaObject.setDefaultValues(newSQA, wonum);
				this.saveCreateSqa(eventContext);
			}
			if(sqaSet){
				eventContext.setMyResourceObject(sqaSet);		
			}
		
				
		},
		
		saveCreateSqa:function(eventContext){	
			console.log("create sqa");
			
			if(!eventContext.viewControl.validate()){
				return;
			}
			this.saveTransaction(eventContext);
	

		},
		
		saveTransaction:function(eventContext){	
			console.log("___create sqa");
			var msg = MessageService.createStaticMessage("New SQA was created").getMessage();
			try{
     			var workOrderSet = CommonHandler._getAdditionalResource(this,"workOrder");
     			var sqa = workOrderSet.getCurrentRecord();
				if (!sqa.isNew()) {
					console.log("is new");
					ModelService.save(workOrderSet);
					eventContext.ui.showToastMessage(msg);
				}			
				//this.ui.hideCurrentView();
			}catch(e){
				throw e;
			}
			

		},
		
		handleBackButtonClick: function(eventContext){
			console.log("handleBackButtonClick");
			var view = eventContext.viewControl;
			if(!view.isOverrideEditMode()){
				var sqa=eventContext.getCurrentRecord();
				sqa.deleteLocal();
				return;
			}
			this.saveCreateSqa(eventContext);
		},
		
		initSQALine: function(eventContext){
			var sqaline = CommonHandler._getAdditionalResource(this,"sqa.plusgaudlinelist");
			console.log(sqaline);
			console.log("Init SQAline");
			if (sqaline.data.length > 19)
				sqaline.data.splice(0, 19);

		},
		discardSqa: function(eventContext){
			 this.ui.hideCurrentView(PlatformConstants.CLEANUP);
		},
		
		initEditStatusView : function(eventContext) {
			console.log('function: initEditStatusView');
			var workOrder = eventContext.getCurrentRecord();
			var statusChange = CommonHandler._getAdditionalResource(eventContext,"statusChangeResource").getCurrentRecord();
			statusChange.setDateValue("changedate", this.application.getCurrentDateTime());
			statusChange.setNullValue("status");
			statusChange.setNullValue("statusdesc");
			statusChange.setNullValue("memo");
			eventContext.ui.application.toolWarningShown = false;
				
		},
		discardStatusChange: function(eventContext){	
			this.ui.hideCurrentView(PlatformConstants.CLEANUP);		
		},
		
		
	});
		
});