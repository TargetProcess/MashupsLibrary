tau.mashups.addDependency('libs/jquery/jquery').addMashup(
function (config) {
    function extraTimeSheetInfo() {}
        extraTimeSheetInfo.prototype = {
            render: function () {
                $('div#ctl00_mainArea_pnlUpd > table:first').find('tr.dataRow').each(function() {
                    /* gather IDs */
                    var id = $(this).find('td:eq(2) > a:first').attr('href').match(/View\.aspx\?[A-Za-z]+ID=(\d+)/)[1];
                    $(this).find('td:eq(2)').prepend('<div style="font-size: smaller; float: left; margin-right: 6px;">#'+id+'</div>');
                });
            },
        }
        /* make it happen! */
        $(document).ready(function() {
            new extraTimeSheetInfo().render();
        });
    }
)

