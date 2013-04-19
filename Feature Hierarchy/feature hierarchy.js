tau.mashups
	.addDependency('tp/feature/view')
	.addDependency('jQuery')
	.addMashup(function(featureView, $, config) {
		
		var baseDiv = null;
		var checkInterval = null;
		var hierarchyMap = null;
		
		function gatherFeatureHierarchy($element) {
			/* reset if needed */
			hierarchyMap = {
				'completed'		: false,
				'subfeatures'	: 0,
				'userstories'	: 0,
				'bugs'			: 0,
				'testcases'		: 0,
				'testcases_pass': 0
			};
			baseDiv = $('<div></div>').css({'text-align': 'center'}).attr('id', 'feature-hierarchy').html('<br/><img alt="" src="data:image/gif;base64,R0lGODlhEAALAPQAAP///wAAANra2tDQ0Orq6gYGBgAAAC4uLoKCgmBgYLq6uiIiIkpKSoqKimRkZL6+viYmJgQEBE5OTubm5tjY2PT09Dg4ONzc3PLy8ra2tqCgoMrKyu7u7gAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCwAAACwAAAAAEAALAAAFLSAgjmRpnqSgCuLKAq5AEIM4zDVw03ve27ifDgfkEYe04kDIDC5zrtYKRa2WQgAh+QQJCwAAACwAAAAAEAALAAAFJGBhGAVgnqhpHIeRvsDawqns0qeN5+y967tYLyicBYE7EYkYAgAh+QQJCwAAACwAAAAAEAALAAAFNiAgjothLOOIJAkiGgxjpGKiKMkbz7SN6zIawJcDwIK9W/HISxGBzdHTuBNOmcJVCyoUlk7CEAAh+QQJCwAAACwAAAAAEAALAAAFNSAgjqQIRRFUAo3jNGIkSdHqPI8Tz3V55zuaDacDyIQ+YrBH+hWPzJFzOQQaeavWi7oqnVIhACH5BAkLAAAALAAAAAAQAAsAAAUyICCOZGme1rJY5kRRk7hI0mJSVUXJtF3iOl7tltsBZsNfUegjAY3I5sgFY55KqdX1GgIAIfkECQsAAAAsAAAAABAACwAABTcgII5kaZ4kcV2EqLJipmnZhWGXaOOitm2aXQ4g7P2Ct2ER4AMul00kj5g0Al8tADY2y6C+4FIIACH5BAkLAAAALAAAAAAQAAsAAAUvICCOZGme5ERRk6iy7qpyHCVStA3gNa/7txxwlwv2isSacYUc+l4tADQGQ1mvpBAAIfkECQsAAAAsAAAAABAACwAABS8gII5kaZ7kRFGTqLLuqnIcJVK0DeA1r/u3HHCXC/aKxJpxhRz6Xi0ANAZDWa+kEAA7AAAAAAAAAAAA" />')
			$('div#feature-hierarchy').remove();
			/* get our ID */
			var featureId = $element.find('span.entity-id').text().match(/^#(\d+)$/);
			if (!featureId) return;
			featureId = featureId[1];
			console.log("Building hierarchy for feature ID " + featureId);
			/* add our base results div with our waiting indicator */
			$element.find('div.ui-total-effort').append(baseDiv);
			/* and make things happen! */
			checkHierarchyFromFeature(featureId);
			addHierarchyInformationForFeature(featureId);
			/* continuously check for completed data to display */
			checkInterval = setInterval(displayHierarchyData, 1000);
		}
		
		function checkHierarchyFromFeature(id) {
			console.log(">> Checking hierarchy at feature " + id);
			$.get(appHostAndPath + "/api/v1/Relations?format=json&where=Master.Id%20eq%20" + id + "RelationType.Name%20eq%20Dependency'%20and%20Slave.EntityType.Name%20eq%20'Feature'",
				function(data) {
					if (data.Items.length == 0) {
						if ($.active == 0) {
							/* we're all done */
							hierarchyMap.completed = true;
						} else {
							/* have our .ajaxStop say we're all done */
							$(document).ajaxStop(function() {
								hierarchyMap.completed = true;
							});
						}
					}
					$.each(data.Items, function(i, relation) {						
						++hierarchyMap.subfeatures;
						checkHierarchyFromFeature(relation.Slave.Id);
						addHierarchyInformationForFeature(relation.Slave.Id);
					});
			});
		}
		
		function addHierarchyInformationForFeature(id) {
			console.log(">> Gathering story information for feature " + id);
			$.get(appHostAndPath + "/api/v1/Features/" + id + "?format=json&include=[UserStories[Id,Bugs-Count]]", function(data) {
				hierarchyMap.userstories += data.UserStories.Items.length;
				$.each(data.UserStories.Items, function(i, story) {
					hierarchyMap.bugs += story['Bugs-Count'];
					addHierarchyInformationForStory(story.Id);
				});
			});
		}
		
		function addHierarchyInformationForStory(id) {
			console.log(">> Gathering information from story " + id);
			$.get(appHostAndPath + "/api/v1/UserStories/" + id + "?format=json&append=[TestCases-Count]&include=[TestCases[LastStatus]]", function(data) {
				hierarchyMap.testcases += data['TestCases-Count'];
				$.each(data.TestCases.Items, function(i, testcase) {
					if (testcase.LastStatus == true)
						++hierarchyMap.testcases_pass;
				});
			});
		}
		
		function displayHierarchyData() {
			/* don't build if we haven't completed all our ajax calls */
			if (!hierarchyMap.completed) return;
			clearInterval(checkInterval);
			console.log(">> Hierarchy Map completed.");
			$('div#feature-hierarchy').css({'text-align': 'left'});
			$('div#feature-hierarchy').html(
				"Feature has <strong>{0}</strong> total Subfeatures<br/>".f(hierarchyMap.subfeatures) +
				"Feature has <strong>{0}</strong> total User Stories<br/>".f(hierarchyMap.userstories) +
				"Feature has <strong>{0}</strong> total Bugs<br/>".f(hierarchyMap.bugs) +
				"Feature has <strong>{0}</strong> total Test Cases (<strong>{1}</strong> passed)".f(hierarchyMap.testcases, hierarchyMap.testcases_pass)
			);
		}
		
		featureView.onRender(gatherFeatureHierarchy);
	});
	
String.prototype.f = function() {
    var s = this, i = arguments.length;
    while (i--)
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    return s;
};