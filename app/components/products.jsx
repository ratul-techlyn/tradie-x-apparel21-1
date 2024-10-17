import {
  Card,
  DataTable,
  TextField,
  Pagination,
  Button,
  Text,
} from "@shopify/polaris";
import { useState, useEffect } from "react";

export default function Products({allProducts}) {


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
      <Button onClick={() => alert(`Editing product ${id}`)}>Edit</Button>,
    ],
  );
  
  return (
    <Card>
      {/* heading */}
      <div style={{ marginBottom: "20px" }}>
        <Text variant="headingLg" as="h2">
          All Products
        </Text>
      </div>

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
