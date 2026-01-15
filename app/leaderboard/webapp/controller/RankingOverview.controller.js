sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, JSONModel, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("apmorrowland.leaderboard.controller.RankingOverview", {
        
        onInit: function () {
            this._oLeaderboardModel = new JSONModel({
                artists: []
            });
            this.getView().setModel(this._oLeaderboardModel, "leaderboard");
            
            // Laad data na korte delay om model te laten initialiseren
            setTimeout(this._loadLeaderboardData.bind(this), 500);
        },

        _loadLeaderboardData: function () {
            var oModel = this.getView().getModel();
            if (!oModel) {
                setTimeout(this._loadLeaderboardData.bind(this), 500);
                return;
            }

            var that = this;

            // Haal alle artiesten op
            var oArtistBinding = oModel.bindList("/Artists", null, null, null, {
                $expand: "reviews"
            });

            oArtistBinding.requestContexts(0, 100).then(function (aContexts) {
                var aArtists = [];
                var aPromises = [];

                aContexts.forEach(function (oContext) {
                    var oArtist = {
                        ID: oContext.getProperty("ID"),
                        name: oContext.getProperty("name"),
                        genre: oContext.getProperty("genre"),
                        country: oContext.getProperty("country"),
                        popularity: oContext.getProperty("popularity")
                    };
                    aArtists.push(oArtist);
                });

                // Nu haal reviews apart op voor elke artiest
                aArtists.forEach(function (oArtist) {
                    var oReviewBinding = oModel.bindList("/Reviews", null, null, [
                        new Filter("artist_ID", FilterOperator.EQ, oArtist.ID)
                    ]);
                    
                    var pReviews = oReviewBinding.requestContexts(0, 100).then(function (aReviewContexts) {
                        var aReviews = aReviewContexts.map(function (oReviewContext) {
                            return {
                                rating: oReviewContext.getProperty("rating")
                            };
                        });
                        
                        // Bereken gemiddelde
                        var iReviewCount = aReviews.length;
                        var fAverageRating = 0;
                        
                        if (iReviewCount > 0) {
                            var iTotalRating = aReviews.reduce(function (sum, review) {
                                return sum + (review.rating || 0);
                            }, 0);
                            fAverageRating = iTotalRating / iReviewCount;
                        }
                        
                        oArtist.reviewCount = iReviewCount;
                        oArtist.averageRating = Math.round(fAverageRating * 10) / 10;
                    });
                    
                    aPromises.push(pReviews);
                });

                // Wacht tot alle reviews geladen zijn
                Promise.all(aPromises).then(function () {
                    // Sorteer op gemiddelde rating
                    aArtists.sort(function (a, b) {
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
            }).catch(function (oError) {
                console.error("Error loading artists:", oError);
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