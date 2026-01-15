sap.ui.define([
    "sap/ui/core/format/DateFormat"
], function (DateFormat) {
    "use strict";

    return {
        /**
         * Formats a date string (YYYY-MM-DD) to a readable format
         * @param {string} sDate - Date string from OData
         * @returns {string} Formatted date or empty string
         */
        formatDate: function (sDate) {
            if (!sDate) {
                return "";
            }
            
            try {
                // Parse the date string (format: YYYY-MM-DD)
                var oDate = new Date(sDate);
                
                if (isNaN(oDate.getTime())) {
                    return sDate; // Return original if parsing fails
                }
                
                var oDateFormat = DateFormat.getDateInstance({
                    style: "medium"
                });
                
                return oDateFormat.format(oDate);
            } catch (e) {
                return sDate;
            }
        },

        /**
         * Formats a date string to long format
         * @param {string} sDate - Date string from OData
         * @returns {string} Formatted date or empty string
         */
        formatDateLong: function (sDate) {
            if (!sDate) {
                return "";
            }
            
            try {
                var oDate = new Date(sDate);
                
                if (isNaN(oDate.getTime())) {
                    return sDate;
                }
                
                var oDateFormat = DateFormat.getDateInstance({
                    style: "long"
                });
                
                return oDateFormat.format(oDate);
            } catch (e) {
                return sDate;
            }
        },

        /**
         * Returns the status state for ObjectStatus
         * @param {string} sStatus - Order status
         * @returns {string} ValueState
         */
        formatStatusState: function (sStatus) {
            switch (sStatus) {
                case "Paid":
                    return "Success";
                case "Cancelled":
                    return "Error";
                case "Open":
                    return "Warning";
                default:
                    return "None";
            }
        },

        /**
         * Determines if buttons should be visible (only for Open status)
         * @param {string} sStatus - Order status
         * @returns {boolean}
         */
        isOrderOpen: function (sStatus) {
            return sStatus === "Open";
        }
    };
});