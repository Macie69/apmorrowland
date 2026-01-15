sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, Filter, FilterOperator, Sorter, Fragment, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("apmorrowland.artistmanagement.controller.ArtistOverview", {
        
        onInit: function () {
            // Initialisatie
        },

        // ==================== FILTERING & SORTING ====================
        
        // Zoekfunctie
        onSearch: function (oEvent) {
            this._applyFiltersAndSorting();
        },

        // Filter change (genre of country)
        onFilterChange: function (oEvent) {
            this._applyFiltersAndSorting();
        },

        // Sort change
        onSortChange: function (oEvent) {
            this._applyFiltersAndSorting();
        },

        _applyFiltersAndSorting: function () {
            var oView = this.getView();
            var oTable = this.byId("artistsTable");
            var oBinding = oTable.getBinding("items");
            
            // === FILTERS ===
            var aFilters = [];
            
            // Zoekfilter op naam
            var sSearchQuery = oView.byId("searchField").getValue();
            if (sSearchQuery) {
                aFilters.push(new Filter("name", FilterOperator.Contains, sSearchQuery));
            }
            
            // Genre filter
            var sGenre = oView.byId("genreFilter").getSelectedKey();
            if (sGenre) {
                aFilters.push(new Filter("genre", FilterOperator.EQ, sGenre));
            }
            
            // Country filter
            var sCountry = oView.byId("countryFilter").getSelectedKey();
            if (sCountry) {
                aFilters.push(new Filter("country", FilterOperator.EQ, sCountry));
            }
            
            // Apply filters
            oBinding.filter(aFilters);
            
            // === SORTING ===
            var sSortKey = oView.byId("sortSelect").getSelectedKey();
            var oSorter = null;
            
            switch (sSortKey) {
                case "name":
                    oSorter = new Sorter("name", false); // ascending
                    break;
                case "nameDesc":
                    oSorter = new Sorter("name", true); // descending
                    break;
                case "popularity":
                    oSorter = new Sorter("popularity", false); // ascending
                    break;
                case "popularityDesc":
                    oSorter = new Sorter("popularity", true); // descending
                    break;
                default:
                    oSorter = new Sorter("name", false);
            }
            
            oBinding.sort(oSorter);
        },

        // Navigatie naar detail
        onArtistPress: function (oEvent) {
            var oItem = oEvent.getParameter("listItem");
            var oBindingContext = oItem.getBindingContext();
            var sArtistId = oBindingContext.getProperty("ID");
            
            this.getOwnerComponent().getRouter().navTo("RouteArtistDetail", {
                artistId: sArtistId
            });
        },

        // ==================== ADD ARTIST ====================
        onAddArtist: function () {
            var oView = this.getView();

            if (!this._pAddDialog) {
                this._pAddDialog = Fragment.load({
                    id: oView.getId(),
                    name: "apmorrowland.artistmanagement.view.fragment.AddArtistDialog",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            
            this._pAddDialog.then(function (oDialog) {
                oDialog.open();
            });
        },

        onSaveArtist: function () {
            var oView = this.getView();
            
            // Artiest gegevens
            var sName = oView.byId("inputName").getValue();
            var sGenre = oView.byId("selectGenre").getSelectedKey();
            var sCountry = oView.byId("inputCountry").getValue();
            var sDescription = oView.byId("inputDescription").getValue();
            var iPopularity = oView.byId("sliderPopularity").getValue();

            // Performance gegevens
            var sStageId = oView.byId("selectStage").getSelectedKey();
            var sFestivalDay = oView.byId("inputFestivalDay").getValue();
            var sStartTime = oView.byId("inputStartTime").getValue();
            var sEndTime = oView.byId("inputEndTime").getValue();

            // Validatie - Artiest
            if (!sName || !sCountry) {
                MessageBox.error("Vul alle verplichte velden in (Naam en Land)");
                return;
            }

            // Validatie - Performance
            if (!sStageId || !sFestivalDay || !sStartTime || !sEndTime) {
                MessageBox.error("Vul alle performance velden in (Stage, Dag, Start- en Eindtijd)");
                return;
            }

            // Genereer UUIDs
            var sArtistUUID = this._generateUUID();
            var sPerformanceUUID = this._generateUUID();

            var oModel = this.getView().getModel();
            
            // 1. Maak nieuwe artiest aan
            var oArtistBinding = oModel.bindList("/Artists");
            oArtistBinding.create({
                ID: sArtistUUID,
                name: sName,
                genre: sGenre,
                country: sCountry,
                description: sDescription,
                popularity: iPopularity
            });

            // 2. Maak performance aan
            var oPerformanceBinding = oModel.bindList("/Performances");
            oPerformanceBinding.create({
                ID: sPerformanceUUID,
                artist_ID: sArtistUUID,
                stage_ID: sStageId,
                festivalDay: sFestivalDay,
                startTime: sStartTime,
                endTime: sEndTime
            });

            MessageToast.show("Artiest " + sName + " toegevoegd met optreden!");
            this._clearAddDialog();
            oView.byId("addArtistDialog").close();
        },

        onCancelAddArtist: function () {
            this._clearAddDialog();
            this.byId("addArtistDialog").close();
        },

        _clearAddDialog: function () {
            var oView = this.getView();
            
            // Clear artiest velden
            oView.byId("inputName").setValue("");
            oView.byId("selectGenre").setSelectedKey("EDM");
            oView.byId("inputCountry").setValue("");
            oView.byId("inputDescription").setValue("");
            oView.byId("sliderPopularity").setValue(50);
            
            // Clear performance velden
            var oStageSelect = oView.byId("selectStage");
            if (oStageSelect.getItems().length > 0) {
                oStageSelect.setSelectedKey(oStageSelect.getItems()[0].getKey());
            }
            oView.byId("inputFestivalDay").setValue("");
            oView.byId("inputStartTime").setValue("");
            oView.byId("inputEndTime").setValue("");
            
            // Reset naar eerste tab
            var oTabBar = oView.byId("addArtistTabBar");
            if (oTabBar) {
                oTabBar.setSelectedKey("tabArtistInfo");
            }
        },

        _generateUUID: function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0,
                    v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
    });
});