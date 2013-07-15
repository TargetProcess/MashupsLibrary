tau.mashups
    .addModule('URLCustomFieldTab.config', function() {
        var urlCustomFieldTabConfig = {
            tabs: [{
                entityTypeName: 'userStory',
                customFieldName: 'Sample URL Custom Field tab for User Story of projects with Scrum process',
                processName: 'Scrum'
            },{
                entityTypeName: 'bug',
                customFieldName: 'Sample URL Custom Field tab for Bug of any project'				
            }]
        };

        return urlCustomFieldTabConfig;
    });