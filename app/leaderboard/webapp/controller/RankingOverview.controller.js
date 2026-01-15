sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, JSONModel, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("apmorrowland.leaderboard.controller.RankingOverview", {
        
        onInit: function () {
            // JSON Model voor de gerangschikte artiesten
            this._oLeaderboardModel = new JSONModel({
                artists: []
            });
            this.getView().setModel(this._oLeaderboardModel, "leaderboard");
            
            // Laad data wanneer view klaar is
            this.getView().attachAfterRendering(this._loadLeaderboardData.bind(this));
        },

        _loadLeaderboardData: function () {
            var oModel = this.getView().getModel();
            if (!oModel) {
                return;
            }

            var that = this;

            // Haal alle artiesten op met hun reviews
            var oBinding = oModel.bindList("/Artists", null, null, null, {
                $expand: "reviews"
            });

            oBinding.requestContexts(0, 100).then(function (aContexts) {
                var aArtists = [];

                aContexts.forEach(function (oContext) {
                    var oArtist = {
                        ID: oContext.getProperty("ID"),
                        name: oContext.getProperty("name"),
                        genre: oContext.getProperty("genre"),
                        country: oContext.getProperty("country"),
                        popularity: oContext.getProperty("popularity"),
                        reviews: oContext.getProperty("reviews") || []
                    };

                    // Bereken gemiddelde rating
                    var aReviews = oArtist.reviews;
                    var iReviewCount = aReviews.length;
                    var fAverageRating = 0;

                    if (iReviewCount > 0) {
                        var iTotalRating = aReviews.reduce(function (sum, review) {
                            return sum + (review.rating || 0);
                        }, 0);
                        fAverageRating = iTotalRating / iReviewCount;
                    }

                    oArtist.reviewCount = iReviewCount;
                    oArtist.averageRating = Math.round(fAverageRating * 10) / 10; // 1 decimaal

                    aArtists.push(oArtist);
                });

                // Sorteer op gemiddelde rating (hoogste eerst)
                aArtists.sort(function (a, b) {
                    // Eerst op rating, dan op aantal reviews bij gelijke rating
                    if (b.averageRating !== a.averageRating) {
                        return b.averageRating - a.averageRating;
                    }
                    return b.reviewCount - a.reviewCount;
                });

                // Voeg rank toe
                aArtists.forEach(function (oArtist, index) {
                    oArtist.rank = index + 1;
                });

                that._oLeaderboardModel.setProperty("/artists", aArtists);
            });
        },

        onRefresh: function () {
            this._loadLeaderboardData();
        },

        onGenreFilter: function (oEvent) {
            var sGenre = oEvent.getParameter("selectedItem").getKey();
            var oTable = this.byId("leaderboardTable");
            var oBinding = oTable.getBinding("items");

            if (sGenre) {
                oBinding.filter([new Filter("genre", FilterOperator.EQ, sGenre)]);
            } else {
                oBinding.filter([]);
            }
        },

        formatRankState: function (iRank) {
            if (iRank === 1) {
                return "Success";
            } else if (iRank <= 3) {
                return "Warning";
            }
            return "None";
        },

        formatRankIcon: function (iRank) {
            if (iRank === 1) {
                return "sap-icon://competitor";
            } else if (iRank === 2) {
                return "sap-icon://badge";
            } else if (iRank === 3) {
                return "sap-icon://favorite";
            }
            return "";
        },

        formatRatingState: function (fRating) {
            if (fRating >= 4.5) {
                return "Success";
            } else if (fRating >= 3.5) {
                return "Warning";
            } else if (fRating > 0) {
                return "Error";
            }
            return "None";
        }
    });
});