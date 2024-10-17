import {
  Card,
  DataTable,
  TextField,
  Pagination,
  Button,
  Text,
} from "@shopify/polaris";
import React, { useState } from "react";

function ProductDataTableExample() {
  const allProducts = [
    {
      id: "P001",
      variantId: "V001",
      name: "Product A",
      barcode: "1234567890",
      sku: "SKU-A001",
    },
    {
      id: "P002",
      variantId: "V002",
      name: "Product B",
      barcode: "0987654321",
      sku: "SKU-B002",
    },
    {
      id: "P003",
      variantId: "V003",
      name: "Product C",
      barcode: "1122334455",
      sku: "SKU-C003",
    },
    // Add more products as needed...
  ];

  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter products based on search input (product name or SKU)
  const filteredProducts = allProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchValue.toLowerCase()),
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Rows for DataTable
  const rows = paginatedProducts.map(
    ({ id, variantId, name, barcode, sku }) => [
      id,
      variantId,
      name,
      barcode,
      sku,
      <Button onClick={() => alert(`Editing product ${name}`)}>Edit</Button>,
    ],
  );

  return (
    <Card>
      {/* Search Field */}
      <div style={{ marginBottom: "20px" }}>
        <TextField
          label="Search products"
          value={searchValue}
          onChange={(value) => {
            setSearchValue(value);
            setCurrentPage(1); // Reset to first page when search changes
          }}
          placeholder="Search by product name or SKU"
          clearButton
          onClearButtonClick={() => setSearchValue("")}
        />
      </div>

      {/* Data Table */}
      {filteredProducts.length > 0 ? (
        <DataTable
          columnContentTypes={["text", "text", "text", "text", "text", "text"]}
          headings={[
            "Product Id",
            "Variant Id",
            "Product Name",
            "Barcode",
            "SKU",
            "Action",
          ]}
          rows={rows}
        />
      ) : (
        <Text alignment="center" variant="bodyMd">
          No products found.
        </Text>
      )}

      {/* Pagination Controls */}
      {filteredProducts.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          <Text>
            Page {currentPage} of {totalPages}
          </Text>
          <Pagination
            hasPrevious={currentPage > 1}
            onPrevious={() => setCurrentPage(currentPage - 1)}
            hasNext={currentPage < totalPages}
            onNext={() => setCurrentPage(currentPage + 1)}
          />
        </div>
      )}
    </Card>
  );
}

export default ProductDataTableExample;
