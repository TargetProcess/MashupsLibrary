tau.mashups
    .addDependency('jQuery')
    .addDependency('Underscore')
    .addDependency('tau/configurator')
    .addDependency('tau/models/board.customize.units/const.entity.types.names')
    .addDependency('tau/models/board.customize.units/const.card.sizes')
    .addDependency('tau/models/board.customize.units/board.customize.units.base')
    .addMashup(function($, _, globalConfigurator, types, sizes, helper) {

        var units = [
            {
               id: 'ownername_template',
                classId: 'tau-board-unit_type_ownername-template',
				name: 'Owner name',
                types: [types.PROJECT, types.FEATURE, types.EPIC, types.STORY, types.TASK, types.BUG, types.REQUEST, types.TEST_PLAN_RUN],
                sizes: [sizes.M, sizes.L, sizes.XL, sizes.LIST],
               template: [
                 '<div class="tau-board-unit__value"><%! this.data.owner.fullName %></div>'
               ],
               model: 'owner:{owner.fullName}',
               sampleData: { owner:{fullName:'John Hitz'} }

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
