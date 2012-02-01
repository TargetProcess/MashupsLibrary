tau.mashups
	.addDependency("libs/jquery/jquery")
	.addMashup(function() {

    var addCommentCountIcons = function() {
        $('div.kanban-item').each(function() {
            var el = $(this);
            var itemType = null;
            var itemId = el.find('.kanban-item-id:first').html();
            if (el.id().match(/kanban-item-userstory-\d+/)) {
                itemType = 'UserStories';
            } else if (el.id().match(/kanban-item-bug-\d+/)) {
                itemType = 'Bugs';
            } else if (el.id().match(/kanban-item-feature-\d+/)) {
                itemType = 'Features';
            }
            if (itemType == null)
                return;
            /* AJAX call to the REST API to gather the due date custom field information */
            $.ajax({
                type: 'GET',
                url: appHostAndPath+'/api/v1/'+itemType+'/'+itemId+'?include=[Comments]&format=json',
                context: el[0],
                contentType: 'application/json',
                dataType: 'json',
                success: function(resp) {
                    if (resp.Comments.length != 0) {
                        if ($(this).find('.tasks-bugs')[0] == undefined) {
                            /* we need to add the .tasks-bugs div */
                            var tbd = $('<div class="tasks-bugs"></div>');
                            if ($(this).find('.kanban-avatars')[0] == undefined) {
                                /* we need to position around an avatar */
                                tbd.addClass('tasks-bugs-left');
                            }
                            $(this).append(tbd);
                        }
                        $(this).find('.tasks-bugs').append('<a href="'+appHostAndPath+'/View.aspx?id='+itemId+'" class="commentCount">'+resp.Comments.length+'</a>');
                    }
                }
            });
        });
    };

    var addRequiredCSS = function() {
        $('head').append('<style type="text/css">' +
                            '.kanban-item .tasks-bugs .commentCount {' +
                                'background: url("'+appHostAndPath+'/JavaScript/tau/css/images/balloon.png") no-repeat;' +
                                'width: auto; height: 16px; display: inline-block; padding: 0 3px 0 16px;' +
                                'font-weight: bold; text-decoration: underline;'+
                            '}' +
                        '</style>');
    };

    /**
     * our main rendering - we wait for doc.ready to deal with slow-rendering browsers and clients
     */
    $(document).ready(function() { 
        /* bind some CSS */
        addRequiredCSS();
        /* and make the magic happen */
        addCommentCountIcons();
        $.each(Tp.controls.kanbanboard.KanbanboardManager.getInstance().kanbanBoards, function() {
            /* bind to reload button */            
            $(this)[0].controller.uxKanbanBoardPanel.on('reload', function() {
                addCommentCountIcons();
            }); 
            /* and bind to when cards change columns */
            $(this)[0].controller.on('statechanged', function(b, c) {
                addCommentCountIcons();
            });
        });
    });
});

