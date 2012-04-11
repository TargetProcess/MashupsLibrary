tau.mashups
	.addDependency("libs/jquery/jquery")
	.addMashup(function(config) {

        /* the number of days a card is allowed to "rot" before we throw feedback */
        var rottingDaysAllowed = 5;

        /* the number of days a card is allowed to "rot" before we make a huge stink */
        var rottingDaysMaximumAllowed = 14;

/************************************************************************
 * no need to go past here -- abandon hope all ye' who enter 
 ************************************************************************/        

        function KanbanRottingCards() {};
        KanbanRottingCards.prototype = {
            apiCall: appHostAndPath+"/api/v1/Generals/{0}?include=[StartDate]&format=json",

            /* utility for pulsing cards */
            pulse: function(el) {
                el.animate({'background-color': '#ff9999'}, 800, null, function() {
                    el.animate({'background-color': '#ff0000'}, 1600, null, function() {
                        KanbanRotter.pulse(el);
                    });
                });                
            },

            /* utility for getting a shaded color based on a starting color */
            shade: function(c, t, s) {
                var c1 = parseInt(c.match(/^#?([0-9a-f]{6})$/)[1],16);
                var c2 = parseInt(t.match(/^#?([0-9a-f]{6})$/)[1],16);
                var R = Math.round((((c1 & 0xFF0000) >> 16) * (1 - s)) + (((c2 & 0xFF0000) >> 16) * s));
                var G = Math.round((((c1 & 0x00FF00) >> 8) * (1 - s)) + (((c2 & 0x00FF00) >> 8) * s));
                var B = Math.round((((c1 & 0x0000FF) >> 0) * (1 - s)) + (((c2 & 0x0000FF) >> 0) * s));
                return "#"+("000000"+((R<<16) | (G<<8) | (B)).toString(16)).substr(-6);
            },

            /* returns a "safe" off color based on the luminosity of the specified color */
            safeColor: function(c,t,s) {
                var colorInt = parseInt(c.match(/^#?([0-9a-f]{6})$/)[1],16);
                var R = (colorInt & 0xFF0000) >> 16;
                var G = (colorInt & 0x00FF00) >> 8;
                var B = (colorInt & 0x000000) >> 0;
                if ((.299*R + .587*G + .114*B) < 128)
                    return '#d6d6d6';
                else
                    return '#333333';
            },

            /* utility functions for rgb->hex */
            rgb2hex: function(rgb) {
                rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
                return "#" + this.hex(rgb[1]) + this.hex(rgb[2]) + this.hex(rgb[3]);
            },

            hex: function(x) {
                var hexDigits = new Array
                    ("0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f");                      
                return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
            },

            /* render a single card */
            rotCard: function(c) {
                c.addClass('rotting');
                var itemId = c.id().match(/kanban-item-(\w+)-(\d+)/);
                if (itemId == null)
                    return;
                itemId = itemId[2];
                /* make the REST call */
                $.ajax({
                    type: 'GET',
                    url: KanbanRotter.apiCall.f(itemId),
                    contentType: 'applicaton/json',
                    dataType: 'json',
                    success: function(resp) {
                        try {
                            var startDate = new Date(Number(resp.StartDate.match(/Date\((\d+)[-\+](\d+)\)/)[1]));
                        } catch (e) { return; }
                        var timeInProgress = new Date().getTime() - startDate.getTime();
                        /* Convert ms to days
                         * 86400000 = 1000ms/sec * 60sec/min * 60min/hr * 24hr/day */                        
                        var daysInProgress = timeInProgress / 86400000;
                        /* and determine what we're doing */
                        if (daysInProgress > rottingDaysMaximumAllowed) {
                            /* pulsate the card since we're way over upper limit */
                            KanbanRotter.pulse(c);
                        } else if (daysInProgress > rottingDaysAllowed) {
                            /* copy the current color and remove the priority class name so we can overwrite the color */
                            c.css('background-color',c.css('background-color'));
                            c[0].className = c[0].className.replace(/\bkanban-item-priority-\d/g,'');                            
                            /* rot the card according to our days in progress */                        
                            var shadeCoeff = (1 / (rottingDaysMaximumAllowed - rottingDaysAllowed)) * (daysInProgress - rottingDaysAllowed);
                            var color = KanbanRotter.shade(KanbanRotter.rgb2hex(c.css('background-color')),'#663333',shadeCoeff);
                            /* and make it happen */
                            c.animate({'background-color': color},2000).find('.name').animate({'color': KanbanRotter.safeColor(color)},1000);
                        }
                    }
                });
            },

            /* the magic */
            render: function() {
                $('div.kanban-item').not('.rotting').each(function() {
                    KanbanRotter.rotCard($(this));
                });
            },

            init: function() {
                if ((rottingDaysMaximumAllowed == null) || (rottingDaysAllowed == null)) {
                    throw "The Kanban Card Rotter mashup is configured incorrectly - both rottingDaysMaximumAllowed and rottingDaysAllowed variables are required.";
                }
                if (rottingDaysMaximumAllowed <= rottingDaysAllowed) {
                    throw 'The Kanban Card Rotter mashup is configured incorrectly - rottingDaysMaximumAllowed MUST be greater than rottingDaysAllowed';
                }
                setTimeout(function() {
                    KanbanRotter.render();
                },2000);
                $.each(Tp.controls.kanbanboard.KanbanboardManager.getInstance().kanbanBoards, function() {
                    /* bind to reload button */            
                    $(this)[0].controller.uxKanbanBoardPanel.on('reload', function() {
                        /* this pause is necessary from issue #13 */
                        setTimeout(function() {
                            KanbanRotter.render();
                        },2000);
                    }); 
                    /* and bind to when cards change columns */
                    $(this)[0].controller.on('statechanged', function(b, c) {
                        setTimeout(function() {
                            KanbanRotter.render();
                        },2000);
                    });
                });
            }
        }

        /* make it happen */
        $(document).ready(function() { 
            KanbanRotter = new KanbanRottingCards(); 
            KanbanRotter.init();
        });
    }
);

var KanbanRotter;
String.prototype.f = function() {
    var s = this, i = arguments.length;
    while (i--)
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    return s;
};
