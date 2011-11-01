tau.mashups.addDependency('libs/jquery/jquery').addMashup(
function (config) {
    function entityTemplates() {}
        entityTemplates.prototype = {
            render: function () {
                /* find what page we're on and proceed accordingly */
                switch (tau.mashups.currentPlaceholder) {
                    case 'Project_Planning_UserStory_Edit':
                        this.getTemplateAndPlace('UserStory','ctl00_mainArea_usEdit_UsEdit_DescriptionTextBox_ckeditor');
                        break;
                    case 'Project_Planning_Feature_Edit':
                        this.getTemplateAndPlace('Feature','ctl00_mainArea_featureDetails_FeatureDetails_DescriptionTextBox_ckeditor');
                        break;
                    case 'Project_Planning_Task_Edit':
                        this.getTemplateAndPlace('Task','ctl00_mainArea_taskDetails_taskDetails_DescriptionTextBox_ckeditor');
                        break;
                    case 'Project_HelpDesk_Request_Edit':
                        this.getTemplateAndPlace('Request','ctl00_mainArea_RequestDetails_RequestDetails_DescriptionTextBox_ckeditor');
                        break;
                    case 'Project_QA_Bug_Edit':
                        this.getTemplateAndPlace('Bug','ctl00_mainArea_bugDetails_BugDetails_DescriptionTextBox_ckeditor');
                        break;
                    case 'Project_QA_TestCase_Edit':
                        this.getTemplateAndPlace('TestCaseSteps','ctl00_mainArea_be_TestCaseDetails_Steps_ckeditor');
                        this.getTemplateAndPlace('TestCaseSuccess','ctl00_mainArea_be_TestCaseDetails_Success_ckeditor');
                        break;
                }
            },
            getTemplateAndPlace: function(entity, target) {
                /* assume if we have contents already then we're actually editing, not adding and do nothing */
                if ($('#'+target).val().length != 0)
                    return;
                $.ajax({
                    url: appHostAndPath+'/JavaScript/Mashups/Entity%20Templates/'+entity+'.html',
                    success: function(data,req) {
                        $('#'+target).val(data);
                        /* just in case we missed the WYSIWYG editor */
                        try {
                            eval('CKEDITOR.instances.'+target+'.setData(data);');
                        } catch (e) {} /* silance errors if we beat the editor to the punch */
                    }
                });
            }
        }
        /* make it happen! */
        $(document).ready(function() {
            new entityTemplates().render();
        });
    }
)
