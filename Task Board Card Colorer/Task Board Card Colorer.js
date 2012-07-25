tau.mashups.addDependency('libs/jquery/jquery').addMashup(function ($, config) {  
	
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
	
	/* and that ends our configuration
	 * DO NOT CHANGE ANYTHING BENEATH THIS LINE! */
	
    /***
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
	
	/***
	 * utility function that actually "colors" the card and picks a safe foreground color
	 */
	var colorTheCard = function(i,c) {
		i.find('div.taskHead').animate({'background-color':c, 'color':safeColor(c)},1000);
    }
	
	/***
	 * and the real magic...
	 */
	function highlightTaskBoardCards() {
		$('table.taskBoardTable').find('div.taskBox').each(function() {
			var card = $(this);
			$.ajax({
                type: 'GET',
                url: appHostAndPath+'/api/v1/Assignables/'+card.find('a.tau-entity-id').html()+'?include=[CustomFields,Tags]&format=json',
                context: card[0],
                contentType: 'application/json',
                dataType: 'json',
                success: function(resp) {
                    /* scan through all of our custom fields to find the one called 'Story Type',
                     * and then use the value of that field to determine color */
                    $.each(customFieldMappings, function(f,v) {
                        for (var i = 0; i < resp.CustomFields.length; ++i) {
                            if (resp.CustomFields[i].Name == f) {
                                if (v[resp.CustomFields[i].Value] != null) {
                                    colorTheCard(card,v[resp.CustomFields[i].Value]);
                                    return;
                                }
                            }
                        }
                    });
                    $.each(tagColors, function(t,color) {
                        if (resp.Tags.indexOf(t) != -1) {
                            colorTheCard(card,color);
							return;
                        }
                    });
                }
            }); // </ajax
		}); // </each(div.taskBox)
	}

	$(document).ready(function() {	
		/* hook into the page request manager */
		Sys.WebForms.PageRequestManager.getInstance().add_pageLoaded(highlightTaskBoardCards);
		
		/* and do it now */
		highlightTaskBoardCards();     

	}); // </document.ready
}); // </addMashup