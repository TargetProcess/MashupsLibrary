tau.mashups
    .addDependency("libs/jquery/jquery")
    .addMashup(function() {

        var styles_list = {
            ".markdown-editor.i-role-preview": {
                "padding-left":          "2em !important"
            },
            ".ui-description__inner, .cke_editable": {
                "padding-left":          "2em !important"
            },
            "h1": {
                "width":                  "100%",
                "box-shadow":             "rgba(0, 0, 0, 0.5) -1px -4px 3px -3px",
                "margin-top":             "1em !important",
                "margin-left":            "-1em !important",
                "padding-top":            "1em !important"
            },
            "h2": {
                "margin-top":             "1em",
                "color":                  "#333 !important",
                "font-style":             "normal",
                "text-decoration":        "underline dotted",
                "margin-left":            "-0.5em !important"
            }
        };

        $(document).ready(function() {
            var css = '<style type="text/css" media="all">';
            $.each(styles_list, function( selector , style_values) {
                css += selector + "{ \r\n ";
                $.each(style_values, function( style_key , style_value) {
                    css+= style_key + ": " + style_value + "; \r\n";
                });
                css += "} \r\n";
            });
            css += '</style>';

            // console.log( css );

            $('head').append(css);
        });
    });

