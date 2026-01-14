namespace apmorrowland;

using { cuid , managed } from '@sap/cds/common';

/**
 * Cuid: Genereert automatisch een unieke ID.
 * Managed: Voegt CreatedAt, modifiedAt, CreatedBy en ModifiedBy toe.
 */
entity Artists: cuid , managed {
    name: String(100) @mandatory;
    genre: String(50);
    country: String(50);
    description: String(5000);
    popularity: Integer;
    reviews: Composition of many Reviews on reviews.artist = $self;
    performances: Composition of many Performances on performances.artist = $self;

}
/**
*Reviews- Bezoekers kunnen hun mening delen over artiesten,
*Reviews bevatten een rating (1-5 sterren) en optionele commentaar,
*/
entity Reviews: cuid, managed {
    artist: Association to Artists;
    rating: Integer @assert.range: [1,5];
    comment: String(100);
    ReviewerName: String(100);

}
/**
 * APMorrowland heeft meerdere podia waar artiesten kunnen optreden.
 * Elk podium heeft naam, locatie en capaciteit.
 */
entity Stages: cuid, managed {
    name: String(100) @mandatory;
    location: String(100);
    capacity: Integer;
    performances: Composition of many Performances on performances.stage = $self;
}

// Optredens (koppeling tussen Artist, Stage en tijdslot)
entity Performances : cuid, managed {
    artist      : Association to Artists;
    stage       : Association to Stages;
    festivalDay : Date;
    startTime   : Time;
    endTime     : Time;
}

/**
 * Klanten - mensen die tickets kopen,
 * Elke klant kan meerdere bestellingen hebben.
 */
entity Customers : cuid, managed {
    firstName   : String(50);
    lastName    : String(50);
    email       : String(100);
    orders      : Composition of many Orders on orders.customer = $self;
}

/**
 * Bestellingen
 * Centrale entity voor het Order Managemnt systeem.
 * Status flow: Open -> Paid -> misschien cancelled
 */
entity Orders : cuid, managed {
    customer    : Association to Customers;
    orderDate   : Date;
    status      : String(20) default 'Open'; // Open, Paid, Cancelled
    orderType   : String(20); // Tickets, Merchandise, FoodDrinks
    totalAmount : Decimal(10,2);
    items       : Composition of many OrderItems on items.order = $self;
}

/**
 * Orderitems - Individuele items in een bestelling
 * Subtotaal = quantity x unitPrice
 */
entity OrderItems : cuid, managed {
    order       : Association to Orders;
    product     : Association to Products;
    quantity    : Integer;
    unitPrice   : Decimal(10,2);
    subtotal    : Decimal(10,2);
}

/**
 * Alles wat verkocht kan worden op het festival.
 */
entity Products : cuid, managed {
    name        : String(100);
    category    : String(20); // Ticket, Merchandise, FoodDrinks
    price       : Decimal(10,2);
    stock       : Integer;
} 