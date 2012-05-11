tau.mashups
	.addDependency("libs/jquery/jquery")
	.addMashup(function(config) {

        
       function renderTagLinks() {
           $('#main').unbind('DOMSubtreeModified', renderTagLinks);
            var API_BASE = appHostAndPath + '/api/v1/Generals/{0}?include=[EntityType]&format=json';
            $('li[rel="tag"]:not(".linkz0red")').each(function() {
                $(this).addClass('linkz0red');
                var capture = /#(\d+)/.exec($(this).find('span:eq(0)').html());
                if (capture != null) {
                    var id = capture[1];
                    $.ajax({
                        type: 'GET',
                        url: API_BASE.f(id),
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
            $('#main').bind('DOMSubtreeModified', renderTagLinks);
        }

        /* this is ugly. TODO: this should probably be changed once there's a real event to bind to */ 
        $('#main').bind('DOMSubtreeModified', renderTagLinks);
        $(document).ready(function() { new TagLinker().render(); });
    }
);

/* my new favorite proto function */
String.prototype.f = function() {
    var s = this, i = arguments.length;
    while (i--)
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    return s;
};
