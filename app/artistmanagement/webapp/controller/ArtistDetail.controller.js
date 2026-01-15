sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, History, Fragment, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("apmorrowland.artistmanagement.controller.ArtistDetail", {
        
        onInit: function () {
            this.getOwnerComponent().getRouter()
                .getRoute("RouteArtistDetail")
                .attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function (oEvent) {
            this._sArtistId = oEvent.getParameter("arguments").artistId;
            
            this.getView().bindElement({
                path: "/Artists(" + this._sArtistId + ")",
                parameters: {
                    $expand: "reviews,performances($expand=stage)"
                }
            });
        },

        onNavBack: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getOwnerComponent().getRouter().navTo("RouteArtistOverview", {}, true);
            }
        },

        // ==================== DELETE ARTIST ====================
        onDeleteArtist: function () {
            var that = this;
            var oContext = this.getView().getBindingContext();
            var sArtistName = oContext.getProperty("name");

            MessageBox.confirm("Weet je zeker dat je " + sArtistName + " wilt verwijderen?", {
                title: "Bevestig Verwijderen",
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        oContext.delete().then(function () {
                            MessageToast.show(sArtistName + " is verwijderd");
                            that.onNavBack();
                        }).catch(function (oError) {
                            MessageBox.error("Fout bij verwijderen: " + oError.message);
                        });
                    }
                }
            });
        },

        // ==================== EDIT ARTIST ====================
        onEditArtist: function () {
            var oView = this.getView();
            
            // Reset geselecteerde performance
            this._oSelectedPerformanceContext = null;

            if (!this._pEditDialog) {
                this._pEditDialog = Fragment.load({
                    id: oView.getId(),
                    name: "apmorrowland.artistmanagement.view.fragment.EditArtistDialog",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            
            this._pEditDialog.then(function (oDialog) {
                oDialog.setBindingContext(oView.getBindingContext());
                
                // Verberg performance form tot er een geselecteerd is
                var oPerformanceForm = oView.byId("editPerformanceForm");
                if (oPerformanceForm) {
                    oPerformanceForm.setVisible(false);
                }
                
                // Reset list selectie
                var oPerformanceList = oView.byId("editPerformancesList");
                if (oPerformanceList) {
                    oPerformanceList.removeSelections(true);
                }
                
                oDialog.open();
            }.bind(this));
        },

        onPerformanceSelectForEdit: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("listItem");
            var oContext = oSelectedItem.getBindingContext();
            
            // Bewaar geselecteerde performance context
            this._oSelectedPerformanceContext = oContext;
            
            var oView = this.getView();
            
            // Toon het bewerkformulier
            var oPerformanceForm = oView.byId("editPerformanceForm");
            oPerformanceForm.setVisible(true);
            
            // Vul de velden met huidige waarden
            var sStageId = oContext.getProperty("stage_ID");
            var sFestivalDay = oContext.getProperty("festivalDay");
            var sStartTime = oContext.getProperty("startTime");
            var sEndTime = oContext.getProperty("endTime");
            
            oView.byId("editSelectStage").setSelectedKey(sStageId);
            oView.byId("editInputFestivalDay").setValue(sFestivalDay);
            oView.byId("editInputStartTime").setValue(sStartTime);
            oView.byId("editInputEndTime").setValue(sEndTime);
        },

        onSaveEditArtist: function () {
            var oView = this.getView();
            var oModel = oView.getModel();
            
            // Sla artiest wijzigingen op (deze worden automatisch bijgehouden door binding)
            
            // Als er een performance geselecteerd is, update die ook
            if (this._oSelectedPerformanceContext) {
                var sStageId = oView.byId("editSelectStage").getSelectedKey();
                var sFestivalDay = oView.byId("editInputFestivalDay").getValue();
                var sStartTime = oView.byId("editInputStartTime").getValue();
                var sEndTime = oView.byId("editInputEndTime").getValue();
                
                // Validatie
                if (!sStageId || !sFestivalDay || !sStartTime || !sEndTime) {
                    MessageBox.error("Vul alle performance velden in");
                    return;
                }
                
                // Update performance
                this._oSelectedPerformanceContext.setProperty("stage_ID", sStageId);
                this._oSelectedPerformanceContext.setProperty("festivalDay", sFestivalDay);
                this._oSelectedPerformanceContext.setProperty("startTime", sStartTime);
                this._oSelectedPerformanceContext.setProperty("endTime", sEndTime);
            }
            
            // Submit alle changes
            oModel.submitBatch("updateGroup").then(function () {
                MessageToast.show("Wijzigingen opgeslagen!");
            }).catch(function (oError) {
                MessageBox.error("Fout bij opslaan: " + oError.message);
            });

            this.byId("editArtistDialog").close();
            
            // Refresh de view om wijzigingen te tonen
            this.getView().getBindingContext().refresh();
        },

        onCancelEditArtist: function () {
            var oModel = this.getView().getModel();
            oModel.resetChanges();
            this._oSelectedPerformanceContext = null;
            this.byId("editArtistDialog").close();
        },

        // ==================== ADD REVIEW ====================
        onAddReview: function () {
            var oView = this.getView();

            if (!this._pReviewDialog) {
                this._pReviewDialog = Fragment.load({
                    id: oView.getId(),
                    name: "apmorrowland.artistmanagement.view.fragment.AddReviewDialog",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            
            this._pReviewDialog.then(function (oDialog) {
                oDialog.open();
            });
        },

        onSaveReview: function () {
            var oView = this.getView();
            var sReviewerName = oView.byId("inputReviewerName").getValue();
            var iRating = oView.byId("inputRating").getValue();
            var sComment = oView.byId("inputComment").getValue();

            // Validatie
            if (!sReviewerName) {
                MessageBox.error("Vul je naam in");
                return;
            }

            // Genereer UUID
            var sUUID = this._generateUUID();

            // Maak nieuwe review aan
            var oModel = this.getView().getModel();
            var oListBinding = oModel.bindList("/Reviews");
            
            oListBinding.create({
                ID: sUUID,
                artist_ID: this._sArtistId,
                ReviewerName: sReviewerName,
                rating: iRating,
                comment: sComment
            });

            MessageToast.show("Review toegevoegd!");
            this._clearReviewDialog();
            oView.byId("addReviewDialog").close();
            
            // Refresh de view
            this.getView().getBindingContext().refresh();
        },

        onCancelAddReview: function () {
            this._clearReviewDialog();
            this.byId("addReviewDialog").close();
        },

        _clearReviewDialog: function () {
            var oView = this.getView();
            oView.byId("inputReviewerName").setValue("");
            oView.byId("inputRating").setValue(3);
            oView.byId("inputComment").setValue("");
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