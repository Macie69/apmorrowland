using apmorrowland from '../db/schema';

// Hoofdservice voor de festival applicatie
service FestivalService @(path: '/festival') {
    
    // Artist Management App
    // Voor het beheren van artiesten en reviews
    @cds.redirection.target
    entity Artists as projection on apmorrowland.Artists;
    entity Reviews as projection on apmorrowland.Reviews;
    
    // Line-up & Planning
    entity Stages as projection on apmorrowland.Stages;
    entity Performances as projection on apmorrowland.Performances;
    
    // Orders
    entity Customers as projection on apmorrowland.Customers;
    entity Orders as projection on apmorrowland.Orders;
    entity OrderItems as projection on apmorrowland.OrderItems;
    entity Products as projection on apmorrowland.Products;
    
    // Leaderboard - View voor top artiesten
    @readonly
    entity Leaderboard as projection on apmorrowland.Artists {
        ID,
        name,
        genre,
        country,
        popularity
    };
}