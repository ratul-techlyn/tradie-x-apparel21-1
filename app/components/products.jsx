import {
  Card,
  DataTable,
  TextField,
  Pagination,
  Button,
  Text,
  Badge,
} from "@shopify/polaris";
import { useState, useEffect } from "react";
import { formatUpdatedAt } from "../helper/helper";

export default function Products({ tableProducts }) {
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  // Filter products based on search input (product name, SKU, barcode, or product code)
  const filteredProducts = tableProducts.filter(
    (product) =>
      product.product_name.toLowerCase().includes(searchValue.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchValue.toLowerCase()) ||
      product.barcode.toLowerCase().includes(searchValue.toLowerCase()) ||
      product.product_code.toLowerCase().includes(searchValue.toLowerCase()),
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Rows for DataTable
  const rows = paginatedProducts.map(
    ({
      product_id,
      product_code,
      variant_id,
      barcode,
      product_name,
      sku,
      updated_at,
      status,
    }) => [
      product_id,
      product_code,
      variant_id,
      barcode,
      product_name,
      sku,
      <Badge tone={status ? "success" : "warning"}>
        {status ? "Updated" : "Updated at " + formatUpdatedAt(updated_at)}
      </Badge>,
      <Button onClick={() => alert(`Editing product ${product_id}`)}>
        Edit
      </Button>,
    ],
  );

  return (
    <Card>
      {/* Heading */}
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
          placeholder="Search by product name or SKU or barcode or product code"
          clearButton
          onClearButtonClick={() => setSearchValue("")}
        />
      </div>

      {/* Data Table */}
      {filteredProducts.length > 0 ? (
        <DataTable
          columnContentTypes={[
            "text",
            "text",
            "text",
            "text",
            "text",
            "text",
            "text",
            "text",
          ]}
          headings={[
            "Product Id",
            "Product Code",
            "Variant Id",
            "Barcode",
            "Product Name",
            "SKU",
            "Update Status",
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
