tau.mashups.addDependency('libs/jquery/jquery').addMashup(
    function (config) {
        function kanbanBoardImpendingDoom() {}
        kanbanBoardImpendingDoom.prototype = {
            render: function () {

                var addDoomInformation = function(el) {
                    /* some basic locking so we don't do this twice for each element */
                    if (el.hasClass('mashup-doom-added'))
                        return;
                    el.addClass('mashup-doom-added');

                    /* we need to preserve the kanban-item-priority-\d colors, but can't have the class active.
                     * so we need to copy the background-color to a local css attribute and then remove the class
                     * so that the user doesn't see color snapping or any other UI oddities */
                    el.css('background-color',el.css('background-color'));
                    el[0].className = el[0].className.replace(/\bkanban-item-priority-\d/g,'');

                    /* We need to check and see what kind of Assignable we are so that we make the correct
                     * AJAX call to gather the custom field information */
                    var m = el.id().match(/kanban-item-(\w+)-(\d+)/);
                    if (m == null)
                        return;

                    var itemId = m[2];
                    var itemType = (m[1] == 'userstory') ? 'UserStories' : m[1].replace( /(^|\s)([a-z])/g , function(m,p1,p2){ return p1+p2.toUpperCase(); } )+'s';
                    
                    /* utility function to handle the pulsing */
                    var pulseRed = function(el) {
                        el.animate({'background-color': '#ff9999'}, 800, null, function() {
                            el.animate({'background-color': '#ff0000'}, 1600, null, function() {
                                pulseRed(el);
                            });
                        });
                    };

                    /* AJAX call to the REST API to gather the due date custom field information */
                    $.ajax({
                        type: 'GET',
                        url: appHostAndPath+'/api/v1/'+itemType+'/'+itemId+'?include=[CustomFields]&format=json',
                        context: $(this)[0],
                        contentType: 'application/json',
                        dataType: 'json',
                        success: function(resp) {
                            /* scan through all of our custom fields to find the one called 'Due Date',
                             * and then use the value of that field to show our doom */
                            var date = null;
                            for (var i = 0; i < resp.CustomFields.length; ++i) {
                                if (resp.CustomFields[i].Name == 'Due Date') {
                                    date = resp.CustomFields[i].Value;
                                    break;
                                }
                            }
                            if (date == null) {
                                /* uncomment this next line if you want to colorize cards with no due date */
                                //el.animate({'background-color': '#8DCC29'}, 2000);
                                return;
                            }
                            date = new Date(Number(date.match(/\((\d+)[-\+]/)[1]));
                            el.children('.kanban-item-title').append('<div style="float: right; padding-right: 6px;">DUE '+date.format('\m/\d/\y')+'</div>');                            
                            /* calculate the time difference */
                            var diff = date.getTime() - (new Date()).getTime();
                            /* if the difference is less than zero, we were due in the past,
                             * so we make it pulse red to gather the users' attention */
                            if (diff < 0) {
                                pulseRed(el);
                            } else {
                                /* Convert ms to days
                                 * 86400000 = 1000ms/sec * 60sec/min * 60min/hr * 24hr/day */
                                var daysToGo = (diff / 86400000);
                                if (daysToGo > 2) {
                                    /* We're not due for at least 2 days */
                                    el.animate({'background-color': '#00FF00'}, 2000);
                                } else if (daysToGo > 1) {
                                    /* We're due tomorrow */
                                    el.animate({'background-color': '#ffff00'}, 2000);
                                } else {
                                    /* We're due today */
                                    el.animate({'background-color': '#FF0000'}, 2000);
                                }
                            }
                        }
                    });
                };

                /* and our main function that handles doing the doom information for each card ~
                 * we have to put this in a timeout because of the delay from the Kanban board receiving information and
                 * actually drawing the cards...we animate all the colors, though, so there are no snapping issues */
                var beginImpendingDoom = function() {
                    setTimeout(function() {
                        $('.kanban-item').each(function() {
                            addDoomInformation($(this));

                            /* since drag-n-drop removes our added info, we need to check to see if we need to redraw
                             * our extra information and proceed accordingly */
                            $(this).mouseup(function() {
                                addDoomInformation($(this));
                            });
                        });
                    },2000);
                };

                /* and hook into the data load event */
                Sys.WebForms.PageRequestManager.getInstance().add_pageLoaded(beginImpendingDoom);                
                beginImpendingDoom();
            },
        }
        /* make it happen! */
        new kanbanBoardImpendingDoom().render();
    }
)

