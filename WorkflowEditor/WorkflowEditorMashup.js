tau.mashups
	.addDependency("WorkflowEditor")
	.addDependency("libs/jquery/jquery")
.addMashup(function(WorkflowEditor, jquery, config) {

var prm = Sys.WebForms.PageRequestManager.getInstance();
prm.add_pageLoaded(function() {

	var workflow = $(".subAddContent");
	if (!workflow.length) return;
	  	
		workflow.find("#ctl00_ctl00_mainArea_controlArea_imgDiagram").remove();
		workflow
			.append("<canvas width='500' height='500' id='workfowEditor'></canvas>");
	  	
	  	var editor = new WorkflowEditor("workfowEditor");
	  	//editor.bind('change', function() {alert('hello');})
		
		var processId = new Tp.URL(window.location.href).getArgumentValue('ProcessID');
		$.ajax({
			url: Application.baseUrl + "/api/v1/Processes/"+processId+"/EntityStates?include=[Id,Name,EntityType,NextStates,IsInitial,IsFinal]&format=json&take=1000",
			dataType: 'json',
			context: $('#ctl00_ctl00_mainArea_controlArea_lstEntities').val().replace('Tp.BusinessObjects.', ''),
			success: ProcessLoaded
		});

		function ProcessLoaded(data) {
				var typeName = this;
				for (var i = 0; i < data.Items.length; i++) {
					var state = data.Items[i];
					if (state.EntityType.Name == typeName) {
						editor.Add(state);
					}
				}
				editor.Update();
		}
});


});