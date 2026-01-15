sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, Filter, FilterOperator, Fragment, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("apmorrowland.artistmanagement.controller.ArtistOverview", {
        
        onInit: function () {
            // Initialisatie
        },

        // Zoekfunctie
        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("query");
            var oTable = this.byId("artistsTable");
            var oBinding = oTable.getBinding("items");
            
            var aFilters = [];
            if (sQuery) {
                aFilters.push(new Filter("name", FilterOperator.Contains, sQuery));
            }
            
            oBinding.filter(aFilters);
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
            var sName = oView.byId("inputName").getValue();
            var sGenre = oView.byId("selectGenre").getSelectedKey();
            var sCountry = oView.byId("inputCountry").getValue();
            var sDescription = oView.byId("inputDescription").getValue();
            var iPopularity = oView.byId("sliderPopularity").getValue();

            // Validatie
            if (!sName || !sCountry) {
                MessageBox.error("Vul alle verplichte velden in (Naam en Land)");
                return;
            }

            // Genereer UUID
            var sUUID = this._generateUUID();

            // Maak nieuwe artiest aan
            var oModel = this.getView().getModel();
            var oListBinding = oModel.bindList("/Artists");
            
            oListBinding.create({
                ID: sUUID,
                name: sName,
                genre: sGenre,
                country: sCountry,
                description: sDescription,
                popularity: iPopularity
            });

            MessageToast.show("Artiest " + sName + " toegevoegd!");
            this._clearAddDialog();
            oView.byId("addArtistDialog").close();
        },

        onCancelAddArtist: function () {
            this._clearAddDialog();
            this.byId("addArtistDialog").close();
        },

        _clearAddDialog: function () {
            var oView = this.getView();
            oView.byId("inputName").setValue("");
            oView.byId("selectGenre").setSelectedKey("EDM");
            oView.byId("inputCountry").setValue("");
            oView.byId("inputDescription").setValue("");
            oView.byId("sliderPopularity").setValue(50);
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