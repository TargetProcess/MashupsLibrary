tau.mashups
	.addDependency("libs/jquery/jquery")
	.addMashup(function() {

    /* an object of tags : colors
     * this determines the colors of your tags */
	var tagColors = {
		'redball':'#ff0000',
	 	'blocked':'#ff00ff'
	};

    /* an object of custom fields : possible values
     *   possible values is another object of value : color mappings
     * this determines the colors based on custom field values */
    var customFieldMappings = {
        'Story Type' : {
            'Blue':'#0000ff',
            'Green':'#00ff00',
            'Gray':'#c0c0c0'
        }
    };

    /* a stepping value to determine the proper priority-based shading */
    var priorityShadeStepping = 40;

    /************************************************************************
     * no need to go past here -- abandon hope all ye' who enter 
     ************************************************************************/

    /** first, some awesome color functions **/
    /***
     * shade(color, stepping)
     *  returns a string representation of a color shaded with the specified
     *  color stepping value
     */
    var shade = function(c, s) {
        var colorInt = parseInt(c.match(/^#?([0-9a-f]{6})$/i)[1],16);
        var R = ((colorInt & 0xFF0000) >> 16) + Math.floor((s/255)*((colorInt & 0xFF0000) >> 16));
        var G = ((colorInt & 0x00FF00) >> 8) + Math.floor((s/255)*((colorInt & 0x00FF00) >> 8));
        var B = ((colorInt & 0x0000FF) >> 0) + Math.floor((s/255)*((colorInt & 0x0000FF) >> 0));
        return "#"+("000000"+((R<<16) | (G<<8) | (B)).toString(16)).substr(-6);
    }

    /***
     * safeColor(color, threshold, swatch)
     *  returns a "safe" off color based on the luminosity of the specified color
     *  when compared to the threshold value - if the luminosity is below the threshold
     *  the first color in the swatch is returned, if greater then the second is returned
     */
    var safeColor = function(c,t,s) {
        if (s == null) s = ['#ffffff','#333333'];
        if (t == null) t = 128;
        var colorInt = parseInt(c.match(/^#?([0-9a-f]{6})$/)[1],16);
        var R = (colorInt & 0xFF0000) >> 16;
        var G = (colorInt & 0x00FF00) >> 8;
        var B = (colorInt & 0x000000) >> 0;
        if ((.299*R + .587*G + .114*B) < t)
            return s[0];
        else
            return s[1];
    }

    /** and the real magic **/

    var colorTheCard = function(i,c) {
        pri = i.attr('class').match(/kanban-item-priority-(\d+)/)[1];
        i.css({"-moz-user-select":"none",'background-color':i.css('background-color')});
        /* we have to remove the kanban-item-priority class to get rid of the background-color
         * so that it can be overridden - the style is copied by the line above so we don't see
         * snapping
         */
        i[0].className = i[0].className.replace(/\bkanban-item-priority-\d+\b/g,'');
        var newColor = shade(c,(-1*priorityShadeStepping*pri));
        /* and some pretty animations */
        i.animate({'background-color':newColor},1000);
        i.find('div.name:first').animate({'color':safeColor(newColor)},1000);
        i.find('a.kanban-item-id:first').animate({'color':safeColor(newColor,60,['#94a1c5','#28428B'])},1000);
    }

	var colorItems = function() {
        jQuery.fx.off = false; /* just in case :) */
		$("div.kanban-item").each(function(){
			var item = $(this);
            /* We need to check and see what kind of Assignable we are so that we make the correct
             * AJAX call to gather the custom field information */
            var itemId = item.find('.kanban-item-id').first().html();
            var restCall = null;
            /* determine what kind of entity we're querying the REST API on */
            if (item.id().match(/kanban-item-userstory-\d+/)) {
                restCall = 'UserStories';
            } else if (item.id().match(/kanban-item-bug-\d+/)) {
                restCall = 'Bugs';
            } else if (item.id().match(/kanban-item-feature-\d+/)) {
                restCall = 'Features';
            } else if (item.id().match(/kanban-item-task-\d+/)) {
                restCall = 'Tasks';
            }
            /* Obviously we can't do anything if we don't know what API call to make */
            if (restCall == null) return;            
            /* AJAX call to the REST API to gather the due date custom field information */
            $.ajax({
                type: 'GET',
                url: appHostAndPath+'/api/v1/'+restCall+'/'+itemId+'?include=[CustomFields,Tags]&format=json',
                context: $(this)[0],
                contentType: 'application/json',
                dataType: 'json',
                success: function(resp) {
                    /* scan through all of our custom fields to find the one called 'Story Type',
                     * and then use the value of that field to determine color */
                    $.each(customFieldMappings, function(f,v) {
                        for (var i = 0; i < resp.CustomFields.length; ++i) {
                            if (resp.CustomFields[i].Name == f) {
                                if (v[resp.CustomFields[i].Value] != null) {
                                    colorTheCard(item,v[resp.CustomFields[i].Value]);
                                    return;
                                }
                            }
                        }
                    });
                    $.each(tagColors, function(t,color) {
                        if (resp.Tags.indexOf(t) != -1) {
                            colorTheCard(item,color);
                            return;
                        }
                    });
                }
            });
	 	});
	};
   
    $(document).ready(function() {
        /* timeouts are lame, but no event is fired when the board finishes rendering the div.kanban-item collection */
        setTimeout(function() {
            colorItems();
        }, 2000);
        $.each(Tp.controls.kanbanboard.KanbanboardManager.getInstance().kanbanBoards, function() {
            /* bind to reload button */            
            $(this)[0].controller.uxKanbanBoardPanel.on('reload', function() {
                setTimeout(function() {
                    colorItems();
                }, 2000);
            }); 
            /* and bind to when cards change columns */
            $(this)[0].controller.on('statechanged', function(b, c) {
                colorItems();
            });
        }); 
    });
});

