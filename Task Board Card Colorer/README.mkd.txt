Task Board Card Colorer
=======================

The Task Board Card Colorer mashup is a simple mashup for your task board that colors task cards based on either tags or values of your 
custom fields.  It is the Task Board equivalent of the [KanbanTagCustomFieldColorer mashup](https://github.com/TargetProcess/MashupsLibrary/tree/master/KanbanTagCustomFieldColorer)

![Task Board Card Colorer](https://raw.github.com/TargetProcess/MashupsLibrary/master/Task%20Board%20Card%20Colorer/screenshot.png)


Customizing Colors
------------------

In order to color your cards, the Mashup must know what you would like to color them.  At the top of the file, find 
this block of code:

```
    /* an object of tags : colors
     * this determines the colors of your tags */
	var tagColors = {
		'redball':'#ff0000',
	 	'blocked':'#ff00ff'
	};
```

This object holds the coloring information for tag-based matching.  It is simply an object where the key is the tag name and 
the color is the base color, in hex.

To customize the coloring information for custom-field-based matching, find this block:

```
    /* an object of custom fields : possible values
     *   possible values is another object of value : color mappings
     * this determines the colors based on custom field values */
    var customFieldMappings = {
        'Story Type' : {
            'Blue':'#0000ff',
            'Green':'#00ff00',
            'Gray':'#c0c0c0'
        }
    };
```

This object is a collection where the key is the *exact* name of a Custom Field that we want to match upon.  The value for this 
key is another object that holds a list of values (as keys) and colors (as values) that we will color on.



Installing the Mashup with TargetProcess
----------------------------------------

1. In your TP site, navigate to ```Settings > (System Settings) > Mashups```
2. Click "Add New Mashup"
3. In the "Name" field, enter a name unique to this Mashup - for example "Task Board Colorer"
4. In the "Placeholders" field, enter ```Project_Tracking_TaskBoard_TaskBoard```
5. Copy and paste the contents of the [Task Board Card Colorer.js](https://github.com/TargetProcess/MashupsLibrary/raw/master/Task%20Board%20Card%20Colorer/Task%20Board%20Card%20Colorer.js) file in the "Code" box.
6. Update your colors according to the above instructions
7. Click Save
8. ?
9. Profit

