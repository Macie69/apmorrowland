sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/format/DateFormat",
    "sap/ui/model/json/JSONModel"
], function (Controller, Filter, FilterOperator, DateFormat, JSONModel) {
    "use strict";

    return Controller.extend("apmorrowland.lineup.controller.ScheduleOverview", {
        
        // Stage namen voor filtering
        _mStageConfig: {
            "mainStageList": "Main Stage",
            "technoTempleList": "Techno Temple",
            "chillGardenList": "Chill Garden"
        },
        
        onInit: function () {
            // JSON model voor festival dagen
            this._oViewModel = new JSONModel({
                festivalDays: [],
                selectedDay: null
            });
            this.getView().setModel(this._oViewModel, "view");
            
            // Laad data wanneer view klaar is
            this.getView().attachAfterRendering(this._loadFestivalDays.bind(this));
        },

        _loadFestivalDays: function () {
            var oModel = this.getView().getModel();
            if (!oModel) {
                // Probeer opnieuw als model nog niet geladen is
                setTimeout(this._loadFestivalDays.bind(this), 100);
                return;
            }

            var that = this;

            // Haal alle performances op om unieke dagen te vinden
            var oBinding = oModel.bindList("/Performances", null, null, null, {
                $orderby: "festivalDay"
            });

            oBinding.requestContexts(0, 100).then(function (aContexts) {
                var aDays = [];
                var oSeenDays = {};

                aContexts.forEach(function (oContext) {
                    var sDay = oContext.getProperty("festivalDay");
                    if (sDay && !oSeenDays[sDay]) {
                        oSeenDays[sDay] = true;
                        aDays.push(sDay);
                    }
                });

                // Sorteer dagen
                aDays.sort();

                // Sla op in view model
                that._oViewModel.setProperty("/festivalDays", aDays);

                // Populeer de select dropdown
                if (aDays.length > 0) {
                    that._populateDaySelect(aDays);
                    
                    // Selecteer eerste dag als default
                    var oSelect = that.byId("daySelect");
                    oSelect.setSelectedKey(aDays[0]);
                    that._oViewModel.setProperty("/selectedDay", aDays[0]);
                    
                    // Apply initial filter
                    that._filterPerformancesByDay(aDays[0]);
                }
            }).catch(function (oError) {
                console.error("Error loading festival days:", oError);
            });
        },

        _populateDaySelect: function (aDays) {
            var oSelect = this.byId("daySelect");
            var oDateFormat = DateFormat.getDateInstance({ style: "full" });

            // Clear existing items
            oSelect.removeAllItems();

            aDays.forEach(function (sDay) {
                var oDate = new Date(sDay);
                var sFormattedDate = oDateFormat.format(oDate);
                
                oSelect.addItem(new sap.ui.core.Item({
                    key: sDay,
                    text: sFormattedDate
                }));
            });
        },

        onDayChange: function (oEvent) {
            var sSelectedDay = oEvent.getParameter("selectedItem").getKey();
            this._oViewModel.setProperty("/selectedDay", sSelectedDay);
            this._filterPerformancesByDay(sSelectedDay);
        },

        _filterPerformancesByDay: function (sDay) {
            var that = this;
            
            // Filter alle stage lists met gecombineerde filter (stage + dag)
            Object.keys(this._mStageConfig).forEach(function (sListId) {
                var sStageName = that._mStageConfig[sListId];
                var oList = that.byId(sListId);
                
                if (oList) {
                    var oBinding = oList.getBinding("items");
                    if (oBinding) {
                        // Combineer stage filter EN dag filter met AND
                        var aFilters = [
                            new Filter("stage/name", FilterOperator.EQ, sStageName),
                            new Filter("festivalDay", FilterOperator.EQ, sDay)
                        ];
                        
                        // AND filter
                        var oCombinedFilter = new Filter({
                            filters: aFilters,
                            and: true
                        });
                        
                        oBinding.filter(oCombinedFilter);
                    }
                }
            });
        },

        formatTime: function (sTime) {
            if (!sTime) {
                return "";
            }
            // Time komt als "HH:MM:SS", we willen "HH:MM"
            return sTime.substring(0, 5);
        },

        formatDate: function (sDate) {
            if (!sDate) {
                return "";
            }
            var oDate = new Date(sDate);
            var oDateFormat = DateFormat.getDateInstance({ style: "medium" });
            return oDateFormat.format(oDate);
        }
    });
});