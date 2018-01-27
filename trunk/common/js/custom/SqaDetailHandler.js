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
	var loadingLists = false;
	return declare( [ApplicationHandlerBase, AsyncAwareMixin],{	
		
		initSqa : function(eventContext){
			console.log('custom.SqaDetailHandler');
			var actualSqa = CommonHandler._getAdditionalResource(eventContext,"sqa").getCurrentRecord();
			
			console.log(actualSqa);
			var sqlLineCount = actualSqa.plusgaudlinelistsize;
			console.log(sqlLineCount);
		
			if(sqlLineCount==null){
				actualSqa.set(listSizeArray[0],0);
			}else{
				actualSqa.set(listSizeArray[0],sqlLineCount);
			}
			
			//check number of question.if question empty it will automatically populate the question from audit template
//			var noOfQuestion= actualSqa.plusgaudlinelist.data.length;
//			var questions = [];
//			var sqlineaSet= CommonHandler._getAdditionalResource(eventContext,"sqa.plusgaudlinelist");
//			
//			if(noOfQuestion==0){
//				console.log("question is empty");
//				
//				var newSQA= sqlineaSet.createNewRecord();
//				newSQA.set('description',"hai");
//				//eventContext.setMyResourceObject(sqlineaSet);
//				ModelService.save(actualSqa).always(function(){
//					console.log("saved");
//					//workOrder.deleteLocal();
//					});			
//			
//			}
//			
//			console.log(actualSqa.get('plusgauditid'));
			
		},
		
		saveSqa : function(eventContext){
			var msg = MessageService.createStaticMessage("save succesful").getMessage();
			var actualSqa2 = CommonHandler._getAdditionalResource(eventContext,"sqa");
			ModelService.save(actualSqa2).then(function(){
				eventContext.ui.showToastMessage(msg);
				console.log('save completed');
				
			}).otherwise(function(error) {
			  self.ui.showMessage(error.message);
			});
		},
		
		checkboxInit : function(eventContext){
			console.log('checkboxHanlder');
			var sqa = CommonHandler._getAdditionalResource(eventContext,"sqa").getCurrentRecord();
			for(var i=0;i<sqa.plusgaudlinelist.data.length;i++){
				var sqaLine = sqa.plusgaudlinelist.data[i];		
//				if(sqaLine.no == true && sqaLine.yes == true || sqaLine.no == true && sqaLine.notapplicable == true ||
//						sqaLine.yes == true && sqaLine.no == true || sqaLine.yes == true && sqaLine.notapplicable == true ||
//						sqaLine.notapplicable == true && sqaLine.no == true || sqaLine.notapplicable == true && sqaLine.yes == true ){
//					console.log("condition");	
//					sqaLine.getRuntimeFieldMetadata('no').set('readonly', true);
//					sqaLine.getRuntimeFieldMetadata('yes').set('readonly', true);
//					sqaLine.getRuntimeFieldMetadata('notapplicable').set('readonly', true);
//				}
			}
		},
		
		checkboxHandler: function(eventContext){
			console.log('checkboxHanlder');
//			var sqa = CommonHandler._getAdditionalResource(eventContext,"sqa").getCurrentRecord();
//			console.log(sqa);
//			var sqaLine = sqa.plusgaudlinelist.data;
//			console.log(sqa);
//			if(sqlLine == true){
//				console.log('no');
//				sqaLine.set("yes",false);
//				sqaLine.set("notapplicable",false);
//				
//			}else if(sqaLine == true){
//				console.log('yes');
//				sqaLine.set("no",false);
//				sqaLine.set("notapplicable",false);
//				
//			}else{
//				sqaLine.set("no",false);
//				sqaLine.set("yes",false);			
//			}
			
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
				SqaObject.setDefaultValues(newSQA, wonum)
//				newSQA.set('tnbwonum',wonum);
//				//newSQA.set('auditnum','6002');
//				newSQA.set('description','SQA for Work order ' + wonum);
//				newSQA.set('status',"ENTRY");
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
			this.saveTransaction();
	

		},
		
		saveTransaction:function(eventContext){	
			console.log("___create sqa");
			
			try{
     			var workOrderSet = CommonHandler._getAdditionalResource(this,"workOrder");
     			var sqa = workOrderSet.getCurrentRecord();
				if (!sqa.isNew()) {
					console.log("is new");
					ModelService.save(workOrderSet);
				}			
				this.ui.hideCurrentView();
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
		}
		
		
	});
		
});