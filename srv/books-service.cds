using { northwind } from '../db/schema';

type ProductInput {
    ProductID       : String;
    ProductName     : String;
    SupplierID      : String;
    CategoryID      : String;
    QuantityPerUnit : String;
    UnitPrice       : String;
    UnitsInStock    : Integer;
    UnitsOnOrder    : Integer;
    ReorderLevel    : Integer;
    Discontinued    : String;
}

type SupplierInput {
    SupplierID   : String;
    CompanyName  : String;
    ContactName  : String;
    ContactTitle : String;
    Address      : String;
    City         : String;
    Region       : String;
    PostalCode   : String;
    Country      : String;
    Phone        : String;
    Fax          : Integer;
    HomePage     : String;
}

type CategoryInput {
    CategoryID   : String;
    CategoryName : String;
    Description  : String;
}

type ProductView {
    ProductID    : String;
    ProductName  : String;
    SupplierID   : String;
    CompanyName  : String;
    Address      : String;
    City         : String;
    Region       : String;
    CategoryName : String;
    Description  : String;
}

service BooksService {
    entity Books      as projection on northwind.Books;
    entity Products   as projection on northwind.Products;
    entity Suppliers  as projection on northwind.Suppliers;
    entity Categories as projection on northwind.Categories;

    action   LogBooks(borrowerID : String, bookTitle : String, authorName : String, readDate : Date) returns String;
    function FetchBooks(borrowerID : String) returns array of Books;

    action   insertTBProducts(items : many ProductInput) returns String;
    action   insertTBSuppliers(items : many SupplierInput) returns String;
    action   insertTBCategories(items : many CategoryInput) returns String;
    function FetchProductDetails() returns array of ProductView;
}
