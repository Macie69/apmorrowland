sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/format/DateFormat"
], function (Controller, Filter, FilterOperator, DateFormat) {
    "use strict";

    return Controller.extend("apmorrowland.lineup.controller.ScheduleOverview", {
        
        onInit: function () {
            // Haal unieke festivaldagen op wanneer data geladen is
            this.getView().attachAfterRendering(this._loadFestivalDays.bind(this));
        },

        _loadFestivalDays: function () {
            var oModel = this.getView().getModel();
            if (!oModel) {
                return;
            }

            // Bind de performances en haal unieke dagen op
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

                // Sla op voor later gebruik
                this._aFestivalDays = aDays;

                // Selecteer eerste dag als default
                if (aDays.length > 0) {
                    var oSelect = this.byId("daySelect");
                    if (oSelect && oSelect.getItems().length === 0) {
                        this._populateDaySelect(aDays);
                        oSelect.setSelectedKey(aDays[0]);
                        this._filterByDay(aDays[0]);
                    }
                }
            }.bind(this));
        },

        _populateDaySelect: function (aDays) {
            var oSelect = this.byId("daySelect");
            var oDateFormat = DateFormat.getDateInstance({ style: "full" });

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
            this._filterByDay(sSelectedDay);
        },

        _filterByDay: function (sDay) {
            var oIconTabBar = this.byId("stagesTabBar");
            var aItems = oIconTabBar.getItems();

            aItems.forEach(function (oItem) {
                var oList = oItem.getContent()[0];
                if (oList && oList.getBinding("items")) {
                    oList.getBinding("items").filter([
                        new Filter("festivalDay", FilterOperator.EQ, sDay)
                    ]);
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