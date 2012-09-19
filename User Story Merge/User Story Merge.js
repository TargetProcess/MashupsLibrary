tau.mashups.addDependency('libs/jquery/jquery').addMashup(
function (config) {
	
		var MERGE_MAPPINGS = {
			'UserStory'		: ['Bugs','TestCases','Tasks'],
			'Assignable'	: ['Times','Impediments'],
			'General'		: ['Comments','Attachments']
		};
    
		function processMerge() {
			var storiesToMerge = $find('ctl00_mainArea_us_USSelection')._args;
			storiesToMerge.shift(); /* first element is always blank */
			var targetStory = prompt("Ready to merge.  Which story should be the main/master story? [" + storiesToMerge.join(',') + "]", Math.min.apply(null, storiesToMerge));
			overlay = $('<div></div>').prependTo('body').attr('id', 'page-overlay');
			message = $('<div></div>').prependTo('body').attr('id', 'overlay-msg').html('Please wait...<br/>Hardcore merge action in progress...');
			storiesToMerge.splice(storiesToMerge.indexOf(targetStory),1);
			var count = 0;
			$.each(storiesToMerge, function(i,storyBeingMerged) {
				$.ajax({
					url: '{0}/api/v1/UserStories/{1}?include=[Description,Comments,Times,Impediments,Tasks,Bugs,TestCases,Attachments]'.f(appHostAndPath,storyBeingMerged),
					type: 'get',
		            contentType: 'application/json',
					dataType: 'json',
					success: function(data) {
						/* move items according to the merge map */
						$.each(MERGE_MAPPINGS, function(map, item) {
							$.each(item, function(i,entity) {
								if (data[entity].Items)
									$.each(data[entity].Items, function(i,thing) {
										$.ajax({
											url: '{0}/api/v1/{1}/{2}'.f(appHostAndPath, entity, thing.Id),
											type: 'post',
											contentType: 'application/json',
											dataType: 'json',
											data: '{"{0}":{"Id":{1}}}'.f(map,targetStory)
										}); /* /.ajax */
									}); /* /data[entity].Items */
							}); /* /item */
						}); /* /MERGE_MAPPINGS */
						/* add the "merged" comment */
						$.ajax({
							url: '{0}/api/v1/Comments'.f(appHostAndPath),
							type: 'post',
							contentType: 'application/json',
							dataType: 'json',
							data: '{"General":{"Id":{0}}, "Description": "Merged with Story {1}:<br/>\n<br/>\n{2}"}'.f(targetStory, storyBeingMerged, data.Description||''),
							success: function() {
								/* on success of the comment, delete the old story */
								$.ajax({
									url: "{0}/api/v1/UserStories/{1}".f(appHostAndPath, storyBeingMerged),
									type: 'delete',
									success: function() {
										++count;
										console.log("Merged {0} of {1} stories...".f(count, storiesToMerge.length));
										if (count == storiesToMerge.length)
											location.reload(true);
									}
								});
							}
						}); /* /ajax -> Comments */
					} /* /success */
				});
			});
		}

		$(document).ready(function() {
			$('<style>div#overlay-msg { position:fixed; color: blue; color: white; padding-top: 100px; font-size: 34px; text-align: center; z-index: 10000; width: 100%; } div#page-overlay { position: fixed; height: 100%; width: 100%; z-index: 9000; background: #000; -ms-filter:"progid:DXImageTransform.Microsoft.Alpha(Opacity=50)"; filter: alpha(opacity=50); -moz-opacity:0.5; opacity: 0.5; -khtml-opacity: 0.5; }</style>').appendTo('head');
			$('<a href="#" class="projectContextLink" title="" id="mergeLink">Merge</a>')
				.click(processMerge).insertAfter($('a#ctl00_mainArea_us_lnkImport'));
		});
    }
);

String.prototype.f = function() {
    var s = this, i = arguments.length;
    while (i--)
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    return s;
};
