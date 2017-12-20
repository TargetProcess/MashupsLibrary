tau
    .mashups
    .addDependency('jQuery')
    .addDependency('tau/configurator')
    .addMashup(function($, configurator) {

        'use strict';

        var zoomTimer = null;

        var reg = configurator.getBusRegistry();

        var addBusListener = function(busName, eventName, listener) {

            reg.on('create', function(e, data) {

                var bus = data.bus;
                if (bus.name === busName) {
                    bus.on(eventName, listener);

                }
             });

            reg.on('destroy', function(e, data) {

                var bus = data.bus;
                if (bus.name === busName) {
                    bus.removeListener(eventName, listener);
                }

                if ( zoomTimer !== null ) {
                    clearTimeout( zoomTimer );
                }

            });

            reg.getByName(busName).done(function(bus) {
                bus.on(eventName, listener);
            });
        };

        var appendZoomButtons = function appendFullscreenButton(e, renderData) {
            var $el = renderData.element;

            if (!$el.find('.btnZoom').length) {
                var $elWrapper = $el.find('.tau-board-header__control--actions');
                var $elAnchor = $elWrapper.length ? $elWrapper: $el.find('[role=actions-button]').parent();

                var $elGroup = $('<div id="zoom-buttons" class="tau-board-header__control--mashup" style="display:flex;margin-left:10px;align-items:center;"></div>');

                $.each({
                    Min: 1,
                    XS:  2,
                    S:   3,
                    M:   4,
                    L:   5,
                    XL:  6
                }, function( name, zoom ) {
                    $elGroup.append( $(
                        '<button class="tau-btn tau-btn--icon btnZoom" id="btnZoom'+ zoom +'" data-zoom="'+ zoom +'" ><span class="tau-btn__icon">'+ name +'</span></button>'
                    ) );
                });

                $elAnchor.before( $elGroup  );
            }

            // initially we have to open the menu and wait until the slider is loaded in dom, or reading slider does not work
            // try x times and then give up, maybe its dashboard and we dont want to poll

            // initialize when buttons are rendered, which is also boardchange
            waitForSlider(10); // try 10 times and then give up, might be dashboard

        };

        var toolbarComponents = [
            'board.toolbar'
        ];

        toolbarComponents.forEach(function(componentName) {
            addBusListener(componentName, 'afterRender', appendZoomButtons);
        });

        $(document).on('click','.btnZoom', function(){
            var zoom = $(this).attr('data-zoom');

            var was_open = false;
            if ( isActionMenuOpen() ) {
                was_open = true;
            }

            if ( !was_open ) openActionMenu();

            // console.log( "was open btnZoom: ", was_open );

            $('.ui-slider--zoomer').slider('value', zoom);                     // set zoom

            // update highlight
            setZoomHighlight( zoom );

            if ( !was_open ) closeActionMenu();

        });

        var checkZoomButton = function(){

            var was_open = false;
            if ( isActionMenuOpen() ) {
                was_open = true;
            }

            // console.log( "checked: ", was_open );

            if ( !was_open ) openActionMenu();

            if ( $('.ui-slider--zoomer').length ) {
                var zoom = $('.ui-slider--zoomer').slider('value');                     // read zoom from slider
                setZoomHighlight( zoom );
            }
            if ( !was_open ) closeActionMenu();

            // try again when menu is open
            if ( was_open ) {
                zoomTimer = setTimeout(checkZoomButton, 1000);  // try again, slider was not ready
            }
        };

        var waitForSlider = function( tries ) {

            openActionMenu();

            // console.log( 'wait before');

            if ( $('button.tau-btn.tau-btn--view-switch.i-role-board-tooltip.tau-btn-list-view.tau-checked').length ) {
                // list view, just close and skip
                // hide buttons ?
                $('#zoom-buttons').hide();
                closeActionMenu();
                return false;
            }



            if ( $('.ui-slider--zoomer').length ) {
                // console.log( 'wait inner');

                var zoom = $('.ui-slider--zoomer').slider('value');                     // read zoom from slider
                setZoomHighlight( zoom );


                closeActionMenu();

                // start polling sync when menu is toggled, only open, only if triggered manually
                $('.tau-board-header__control--actions .tau-actions-btn:not(.tau-checked)').on('click', function() {
                    // console.log('toggle menu');
                    if( !$(this).hasClass('zoom-open') ) {
                        // console.log('start poll');
                        zoomTimer = setTimeout(checkZoomButton, 1000);  // test if slider has changed
                    } else {
                        // console.log('no poll');
                    }

                    return true;
                });


                return true;
            } else {
                // console.log('menu is ok');
                if ( tries > 0 ) {
                    setTimeout( function() { waitForSlider( tries -1 ) }, 1000 );  // try again, slider was not ready
                } else {
                    // give up , to many tries without menu
                    closeActionMenu();
                }

                return false;
            }
        };



        var isActionMenuOpen = function() {
            return $('.tau-board-header__control--actions .tau-actions-btn.tau-checked').length;
        };

        var openActionMenu = function() {
            $('.tau-board-header__control--actions .tau-actions-btn:not(.tau-checked)').addClass('zoom-open'); // mark
            $('.tau-board-header__control--actions .tau-actions-btn:not(.tau-checked)').click(); // open
        };

        var closeActionMenu = function() {
            $('.tau-board-header__control--actions .tau-actions-btn.tau-checked').click(); // close
            $('.tau-board-header__control--actions .tau-actions-btn').removeClass('zoom-open'); // unmark
        };

        var setZoomHighlight = function ( zoom ) {
            $('.btnZoom.tau-checked:not(#btnZoom'+zoom+')').removeClass('tau-checked'); // clear other buttons , but keep active
            $('#btnZoom'+zoom+':not(.tau-checked)').addClass('tau-checked');        // mark active button
        };

    });
