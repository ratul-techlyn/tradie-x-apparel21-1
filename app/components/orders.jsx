import {
  Card,
  DataTable,
  TextField,
  Pagination,
  Button,
  Text,
  Grid,
} from "@shopify/polaris";
import React, { useState } from "react";
import { transformOrderItems } from "../helper/helper";

export default function Orders({ tableOrders }) {
  // State for pagination, search, and order details
  const [currentPage, setCurrentPage] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const [isDetails, setIsDetails] = useState(false);
  const itemsPerPage = 10;

  // fetched order
  const [detailsOrder, setDetailsOrder] = useState(null);

  // Search filter
  const filteredOrders = tableOrders.filter(
    (order) =>
      order.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      order.id.replace("gid://shopify/Order/", "").includes(searchValue) ||
      (order.shippingAddress?.name || "")
        .toLowerCase()
        .includes(searchValue.toLowerCase()) ||
      (order.billingAddress?.name || "")
        .toLowerCase()
        .includes(searchValue.toLowerCase()),
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // DataTable rows mapping
  const rows = paginatedOrders.map((order) => [
    order.id.replace("gid://shopify/Order/", ""),
    order.name,
    order.shippingAddress?.name || "N/A",
    order.billingAddress?.name || "N/A",
    order.fullyPaid ? "Paid" : "Pending",
    "True", // Ap21 Status
    new Date(order.createdAt).toLocaleDateString(),
    <Button
      onClick={() => {
        setDetailsOrder(order);
        setIsDetails(true);
      }}
    >
      View
    </Button>,
  ]);


  const shippingAddressArray = [detailsOrder?.shippingAddress?.address1, detailsOrder?.shippingAddress?.city, detailsOrder?.shippingAddress?.country];
  const billingAddressArray = [detailsOrder?.billingAddress?.address1, detailsOrder?.billingAddress?.city, detailsOrder?.billingAddress?.country];

  const customerDetails = [
    ["Name", detailsOrder?.shippingAddress?.name || "N/A"],
    ["Shipping Address", detailsOrder?.shippingAddress?.zip + " " + shippingAddressArray.join(", ") ],
    ["Billing Address", detailsOrder?.billingAddress?.zip + " " + billingAddressArray.join(", ")],
  ];

  const paymentDetails = [
    ["Payment Status", detailsOrder?.fullyPaid ? "Paid" : "Pending"],
    ["Total Amount", detailsOrder?.transactions[0]?.amountSet?.shopMoney?.amount || ""],
    ["Currency", detailsOrder?.transactions[0]?.amountSet?.shopMoney?.currencyCode || ""],
  ];
  
  const {orderProducts} = transformOrderItems(detailsOrder?.lineItems);

  return (
    <Card>
      {/* Heading */}
      <div style={{ marginBottom: "20px" }}>
        <Text variant="headingLg" as="h2">
          {isDetails ? `Order Details: ${detailsOrder.name}` : "All Orders"}
        </Text>
      </div>

      {isDetails ? (
        <>
          <Grid>
            <Grid.Cell columnSpan={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
              <Card>
                <Text variant="headingSm" as="h3" style={{ padding: "10px" }}>
                  Customer Details
                </Text>
                <DataTable
                  columnContentTypes={["text", "text"]}
                  headings={["Field", "Value"]}
                  rows={customerDetails}
                />
              </Card>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
              <Card>
                <Text variant="headingSm" as="h3" style={{ padding: "10px" }}>
                  Payment Details
                </Text>
                <DataTable
                  columnContentTypes={["text", "text"]}
                  headings={["Field", "Value"]}
                  rows={paymentDetails}
                />
              </Card>
            </Grid.Cell>
          </Grid>

          <div style={{ marginTop: "20px", marginBottom: "10px" }}>
            <Text variant="headingLg" as="h2">
              Order Items
            </Text>
          </div>
          <Card>
            <DataTable
              columnContentTypes={[
                "text", 
                "numeric",
                "numeric",
                "numeric",
              ]}
              headings={["Product", "Price", "Quantity", "Subtotal"]}
              rows={orderProducts}
            />
          </Card>

          <div style={{ marginTop: "20px" }}>
            <Button
              variant="primary"
              onClick={() => {
                setIsDetails(false); // Back to main table
                setDetailsOrder(null);
              }}
            >
              Back
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* Search Bar */}
          <div style={{ marginBottom: "20px" }}>
            <TextField
              label="Search orders"
              value={searchValue}
              onChange={(value) => {
                setSearchValue(value);
                setCurrentPage(1); // Reset to first page when search changes
              }}
              placeholder="Search by Order ID, Order Name, Ship To, or Bill To Name"
              clearButton
              onClearButtonClick={() => setSearchValue("")}
            />
          </div>

          {/* DataTable */}
          {filteredOrders.length > 0 ? (
            <DataTable
              columnContentTypes={[
                "text", // ID
                "text", // Order Name
                "text", // Ship To Name
                "text", // Bill To Name
                "text", // Order Status
                "text", // Ap21 Status
                "text", // Created At
                "text", // Action (Button)
              ]}
              headings={[
                "ID",
                "Order Name",
                "Ship To Name",
                "Bill To Name",
                "Order Status",
                "Ap21 Status",
                "Created",
                "Action",
              ]}
              rows={rows}
            />
          ) : (
            <Text alignment="center" variant="bodyMd">
              No orders found.
            </Text>
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
        </>
      )}
    </Card>
  );
}
