tau.mashups
    .addDependency('Underscore')
    .addDependency('tau/configurator')
    .addMashup(function(_, configurator) {

        'use strict';

        var templates = {
            'UserStory': 'As a <i>type of user</i>, I want <i>some goal</i> so that <i>some reason</i>',
            'Feature': '<table border="1"><caption>Features and Benefits matrix</caption>' +
                '<thead><tr><th scope="col">Features</th><th scope="col">Benefits</th></tr></thead>' +
                '<tbody><tr>' +
                '<td><em>A short phrase, giving a name and some implied context to the feature</em></td>' +
                '<td><em>A short description which describes the benefit to the user and the business. There may be multiple benefits per feature which are highlighted here</em></td>' +
                '</tr>' +
                '<tr><td><em>...</em></td><td><em>...</em></td></tr>' +
                '<tr><td>...</td><td>...</td></tr>' +
                '</tbody></table>',
            'Task': null,
            'Request': null,
            'Bug': '', //put an HTML-formatted template into quotes
            'TestCase': ''
        };

        var reg = configurator.getBusRegistry();

        function addBusListeners(busName, events) {
            var scope = {};

            reg.on('create', function(e, data) {
                var bus = data.bus;
                if (bus.name === busName) {
                    _.each(events, function(listener, eventName) {
                        bus.once(eventName, listener, scope);
                    });
                }
            });

            reg.on('destroy', function(e, data) {
                var bus = data.bus;
                if (bus.name === busName) {
                    bus.removeAllListeners(scope);
                }
            });
        }

        function findTemplate(entityTypeName) {
            return _.find(templates, function(v, k) {
                return k.toLowerCase() === entityTypeName;
            });
        }

        function getTemplate(context) {
            var entityTypeName = context.entity.entityType.name.toLowerCase();
            var term = _.find(context.getTerms(), function(v) {
                return (v.wordKey || v.name).toLowerCase().replace(' ', '') === entityTypeName;
            });
            var template = term ? findTemplate(term.value.toLowerCase()) : null;
            return template || findTemplate(entityTypeName);
        }

        addBusListeners('description', {
            'afterRender': function(e, renderData) {
                var value = renderData.data.value;
                if (value) {
                    return;
                }

                var template = getTemplate(renderData.view.config.context);
                if (!template) {
                    return;
                }

                var $description = renderData.element.find('.ui-description__inner');
                if ($description.length) {
                    $description.attr('data-placeholder', '');
                    $description.append('<div>' + template + '</div>');
                }
            },

            'afterRender:last + $editor.ready': function(e, renderData, $editor) {
                var value = renderData.data.rawDescription;
                if (value) {
                    return;
                }

                var template = getTemplate(renderData.view.config.context);
                if (!template) {
                    return;
                }

                if ($editor.richeditorMarkdown('instance')) {
                    $editor.richeditorMarkdown('setText', template);
                }
            }
        });
    });
