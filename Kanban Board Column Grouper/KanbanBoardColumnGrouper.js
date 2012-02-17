tau.mashups
	.addDependency("libs/jquery/jquery")
	.addMashup(function() {

    /**
     * Our configuration.
     * - Project names can be specified as regular expressions
     * - Within each project is the actual configuration, pointing the group name to the appropriate
     *   WIP limit and the columns that are to be grouped underneath it
     */
	var columnConfiguration = {
        /* Project matching RegEx -> Project configuration */
        'Private Universe #[0-9]+'   : {
            /* Grouped Column Name */
            'Development'   : {
                /* Grouped limit */
                'limit'     : 4,
                /* Swimlanes to be in the group - spelling counts :) */
                'columns'   : ['Waiting', 'In Progress']
            },
            'Testing'       : {
                'limit'     : 2,
                'columns'   : ['Ready for Testing', 'In Testing']
            },
            'Release'       : {
                'limit'     : 6,
                'columns'   : ['Ready for Release', 'Staging']
            }
        }
	};

    /**
     * determines the column index for a particular column
     */
    var columnIndex = function(e) {
        return $(e).parent().children().index($(e));
    };

    /**
     * gathers the swimlane column header based on its name
     */
    var getHeaderByName = function(b,n) {
        return $(b).find('thead > tr:eq(1)').find('th:contains("'+n+'")');
    };

    /**
     * gathers the grouped column header based on its name
     */
    var getGroupedHeaderByName = function(b,n) {
        return $(b).find('thead > tr:first').find('th:contains("'+n+'")');
    };

    /**
     * grabs the swimlane from the specified board based on its statename
     */
    var getSwimlaneByName = function(b,n) {
        return $(b).find('tbody > tr:first').find('td').eq(columnIndex(getHeaderByName(b,n)));
    };

    /**
     * gathers the project name from the div.x-panel-kanban-header > span
     */
    var getProjectName = function(b) {
        return $(b).parents('div.x-panel:last').find('div.x-panel-kanban-header:first').find('span:last').html();
    };

    /**
     * grabs the configuration from the config object above for the particular projet
     */
    var getColumnConfig = function(p) {
        var ret = null;
        $.each(columnConfiguration, function(project, config) {
            if (new RegExp(project).test(p)) {
                ret = config;
                return false;
            }
        });
        return ret;
    };

    /*
     * redraws our board headers and rearranges the columns according to our configuration specified above
     */
	var redrawKanbanBoardHeaders = function() {
        $('table.kanban-swimlanes-table').each(function() {
            /* gather our reusable table <thead> and configuration object */
            var tableHead = $(this).find('thead:first');
            var config = getColumnConfig(getProjectName(this));
            if ((tableHead != null) && (config != null)) {
                /* remove the original "WIP" header */
                $(tableHead).find('th.kanban-swimlane-wip-header').remove();
                /* modify the "planned" state if one exists */
                $(tableHead).find('tr:eq(1)').prepend($(tableHead).find('tr:first > th.kanban-swimlane-header-wrap').attr('rowspan',null).remove());
                var columnOrder = [];
                /* and place our new grouped headers */
                $.each(config, function(column, setup) {
                    var newTR = $('<th></th>');
                    newTR.addClass('kanban-swimlane-wip-header').html(column).attr('colspan', setup.columns.length);
                    if (setup.limit)
                        newTR.html(newTR.html().concat(' (Limit ',setup.limit,')'));
                    $(tableHead).find('tr:first').append(newTR);
                    $.merge(columnOrder, setup.columns);
                });
                columnOrder = columnOrder.reverse();
                /* rearrange our column according to our grouping setup */
                for (var i = 0; i < columnOrder.length; i++) {
                    $(this).find('tbody > tr:first').prepend(getSwimlaneByName(this,columnOrder[i]).remove());
                    $(tableHead).find('tr:eq(1)').prepend(getHeaderByName(this,columnOrder[i]).remove());                
                };
            }
        });
        /* timeout handles some oddities with certain update delays to the DOM */
        setTimeout(function() {
            refreshColumnWIPLimits();        
        }, 500);
	};

    /**
     * refreshes and redraws headers with the grouped WIP limits
     */
    var refreshColumnWIPLimits = function(boards) {
        if (boards==null)
            boards = $('table.kanban-swimlanes-table');
        boards.each(function(i,board) {
            var config = getColumnConfig(getProjectName(this));
            if (config != null)
                /* run through each group and check the limits */
                $.each(config, function(column, setup) {
                    if (setup.limit) {
                    	var count = 0;
                    	for (var i = 0; i < setup.columns.length; i++)
                    	     count += getSwimlaneByName(board, setup.columns[i]).find('.kanban-item').length;
                    	if (count > setup.limit) /* overlimit */
                            getGroupedHeaderByName(board,column).attr('style','color: white!important; background: #E44D4D;');
                    else /* under limit */
                        getGroupedHeaderByName(board,column).css({'background-color':'', 'color':''});
                  }
                });
        });
    };
	
    /**
     * our main rendering - we wait for doc.ready to deal with slow-rendering browsers and clients
     */
    $(document).ready(function() { 
        /* redraw our columns and headers */
        redrawKanbanBoardHeaders();
        $.each(Tp.controls.kanbanboard.KanbanboardManager.getInstance().kanbanBoards, function() {
            /* bind to reload button */            
            $(this)[0].controller.uxKanbanBoardPanel.on('reload', function() {
                redrawKanbanBoardHeaders();
            }); 
            /* and bind to when cards change columns */
            $(this)[0].controller.on('statechanged', function(b, c) {
                refreshColumnWIPLimits($('#'+b.uxKanbanBoardPanel.el.id).find('table.kanban-swimlanes-table'));
            });
        });
    });
});

