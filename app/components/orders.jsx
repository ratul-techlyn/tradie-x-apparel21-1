import {
  Card,
  DataTable,
  TextField,
  Pagination,
  Button,
  Text,
} from "@shopify/polaris";
import React, { useState } from "react";

export default function Orders({allOrders}) {

  // State for pagination and search
  const [currentPage, setCurrentPage] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const itemsPerPage = 10;

  // Search filter
  const filteredOrders = allOrders.filter(
    (order) =>
      order.orderNumber.toLowerCase().includes(searchValue.toLowerCase()) ||
      order.orderId.toLowerCase().includes(searchValue.toLowerCase()) ||
      order.shipToName.toLowerCase().includes(searchValue.toLowerCase()) ||
      order.billToName.toLowerCase().includes(searchValue.toLowerCase()),
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // DataTable rows mapping
  const rows = paginatedOrders.map(
    ({
      orderNumber,
      orderId,
      shipToName,
      billToName,
      orderStatus,
      ap21Status,
      createdAt,
    }) => [
      orderNumber,
      orderId,
      shipToName,
      billToName,
      orderStatus,
      ap21Status,
      createdAt,
      <Button onClick={() => alert(`Viewing order ${orderNumber}`)}>
        View
      </Button>,
    ],
  );

  return (
    <Card>
      {/* heading */}
      <div style={{ marginBottom: "20px" }}>
        <Text variant="headingLg" as="h2">
          All Orders
        </Text>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: "20px" }}>
        <TextField
          label="Search orders"
          value={searchValue}
          onChange={(value) => {
            setSearchValue(value);
            setCurrentPage(1); // Reset to first page when search changes
          }}
          placeholder="Search by Order #, Order ID, Ship To, or Bill To Name"
          clearButton
          onClearButtonClick={() => setSearchValue("")}
        />
      </div>

      {/* DataTable */}
      {filteredOrders.length > 0 ? (
        <DataTable
          columnContentTypes={[
            "text", // Order #
            "text", // Order Id
            "text", // Ship To Name
            "text", // Bill To Name
            "text", // Order Status
            "text", // Ap21 Status
            "text", // Created at
            "text", // Action (Button)
          ]}
          headings={[
            "Order #",
            "Order Id",
            "Ship To Name",
            "Bill To Name",
            "Order Status",
            "Ap21 Status",
            "Created At",
            "Action",
          ]}
          rows={rows}
        />
      ) : (
        <p>No orders found.</p>
      )}

      {/* Pagination Controls */}
      {filteredOrders.length > 0 && (
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
