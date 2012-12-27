tau.mashups
	.addDependency('tp/userStory/view')
	.addDependency('tp/task/view')
	.addDependency('tp/request/view')
	.addDependency('tp/bug/view')
	.addDependency("jQuery")
	.addMashup(function(storyView, taskView, requestView, bugView, $, config) {

        function searchifyTags() {
            setTimeout(function() {
               	$('li[rel="tag"]:not(".search-linked")').each(function() {
                    $(this).addClass('search-linked').find('span:eq(0)').html('<a href="{0}/Search/Search.aspx?SearchString=tag%253a{1}">{1}</a>'.f(
                        appHostAndPath, $(this).find('span:eq(0)').html()));
                });
            });
        }

		storyView.onRender(searchifyTags);
		taskView.onRender(searchifyTags);
		requestView.onRender(searchifyTags);
		bugView.onRender(searchifyTags);
		
        $(document).ready(searchifyTags);
    }
);

/* my new favorite proto function */
String.prototype.f = function() {
    var s = this, i = arguments.length;
    while (i--)
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    return s;
};

