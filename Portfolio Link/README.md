# Portfolio Link

This mashup adds multiportfolio support to the entity details view.
For example, you can link Company portfolio => Work and then Work => Product portfolio at the same time to show multilevel
hierarchy. Also that's possible to link multiple portfolios to Work, for example Company portfolio => Work and then Sales
portfolio => Work at the same time.

Be careful, in case you want to use hierarchical view or lists, you need to setup metrics.

Sample mashup config:
```
{
    // Name of project's process custom field which mashup will use to decide project is portfolio or not.
    // Should be added only to processes which are for portfolio projects, DO NOT it to work processes.
    "portfolioTypeCustomFieldName": "PortfolioType",
    // All portfolio configurations.
    "portfolios": [
        {
            // Default portfolio setup.
            // This config will be used for portfolio projects which process "portfolioTypeCustomFieldName" custom
            // field value is "Company Portfolio".
            "name": "Company Portfolio",
            // How to connect Portfolio and Work by relations (this should not be changed without knowledge what
            // are you doing).
            "relationDirection": {
                // Portfolio is main entity.
                "me": "inbound",
                // Work is out from Portfolio.
                "other": "outbound"
            },
            // Types of entities should be used as Portfolio / Work.
            "entityTypes": {
                // Portfolio items can be:
                "me": ["epic", "feature", "userstory"],
                // Work items can be:
                "other": ["epic", "feature", "userstory", "project"]
            },
            // What tabs we should show for Portfolio / Work item views.
            "itemTabWhiteLists": {
                // Portfolio item view tabs per item are:
                "me": {
                    "epic": ["description", "features"],
                    "feature": ["description", "userstories"],
                    "userstory": ["description", "tasks"]
                }
            },
            // How to view Portfolio / Work.
            "visualization": {
                // Portofolio view configuration.
                "me": {
                    // How to show Portfolio on Work view, can be "tab" or "component".
                    // For "component", see below.
                    "type": "tab",
                    // Tab view options.
                    "options": {
                        // Name of the tab.
                        "name": "Portfolio Items",
                        // Tab to insert us after.
                        "insertAfter": "relations",
                        // How to show Portfolio items on tab.
                        "itemsView": {
                            // Can be "simple.list" or "hierarchy.list".
                            // "simple.list" show items as list (as on "Relations" tab).
                            // For "hierarchy.list", see below.
                            "type": "simple.list"
                        }
                    }
                },
                // Work view configuration.
                "other": {
                    // How to show Work items on Portfolio view.
                    "type": "tab",
                    "options": {
                        "name": "Portfolio Work Items",
                        "insertAfter": "relations",
                        "itemsView": {
                            "type": "simple.list"
                        }
                    }
                }
            }
        },
        {
            // Custom portfolio hierarchy component in right panel, contact support if want to do the same.
            // This config will be used for portfolio projects which process "portfolioTypeCustomFieldName" custom
            // field value is "Product Portfolio".
            "name": "Product Portfolio",
            "relationDirection": {
                "me": "outbound",
                "other": "inbound"
            },
            "entityTypes": {
                "me": ["epic", "feature", "userstory"],
                "other": ["epic", "feature", "userstory", "project"]
            },
            "itemTabWhiteLists": {
                "me": {
                    "epic": ["description", "features"],
                    "feature": ["description", "userstories"],
                    "userstory": ["description", "tasks"]
                }
            },
            "visualization": {
                "me": {
                    // Show Portfolio on Work view as component in right panel on entity view.
                    "type": "component",
                    // Component view options.
                    "options": {
                        // Portfolio component name. Now supported only "hierarchy.link" component.
                        // Contact support if you need custom component.
                        "name": "hierarchy.link",
                        "insertAfter": {
                            // Which section in right panel on entity view to insert component to.
                            // Now only "info" section is supported.
                            "section": "info",
                            // Configure position of component inside "section".
                            "position": {
                                // For epic entity view, insert Portfolio component into "info" section and make it first.
                                "epic": null,
                                // For feature entity view, insert Portfolio component into "info" section after "Owner" component.
                                "feature": "owner",
                                "userstory": null,
                                "project": null
                            }
                        },
                        // How often to refresh our hierarchy component data in milliseconds.
                        "refreshInterval": 1200,
                        // What items in hierarchy are required by type.  
                        "requiredFor": ["epic"],
                        // Improve UI responsiveness of child components. May slow down view opening. 
                        "preInitializeComponents": true,
                        // Show separators between hierarchy component and others. 
                        "showSeparators": {
                            // Show top separator.
                            "top": false,
                            // Show bottom separator.
                            "bottom": true
                        },
                        // Configuration for hierarchy items.
                        "items": [
                            {
                                // Product item.
                                "name": "Product",
                                // Custom field name to save direct relation between Work and Product.
                                // Computed by metric you should setup before.
                                "directCf": "ProductRelation",
                                // Custom field name to save inherited relation between Work and Product.
                                // Computed by metric you should setup before.
                                "propagatedCf": "Product",
                                // Types Product can have.
                                "types": ["epic"],
                                // Filter available Products.
                                // For example, any epic:
                                "filters": []
                            },
                            {
                                // Subproduct item.
                                "name": "Subproduct",
                                // Custom field name to save direct relation between Work and Subproduct.
                                // Computed by metric you should setup before.
                                "directCf": "SubproductRelation",
                                // Computed by metric you should setup before.
                                // Custom field name to save inherited relation between Work and Subproduct.
                                "propagatedCf": "Subproduct",
                                // Types Subproduct can have.
                                "types": ["feature"],
                                // Filter available Subproducts,
                                // for example Subproduct should be first suitable from:
                                // 1. Product's epics features (if has Product),
                                // 2. any feature (if no Product). 
                                "filters": ["epic.id == {{Product.id}}"]
                            },
                            {
                                // Component item.
                                "name": "Component",
                                // Custom field name to save direct relation between Work and Component.
                                // Computed by metric you should setup before.
                                "directCf": "ComponentRelation",
                                // Custom field name to save inherited relation between Work and Component.
                                // Computed by metric you should setup before.
                                "propagatedCf": "Component",
                                // Types Component can have.
                                "types": ["userstory"],
                                // Filter available Components,
                                // for example Component should be first suitable from:
                                // 1. Subproduct's feature userstories (if has Subproduct),
                                // 2. Product epic's feature's userstories (if has Product).
                                // 3. any userstory (if no Subproduct and no Product). 
                                "filters": ["feature.id == {{Subproduct.id}}", "feature.epic.id == {{Product.id}}"]
                            }
                        ]
                    }
                },
                "other": {
                    "type": "tab",
                    "options": {
                        "name": "Product Work Items",
                        "insertAfter": "relations",
                        "itemsView": {
                            // Show Work items on Portfolio entity view as hierarchical list.
                            "type": "hierarchy.list",
                            // Configure how to show Work items hierarchy.
                            "options": {
                                // How opaque should be items not matching their filters.
                                "filteredItemsOpacity": 0.4,
                                "items": [
                                    {
                                        // Product item. Will be used as horizontal lane. Do not change name.
                                        "name": "Product",
                                        // Custom field name to save inherited relation between Work and Product.
                                        // Computed by metric you should setup before.
                                        "propagatedCf": "Product",
                                        // Type Product has.
                                        "type": "epic",
                                        // Filter Product items to show on lane.
                                        "filter": "{{Filter}} or features.count({{Filter}} or userstories.count({{Filter}}) > 0) > 0"
                                    },
                                    {
                                        // Subproduct item. Will be used as vertical lane. Do not change name.
                                        "name": "Subproduct",
                                        // Custom field name to save inherited relation between Work and Subproduct.
                                        // Computed by metric you should setup before.
                                        "propagatedCf": "Subproduct",
                                        // Type Subproduct has.
                                        "type": "feature",
                                        // Filter Subproduct items to show on lane.
                                        "filter": "{{Filter}} or userstories.count({{Filter}}) > 0"
                                    },
                                    {
                                        // Component item. Will be used as cards. Do not change name.
                                        "name": "Component",
                                        // Custom field name to save inherited relation between Work and Component.
                                        // Computed by metric you should setup before.
                                        "propagatedCf": "Component",
                                        // Type Component has.
                                        "type": "userstory",
                                        // Filter Component items to show as cards.
                                        "filter": "{{Filter}}"
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        }
    ]
}
```

Portfolio/Work hierarchy:
![PortfolioTab](https://raw.githubusercontent.com/TargetProcess/MashupsLibrary/master/Portfolio%20Link/PortfolioTab.png)

Work/Product hierarchy:
![ProductHierarchy](https://raw.githubusercontent.com/TargetProcess/MashupsLibrary/master/Portfolio%20Link/ProductHierarchy.png)

How To Install and Use the Mashup
---------------------------------

1. Download the Mashup file either by cloning this repository or
   downloading a ZIP.
2. Extract/copy the "Portfolio Link" folder to your 
   _<TargetProcess Install Path>/JavaScript/Mashups/_ folder.
3. Configure mashup as described in `Sample mashup config` above. 
4. Sit back and enjoy portfolio support in our lovely Targetprocess!

