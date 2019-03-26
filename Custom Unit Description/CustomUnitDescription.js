tau.mashups
    .addDependency('jQuery')
    .addDependency('Underscore')
    .addDependency('tau/configurator')
    .addDependency('tau/models/board.customize.units/const.entity.types.names')
    .addDependency('tau/models/board.customize.units/const.card.sizes')
    .addMashup(function($, _, globalConfigurator, types, sizes, helper) {
        var div;
        function extractPlainTextFromRichText(richText) {
            div = div || document.createElement('div');
            div.innerHTML = richText;
            return div.textContent || div.innerText || '';
        }
        
        function getPlainDescription(description, maxLength) {
            return _.truncate(extractPlainTextFromRichText(description), maxLength).replace(/\u00a0/g, ' ');
        }

        var units = [
            {
                id: 'custom_rich_text',
                classId: 'tau-board-unit_type_custom-rich-text',
                name: 'Description',
                types: [ types.PROJECT, types.FEATURE, types.EPIC, types.STORY, types.TASK, types.BUG, types.REQUEST, types.IMPEDIMENT ],
                sections: 1,
                sizes: [ sizes.M, sizes.L, sizes.XL ],
                template: {
                    customFunctions: {
                        getPlainDescription: getPlainDescription
                    },
                    markup:[
                  '<% if(this.data.description) { %>',
                    '<div class="tau-board-unit__value" style="white-space:normal">',
                        '<%= fn.getPlainDescription(this.data.description, 150) %>',
                    '</div>',
                  '<% } %>'
                ]},
                model: 'description:Description',
                sampleData: { description: '<div>Entity description</div>' }
           },
           {
                id: 'custom_rich_text_list',
                classId: 'tau-board-unit_type_custom-rich-text',
                name: 'Description',
                types: [ types.PROJECT, types.FEATURE, types.EPIC, types.STORY, types.TASK, types.BUG, types.REQUEST, types.IMPEDIMENT ],
                sections: 1,
                sizes: [ sizes.LIST ],
                template: {
                    customFunctions: {
                        getPlainDescription: getPlainDescription
                    },
                    markup:[
                  '<% if(this.data.description) { %>',
                    '<div class="tau-board-unit__value">',
                        '<%= fn.getPlainDescription(this.data.description, 1000) %>',
                    '</div>',
                  '<% } %>'
                ]},
                model: 'description:Description',
                sampleData: { description: '<div>Entity description</div>' }
           }
        ];

        function addUnits(configurator) {
            var registry = configurator.getUnitsRegistry();
            _.extend(registry.units, registry.register(units));
        }


        var appConfigurator;
        globalConfigurator.getGlobalBus().on('configurator.ready', function(e, configurator) {

            if (!appConfigurator && configurator._id && configurator._id.match(/board/)) {

                appConfigurator = configurator;
                addUnits(appConfigurator);

            }

        });


 });
