tau.mashups.addDependency('libs/jquery/jquery').addMashup(
function (config) {
    function entityTemplates() {}
        entityTemplates.prototype = {

            /* Update these with your desired template(s).  HTML is supported but be sure to escape properly */
            templates: {
                'UserStory': null,
                'Feature': null,
                'Task': null,
                'Request': null,
                'Bug': null,
                'TestCase': null 
                /* OR
                'TestCase' : {
                    'Steps': 'template',
                    'Success': 'template'
                }
                */
            },

            render: function () {
                /* find what page we're on and proceed accordingly */
                switch (tau.mashups.currentPlaceholder) {
                    case 'Project_Planning_UserStory_Edit':
                        if ((this.templates.UserStory != null) && ($('#ctl00_mainArea_usEdit_UsEdit_DescriptionTextBox_ckeditor').val() == '')){
                            $('#ctl00_mainArea_usEdit_UsEdit_DescriptionTextBox_ckeditor').val(this.templates.UserStory);
                            try {
                                CKEDITOR.instances.ctl00_mainArea_usEdit_UsEdit_DescriptionTextBox_ckeditor.setData(this.templates.UserStory);
                            } catch (e) {} /* suppress warnings in case we beat the editor to the punch */
                        }
                        break;
                    case 'Project_Planning_Feature_Edit':
                        if ((this.templates.Feature != null) && ($('#ctl00_mainArea_featureDetails_FeatureDetails_DescriptionTextBox_ckeditor').val() == '')) {
                            $('#ctl00_mainArea_featureDetails_FeatureDetails_DescriptionTextBox_ckeditor').val(this.templates.Feature);
                            try {
                                CKEDITOR.instances.ctl00_mainArea_featureDetails_FeatureDetails_DescriptionTextBox_ckeditor.setData(this.templates.Feature);
                            } catch (e) {}
                        }
                        break;
                    case 'Project_Planning_Task_Edit':
                        if ((this.templates.Task != null) && ($('#ctl00_mainArea_taskDetails_taskDetails_DescriptionTextBox_ckeditor').val() == '')) {
                            $('#ctl00_mainArea_taskDetails_taskDetails_DescriptionTextBox_ckeditor').val(this.templates.Task);
                            try {
                                CKEDITOR.instances.ctl00_mainArea_taskDetails_taskDetails_DescriptionTextBox_ckeditor.setData(this.templates.Task);
                            } catch (e) {}
                        }
                        break;
                    case 'Project_HelpDesk_Request_Edit':
                        if ((this.templates.Request != null) && ($('#ctl00_mainArea_RequestDetails_RequestDetails_DescriptionTextBox_ckeditor').val() == '')) {
                            $('#ctl00_mainArea_RequestDetails_RequestDetails_DescriptionTextBox_ckeditor').val(this.templates.Request);
                            CKEDITOR.instances.ctl00_mainArea_RequestDetails_RequestDetails_DescriptionTextBox_ckeditor.setData(this.templates.Request);
                        }
                        break;
                    case 'Project_QA_Bug_Edit':
                        if ((this.templates.Bug != null) && ($('#ctl00_mainArea_bugDetails_BugDetails_DescriptionTextBox_ckeditor').val() == '')) {
                            $('#ctl00_mainArea_bugDetails_BugDetails_DescriptionTextBox_ckeditor').val(this.templates.Bug);
                            try {
                                CKEDITOR.instances.ctl00_mainArea_bugDetails_BugDetails_DescriptionTextBox_ckeditor.setData(this.templates.Bug);
                            } catch (e) {}
                        }
                        break;
                    case 'Project_QA_TestCase_Edit':
                        if ((this.templates.TestCase != null) && ($('#ctl00_mainArea_be_TestCaseDetails_Steps_ckeditor').val() == '') && ($('#ctl00_mainArea_be_TestCaseDetails_Success_ckeditor').val() == '')) {
                            $('#ctl00_mainArea_be_TestCaseDetails_Steps_ckeditor').val(this.templates.TestCase.Steps);
                            $('#ctl00_mainArea_be_TestCaseDetails_Success_ckeditor').val(this.templates.TestCase.Success);
                            try {
                                CKEDITOR.instances.ctl00_mainArea_be_TestCaseDetails_Steps_ckeditor.setData(this.templates.TestCase.Steps);
                                CKEDITOR.instances.ctl00_mainArea_be_TestCaseDetails_Success_ckeditor.setData(this.templates.TestCase.Success);
                            } catch (e) {}
                        }
                        this.getTemplateAndPlace('TestCaseSteps','ctl00_mainArea_be_TestCaseDetails_Steps_ckeditor');
                        this.getTemplateAndPlace('TestCaseSuccess','ctl00_mainArea_be_TestCaseDetails_Success_ckeditor');
                        break;
                }
            }
        }
        /* make it happen! */
        $(document).ready(function() {
            new entityTemplates().render();
        });
    }
)
