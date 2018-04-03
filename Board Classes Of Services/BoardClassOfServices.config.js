tau.mashups
    .addModule('BoardClassOfServices.config', function() {

        'use strict';

        return {
            // type of background; if 'single', first match rule color will be applied as background,
            // if 'gradient', all colors from all found rules will be applied as gradient background */
            colorType: 'gradient', // gradient | single

            // set matching from types to values of field to background color
            // use string representation of non-string values, i.e. 'true' instead of true
            // use match function to special check of field
            colors: {
                Assignable: {
                    tags: {
                        'regression': '#ffe1b3',
                        'performance': '#e2eece'
                    },

                    entityState: {
                        name: {
                            'done': '#dae0e8',
                            'closed': '#dae0e8',
                            'in progress': '#fdfadb'
                        },
                        isFinal: {
                            'true': '#ff5400'
                        }
                    },

                    priority: {
                        name: {
                            'urgent': '#dae0e8',
                            'when have time': '#a1d9d6'
                        }
                    },

                    // leave empty config to have access in `match` function
                    project: {
                        process: {
                            name: {}
                        }
                    },

                    customFields: [{
                        match: function(customField) {
                            return customField.name === 'document' && customField.type.toLowerCase() === 'checkbox';
                        },
                        value: {
                            'true': '#e2e2e2'
                        }
                    }, {
                        match: function(customField) {
                            return customField.name === 'hasTests';
                        },
                        value: {
                            'no': '#ff0000'
                        }
                    }, {
                        match: function(customField, data) {
                            return data.project && data.project.process && data.project.process.name === 'Scrum' &&
                                customField.name === 'areYouSure';
                        },
                        value: {
                            'sure': '#ff0000'
                        }
                    }]
                },

                Bug: {
                    severity: {
                        name: {
                            'Critical': '#ff5400'
                        }
                    }
                }
            }
        };
    });
