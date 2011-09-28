tau.mashups.addDependency('libs/jquery/jquery').addMashup(
function (config) {
    function numericRankDisplay() {}
        numericRankDisplay.prototype = {
            render: function () {
                /* we need this twice - once for now and once to hook into pageLoaded, so we declare
                 * it out as a separate function right here */
                var convertBars = function(a,b) {
                    $('.rankBar').each(function() {
                        if ($(this).attr('title').toString().match(/Rank (\d+)$/g) != null) {
                            $(this).parent().html($(this).attr('title').toString().replace(/Rank\s?/i,''));
                        }
                    });
                }

                /* call the update now */
                convertBars(null,null);

                /* and hook in to the page updated */
                Sys.WebForms.PageRequestManager.getInstance().add_pageLoaded(convertBars);
            },
        }
        /* make it happen! */
        new numericRankDisplay().render();
    }
)
