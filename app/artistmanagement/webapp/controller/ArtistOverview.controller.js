sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, Filter, FilterOperator) {
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
            var oItem = oEvent.getSource();
            var oBindingContext = oItem.getBindingContext();
            var sArtistId = oBindingContext.getProperty("ID");
            
            // Later: navigatie naar detail pagina
            sap.m.MessageToast.show("Artiest ID: " + sArtistId);
        },

        // Nieuwe artiest toevoegen
        onAddArtist: function () {
            // Later: dialog openen
            sap.m.MessageToast.show("Nieuwe artiest toevoegen...");
        }
    });
});