tau.mashups
    .addDependency('Underscore')
    .addDependency('tp3/mashups/topmenu')
    .addDependency('tp3/mashups/tooltip')
    .addDependency('tp3/mashups/viewcomponent')
    .addDependency('tp3/mashups/componenteventlistener')
    .addDependency('Tp2Pages.config')
    .addDependency('tau/ui/templates/board.main.menu/ui.template.board.main.menu.section')
    .addCSS('Tp2Pages.css')
    .addMashup(function(_, topmenu, Tooltip, ViewComponent, ComponentEventListener, settings, menuSectionTemplate) {
        new ComponentEventListener('board.main.menu').on('afterRenderAll', function(event, afterRenderData) {
            // Get the mash-up configuration
            var uris = settings.uris;
            var appPath = afterRenderData.data.context.configurator.getApplicationPath();

            function createMenuItemCallback(uri) {
                return function () {
                    var paramJoin =  uri.indexOf('?') == -1 ? '?' : '&';
                    $(this).tauIFramePopup({ url: [appPath, uri.replace(/^\s+|\s+$/g,''), paramJoin, 'rmnav=1&tp3=1&notp3redirect=1'].join('') });
                    $(this).tauIFramePopup('show');
                }
            }

            // Create and fill up the new menu
            topmenu._$topMenuContainer.prepend(menuSectionTemplate.get().bind());
            var menuItem = topmenu.addItem('TP2');
            _.each(_.keys(uris), function (element) {
                menuItem.addItem(element).onClick(createMenuItemCallback(uris[element]));
            });

            // Create tooltip
            var $tooltipTarget = menuItem.$element.children('.tau-popup-link');
            new Tooltip(new ViewComponent($tooltipTarget, new ComponentEventListener('TP2 Menu')), {
                $target: $tooltipTarget,
                getContentPromise: function() {
                    var contentDeferred = $.Deferred();
                    contentDeferred.resolve($('<div><span>Access TP2 pages</span></div>'));
                    return contentDeferred.promise();
                }
            });
        });
    });
