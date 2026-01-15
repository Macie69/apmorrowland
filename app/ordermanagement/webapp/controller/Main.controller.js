sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/f/library",
    "apmorrowland/ordermanagement/model/formatter"
], function (Controller, Filter, FilterOperator, Fragment, MessageToast, MessageBox, fioriLibrary, formatter) {
    "use strict";

    return Controller.extend("apmorrowland.ordermanagement.controller.Main", {
        
        formatter: formatter,
        
        onInit: function () {
            this._oWizardData = {
                customer: null,
                orderType: null,
                items: [],
                totalAmount: 0
            };
        },

        // ==================== FILTERING ====================
        onSearch: function (oEvent) {
            this._applyFilters();
        },

        onFilterChange: function (oEvent) {
            this._applyFilters();
        },

        _applyFilters: function () {
            var aFilters = [];
            var oView = this.getView();
            
            var sSearchQuery = oView.byId("searchField").getValue();
            if (sSearchQuery) {
                aFilters.push(new Filter("customer/lastName", FilterOperator.Contains, sSearchQuery));
            }
            
            var sStatus = oView.byId("statusFilter").getSelectedKey();
            if (sStatus) {
                aFilters.push(new Filter("status", FilterOperator.EQ, sStatus));
            }
            
            var sType = oView.byId("typeFilter").getSelectedKey();
            if (sType) {
                aFilters.push(new Filter("orderType", FilterOperator.EQ, sType));
            }
            
            var oTable = oView.byId("ordersTable");
            var oBinding = oTable.getBinding("items");
            oBinding.filter(aFilters);
        },

        // ==================== ORDER SELECTION ====================
        onOrderSelect: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("listItem");
            var oContext = oSelectedItem.getBindingContext();
            var sOrderId = oContext.getProperty("ID");
            
            var oDetailPage = this.byId("orderDetailPage");
            oDetailPage.bindElement({
                path: "/Orders(" + sOrderId + ")",
                parameters: {
                    $expand: "customer,items($expand=product)"
                }
            });
            
            var oFCL = this.byId("fcl");
            oFCL.setLayout(fioriLibrary.LayoutType.TwoColumnsMidExpanded);
        },

        onCloseDetail: function () {
            var oFCL = this.byId("fcl");
            oFCL.setLayout(fioriLibrary.LayoutType.OneColumn);
        },

        // ==================== ORDER ACTIONS ====================
        onMarkPaid: function () {
            var oContext = this.byId("orderDetailPage").getBindingContext();
            oContext.setProperty("status", "Paid");
            
            this.getView().getModel().submitBatch("updateGroup").then(function () {
                MessageToast.show("Order gemarkeerd als betaald");
            });
        },

        onCancelOrder: function () {
            var that = this;
            var oContext = this.byId("orderDetailPage").getBindingContext();
            
            MessageBox.confirm("Weet je zeker dat je deze order wilt annuleren?", {
                title: "Bevestig Annulering",
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        oContext.setProperty("status", "Cancelled");
                        that.getView().getModel().submitBatch("updateGroup").then(function () {
                            MessageToast.show("Order geannuleerd");
                        });
                    }
                }
            });
        },

        // ==================== NEW ORDER WIZARD ====================
        onNewOrder: function () {
            var oView = this.getView();
            
            this._oWizardData = {
                customer: null,
                orderType: null,
                items: [],
                totalAmount: 0
            };

            if (!this._pOrderWizard) {
                this._pOrderWizard = Fragment.load({
                    id: oView.getId(),
                    name: "apmorrowland.ordermanagement.view.fragment.OrderWizard",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            
            this._pOrderWizard.then(function (oDialog) {
                var oWizard = this.byId("orderWizard");
                if (oWizard) {
                    oWizard.discardProgress(oWizard.getSteps()[0]);
                }
                oDialog.open();
            }.bind(this));
        },

        // Step 1: Customer Selection
        onCustomerSelect: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("listItem");
            var oContext = oSelectedItem.getBindingContext();
            
            this._oWizardData.customer = {
                ID: oContext.getProperty("ID"),
                name: oContext.getProperty("firstName") + " " + oContext.getProperty("lastName"),
                email: oContext.getProperty("email")
            };
            
            var oWizard = this.byId("orderWizard");
            oWizard.validateStep(this.byId("stepCustomer"));
        },

        // Step 2: Order Type Selection - 3 aparte functies
        onTypeTicket: function () {
            this._selectOrderType("Ticket");
        },

        onTypeMerchandise: function () {
            this._selectOrderType("Merchandise");
        },

        onTypeFoodDrinks: function () {
            this._selectOrderType("FoodDrinks");
        },

        _selectOrderType: function (sType) {
            this._oWizardData.orderType = sType;
            this._loadProductsByType(sType);
            
            var oWizard = this.byId("orderWizard");
            oWizard.validateStep(this.byId("stepType"));
        },

        _loadProductsByType: function (sType) {
            var oProductList = this.byId("productList");
            var oBinding = oProductList.getBinding("items");
            
            if (oBinding) {
                oBinding.filter([new Filter("category", FilterOperator.EQ, sType)]);
            }
        },

        // Step 3: Add Items
        onAddItem: function (oEvent) {
            var oItem = oEvent.getSource();
            var oContext = oItem.getBindingContext();
            var oProduct = {
                ID: oContext.getProperty("ID"),
                name: oContext.getProperty("name"),
                price: parseFloat(oContext.getProperty("price")),
                quantity: 1
            };
            
            var bExists = this._oWizardData.items.some(function (item) {
                if (item.ID === oProduct.ID) {
                    item.quantity++;
                    return true;
                }
                return false;
            });
            
            if (!bExists) {
                this._oWizardData.items.push(oProduct);
            }
            
            this._updateSelectedItemsList();
            MessageToast.show(oProduct.name + " toegevoegd");
            
            if (this._oWizardData.items.length > 0) {
                var oWizard = this.byId("orderWizard");
                oWizard.validateStep(this.byId("stepItems"));
            }
        },

        _updateSelectedItemsList: function () {
            var oSelectedItemsList = this.byId("selectedItemsList");
            oSelectedItemsList.removeAllItems();
            
            var fTotal = 0;
            
            this._oWizardData.items.forEach(function (item) {
                var fSubtotal = item.price * item.quantity;
                fTotal += fSubtotal;
                
                var oListItem = new sap.m.StandardListItem({
                    title: item.name,
                    description: item.quantity + " x €" + item.price.toFixed(2),
                    info: "€" + fSubtotal.toFixed(2),
                    infoState: "Success"
                });
                
                oSelectedItemsList.addItem(oListItem);
            });
            
            this._oWizardData.totalAmount = fTotal;
            
            var oTotalText = this.byId("wizardTotalAmount");
            if (oTotalText) {
                oTotalText.setNumber(fTotal.toFixed(2));
            }
        },

        // Step 4: Review & Confirm
        onWizardComplete: function () {
            this._updateSummary();
        },

        _updateSummary: function () {
            var oView = this.getView();
            
            oView.byId("summaryCustomer").setText(this._oWizardData.customer ? this._oWizardData.customer.name : "");
            oView.byId("summaryType").setText(this._oWizardData.orderType || "");
            oView.byId("summaryTotal").setNumber(this._oWizardData.totalAmount.toFixed(2));
            
            var oSummaryItemsList = oView.byId("summaryItemsList");
            oSummaryItemsList.removeAllItems();
            
            this._oWizardData.items.forEach(function (item) {
                oSummaryItemsList.addItem(new sap.m.StandardListItem({
                    title: item.name,
                    description: item.quantity + " x €" + item.price.toFixed(2),
                    info: "€" + (item.quantity * item.price).toFixed(2)
                }));
            });
        },

        onConfirmOrder: function () {
            var that = this;
            var oModel = this.getView().getModel();
            
            var sOrderUUID = this._generateUUID();
            
            var oOrderData = {
                ID: sOrderUUID,
                customer_ID: this._oWizardData.customer.ID,
                orderDate: new Date().toISOString().split('T')[0],
                status: "Open",
                orderType: this._oWizardData.orderType,
                totalAmount: this._oWizardData.totalAmount
            };
            
            var oOrderBinding = oModel.bindList("/Orders");
            oOrderBinding.create(oOrderData);
            
            var oItemsBinding = oModel.bindList("/OrderItems");
            
            this._oWizardData.items.forEach(function (item) {
                oItemsBinding.create({
                    ID: that._generateUUID(),
                    order_ID: sOrderUUID,
                    product_ID: item.ID,
                    quantity: item.quantity,
                    unitPrice: item.price,
                    subtotal: item.quantity * item.price
                });
            });
            
            MessageToast.show("Order succesvol aangemaakt!");
            this.byId("orderWizardDialog").close();
            
            this.byId("ordersTable").getBinding("items").refresh();
        },

        onCancelWizard: function () {
            this.byId("orderWizardDialog").close();
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