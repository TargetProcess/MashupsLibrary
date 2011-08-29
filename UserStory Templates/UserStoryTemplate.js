tau.mashups.add(
function (config) {
    function userStoryTemplate() {}
        userStoryTemplate.prototype = {
            render: function () {
                /* assume if we have a name, then we're actually editing - not adding -
                 * so we shouldn't need to grab our template */
                if ($('#ctl00_mainArea_usEdit_UsEdit_txtName').val().length == 0) {
                    Ext.Ajax.request({
                        url: appHostAndPath+'/JavaScript/Mashups/UserStory%20Templates/template.html',
                        success: function(data,req) {
                            /* and populate our description box with our template */
                            $('#ctl00_mainArea_usEdit_UsEdit_DescriptionTextBox_ckeditor').val(data.responseText);
                            /* just in case the WYSIWYG has spawned already */
                            try {
                                CKEDITOR.instances.ctl00_mainArea_usEdit_UsEdit_DescriptionTextBox_ckeditor.setData(data.responseText);
                            } catch (e) {} /* silence errors if we beat the editor to it */
                        }
                    });
                }
            },
        }
        /* make it happen! */
        new userStoryTemplate().render();
    }
)
