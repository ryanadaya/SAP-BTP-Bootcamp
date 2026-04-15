const cds = require('@sap/cds');
const https = require('https');

function fetchNorthwind(path) {
    return new Promise((resolve, reject) => {
        https.get('https://services.odata.org' + path, (res) => {
            let data = '';
            res.on('data', function(chunk) { data += chunk; });
            res.on('end', function() { resolve(JSON.parse(data)); });
        }).on('error', reject);
    });
}

module.exports = cds.service.impl(async function () {
    const { Books, Products, Suppliers, Categories } = this.entities;

    this.on('LogBooks', async (req) => {
        const { borrowerID, bookTitle, authorName, readDate } = req.data;
        const existing = await SELECT.one.from(Books).where({
            borrowerName: borrowerID,
            bookTitle: bookTitle,
            readDate: readDate
        });
        if (existing) {
            return req.error(409, 'Book already logged for this borrower on this date');
        }
        await INSERT.into(Books).entries({ borrowerName: borrowerID, bookTitle, authorName, readDate });
        return 'Book ' + bookTitle + ' successfully logged for borrower ' + borrowerID;
    });

    this.on('FetchBooks', async (req) => {
        const { borrowerID } = req.data;
        const books = await SELECT.from(Books)
            .where({ borrowerName: borrowerID })
            .orderBy({ borrowerName: 'desc' });
        if (!books || books.length === 0) {
            return req.error(404, 'No books found for borrower ' + borrowerID);
        }
        return books;
    });

    this.on('insertTBProducts', async (req) => {
        const data = await fetchNorthwind('/V3/Northwind/Northwind.svc/Products?$format=json');
        const entries = data.value.map(function(p) {
            return {
                ProductID:       String(p.ProductID),
                ProductName:     p.ProductName,
                SupplierID:      String(p.SupplierID),
                CategoryID:      String(p.CategoryID),
                QuantityPerUnit: p.QuantityPerUnit,
                UnitPrice:       String(p.UnitPrice),
                UnitsInStock:    p.UnitsInStock,
                UnitsOnOrder:    p.UnitsOnOrder,
                ReorderLevel:    p.ReorderLevel,
                Discontinued:    String(p.Discontinued)
            };
        });
        const db = await cds.connect.to('db');
        await db.run(DELETE.from('northwind.Products'));
        await db.run(INSERT.into('northwind.Products').entries(entries));
        return entries.length + ' products successfully inserted into HANA.';
    });

    this.on('insertTBSuppliers', async (req) => {
        const data = await fetchNorthwind('/V3/Northwind/Northwind.svc/Suppliers?$format=json');
        const entries = data.value.map(function(s) {
            return {
                SupplierID:   String(s.SupplierID),
                CompanyName:  s.CompanyName,
                ContactName:  s.ContactName,
                ContactTitle: s.ContactTitle,
                Address:      s.Address,
                City:         s.City,
                Region:       s.Region,
                PostalCode:   s.PostalCode,
                Country:      s.Country,
                Phone:        s.Phone,
                Fax:          null,
                HomePage:     s.HomePage
            };
        });
        const db = await cds.connect.to('db');
        await db.run(DELETE.from('northwind.Suppliers'));
        await db.run(INSERT.into('northwind.Suppliers').entries(entries));
        return entries.length + ' suppliers successfully inserted into HANA.';
    });

    this.on('insertTBCategories', async (req) => {
        const data = await fetchNorthwind('/V3/Northwind/Northwind.svc/Categories?$format=json');
        const entries = data.value.map(function(c) {
            return {
                CategoryID:   String(c.CategoryID),
                CategoryName: c.CategoryName,
                Description:  c.Description
            };
        });
        const db = await cds.connect.to('db');
        await db.run(DELETE.from('northwind.Categories'));
        await db.run(INSERT.into('northwind.Categories').entries(entries));
        return entries.length + ' categories successfully inserted into HANA.';
    });

    this.on('FetchProductDetails', async (req) => {
        const products = await SELECT.from(Products);
        const suppliers = await SELECT.from(Suppliers);
        const categories = await SELECT.from(Categories);
        if (!products.length) {
            return req.error(404, 'No product details found. Insert data first.');
        }
        return products.map(function(p) {
            const supplier = suppliers.find(function(s) { return s.SupplierID === p.SupplierID; }) || {};
            const category = categories.find(function(c) { return c.CategoryID === p.CategoryID; }) || {};
            return {
                ProductID:    p.ProductID,
                ProductName:  p.ProductName,
                SupplierID:   p.SupplierID,
                CompanyName:  supplier.CompanyName,
                Address:      supplier.Address,
                City:         supplier.City,
                Region:       supplier.Region,
                CategoryName: category.CategoryName,
                Description:  category.Description
            };
        });
    });
});
