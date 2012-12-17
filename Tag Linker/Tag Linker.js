tau.mashups
.addDependency(	'tp/userStory/view')
	.addDependency('tp/task/view')
	.addDependency('tp/request/view')
	.addDependency('tp/bug/view')
	.addDependency("jQuery")
	.addMashup(function(storyView, taskView, requestView, bugView, $, config) {

       function renderTagLinks() {
			window.setTimeout(function() {
	            $('li[rel="tag"]:not(".linkz0red")').each(function() {
					console.log($(this));
	                $(this).addClass('linkz0red');
	                var capture = /#(\d+)/.exec($(this).find('span:eq(0)').html());
	                if (capture != null) {
	                    var id = capture[1];
	                    $.ajax({
	                        type: 'GET',
	                        url: (appHostAndPath + '/api/v1/Generals/{0}?include=[EntityType]&format=json').f(id),
	                        context: $(this)[0],
	                        contentType: 'application/json',
	                        dataType: 'json',
	                        success: function(resp) {
	                            $(this).find('span:eq(0)').html("<a href='#{0}/{1}'>{2}</a>".f(
	                                    resp.EntityType.Name.toLowerCase(), resp.Id,  
	                                    $(this).find('span:eq(0)').html())
	                                );
	                        }
	                    });
	                };
	            });
			},1000);
        }

        $(document).ready(renderTagLinks);
		
		storyView.onRender(renderTagLinks);
		taskView.onRender(renderTagLinks);
		requestView.onRender(renderTagLinks);
		bugView.onRender(renderTagLinks);
    }
);

/* my new favorite proto function */
String.prototype.f = function() {
    var s = this, i = arguments.length;
    while (i--)
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    return s;
};
