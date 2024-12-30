import _ from "underscore";

// create date

export function formatUpdatedAt(isoString) {
  if (!isoString) return "Invalid date";

  const date = new Date(isoString);

  // Check if the date is valid
  if (isNaN(date)) return "Invalid date";

  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  };

  const formattedDate = date.toLocaleDateString("en-US", options);
  return formattedDate;
}

// product filters

export function transformShopProductData(shopProductData) {
  if (!shopProductData || !shopProductData.length) return [];

  return _.map(shopProductData, (edge) => ({
    id: edge.id,
    title: edge.title,
    variants: _.pluck(edge.variants.edges, "node"), // Extracts the `node` from each variant edge
  }));
}

export function createTableProducts(
  filteredWereHouseProducts,
  filteredShopProducts,
) {
  if (!filteredWereHouseProducts?.length || !filteredShopProducts?.length)
    return [];

  const tableProducts = [];

  // Extract barcodes and corresponding info from filteredShopProducts for easy lookup
  const shopProductMap = _.chain(filteredShopProducts)
    .map((product) => ({
      title: product.title,
      variants: _.map(product.variants, (variant) => ({
        sku: variant.sku,
        updated_at: variant.updatedAt,
        barcode: String(variant.barcode), // Convert to string to match format
        inventoryQuantity: variant.inventoryQuantity, // Add inventory quantity for comparison
      })),
    }))
    .value();

  // Iterate over each product in filteredWereHouseProducts
  _.each(filteredWereHouseProducts, (product) => {
    const productId = product.Id;
    const productCode = product.Code;

    const clrs = _.isArray(product.Clrs?.Clr)
      ? product.Clrs.Clr
      : [product.Clrs?.Clr];

    // Iterate over each color option
    _.each(clrs, (clr) => {
      const skus = _.isArray(clr.SKUs?.SKU) ? clr.SKUs.SKU : [clr.SKUs.SKU];

      // Iterate over each SKU to create entries in tableProducts
      _.each(skus, (sku) => {
        const barcode = String(sku.Barcode);
        const warehouseStock = sku.FreeStock;

        // Skip invalid barcodes
        if (!barcode || barcode.trim() === "") return;

        // Find corresponding shop product entry
        const matchingShopProduct = _.find(shopProductMap, (product) =>
          _.some(product.variants, (variant) => variant.barcode === barcode),
        );

        if (matchingShopProduct) {
          // Find the matching variant details
          const matchingVariant = _.find(
            matchingShopProduct.variants,
            (variant) => variant.barcode === barcode,
          );

          // Determine if the stock needs to be updated
          const status = matchingVariant.inventoryQuantity !== warehouseStock;

          tableProducts.push({
            product_id: productId,
            product_code: productCode,
            variant_id: sku.Id,
            barcode: barcode,
            product_name: matchingShopProduct.title,
            sku: matchingVariant.sku,
            updated_at: matchingVariant.updated_at,
            status, // New field indicating stock update status
          });
        }
      });
    });
  });

  return tableProducts;
}

export function filterProductsByBarcode(wereHouseProducts, shopProducts) {
  if (!wereHouseProducts?.length || !shopProducts?.length) {
    return {
      matchedBarcodes: [],
      unMatchedBarcodes: [],
      shopBarcodes: [],
      wereHouseBarcodes: [],
      filteredShopProducts: [],
      filteredWereHouseProducts: [],
      tableProductsNew: [],
      inventoryUpdates: [],
    };
  }

  // Extract all barcodes from shopProducts as strings for quick lookup
  const shopBarcodes = _.chain(shopProducts)
    .pluck("variants")
    .flatten()
    .pluck("barcode")
    .compact()
    .map(String) // Convert all barcodes to strings
    .filter((barcode) => barcode && barcode.trim() !== "") // Exclude empty or invalid barcodes
    .value();

  // Extract all barcodes from wereHouseProducts as strings
  const wereHouseBarcodes = _.chain(wereHouseProducts)
    .map((product) => {
      const clrs = _.isArray(product.Clrs?.Clr)
        ? product.Clrs.Clr
        : product.Clrs?.Clr
          ? [product.Clrs.Clr]
          : [];
      return _.flatten(
        _.map(clrs, (clr) => _.map(clr.SKUs.SKU, (sku) => String(sku.Barcode))),
      );
    })
    .flatten()
    .compact()
    .filter((barcode) => barcode && barcode.trim() !== "") // Exclude empty or invalid barcodes
    .value();

  // Array to store matching and unmatched barcodes
  const matchedBarcodes = [];
  const unMatchedBarcodes = [];

  // Iterate through wereHouseProducts to find matching barcodes
  _.each(wereHouseProducts, (product) => {
    const clrs = _.isArray(product.Clrs?.Clr)
      ? product.Clrs.Clr
      : product.Clrs?.Clr
        ? [product.Clrs.Clr]
        : [];

    _.each(clrs, (clr) => {
      const skus = _.isArray(clr.SKUs?.SKU)
        ? clr.SKUs.SKU
        : clr.SKUs?.SKU
          ? [clr.SKUs.SKU]
          : [];

      _.each(skus, (sku) => {
        const barcode = String(sku.Barcode);
        if (
          barcode &&
          barcode.trim() !== "" &&
          shopBarcodes.includes(barcode) &&
          !matchedBarcodes.includes(barcode)
        ) {
          matchedBarcodes.push(barcode); // Store matching barcode if not already added
        } else if (barcode && barcode.trim() !== "") {
          unMatchedBarcodes.push(barcode); // Store unmatched barcode
        }
      });
    });
  });

  // Filter function based on matchedBarcodes
  const filterByMatchedBarcodes = (products, barcodeKey) => {
    return _.filter(products, (product) => {
      const barcodes =
        barcodeKey === "variants"
          ? _.chain(product[barcodeKey]) // For shopProducts
              .pluck("barcode")
              .compact()
              .map(String)
              .filter((barcode) => barcode && barcode.trim() !== "")
              .value()
          : _.chain(product.Clrs?.Clr)
              .flatten()
              .map((clr) => _.pluck(clr.SKUs.SKU, "Barcode"))
              .flatten()
              .compact()
              .map(String)
              .filter((barcode) => barcode && barcode.trim() !== "")
              .value();

      return _.some(barcodes, (barcode) => matchedBarcodes.includes(barcode));
    });
  };

  // Filter shopProducts and wereHouseProducts
  const filteredShopProducts = filterByMatchedBarcodes(
    shopProducts,
    "variants",
  );
  const filteredWereHouseProducts = filterByMatchedBarcodes(
    wereHouseProducts,
    "Clr",
  );

  const tableProductsNew = createTableProducts(
    filteredWereHouseProducts,
    filteredShopProducts,
  );

  // Create inventory updates array
  const inventoryUpdates = [];
  _.each(filteredWereHouseProducts, (product) => {
    const clrs = _.isArray(product.Clrs?.Clr)
      ? product.Clrs.Clr
      : product.Clrs?.Clr
        ? [product.Clrs.Clr]
        : [];

    _.each(clrs, (clr) => {
      const skus = _.isArray(clr.SKUs?.SKU)
        ? clr.SKUs.SKU
        : clr.SKUs?.SKU
          ? [clr.SKUs.SKU]
          : [];

      _.each(skus, (sku) => {
        const barcode = String(sku.Barcode);
        const warehouseQuantity = sku.FreeStock;

        if (
          barcode &&
          barcode.trim() !== "" &&
          matchedBarcodes.includes(barcode)
        ) {
          // Find the corresponding shop product variant
          const shopVariant = _.chain(filteredShopProducts)
            .pluck("variants")
            .flatten()
            .find((variant) => variant.barcode === barcode)
            .value();

          if (
            shopVariant &&
            shopVariant.inventoryQuantity === warehouseQuantity
          ) {
            // Skip updating if the quantities match
            return;
          }

          // Add to inventory updates if quantities differ
          inventoryUpdates.push({
            barcode,
            quantity: warehouseQuantity,
          });
        }
      });
    });
  });

  return {
    matchedBarcodes,
    unMatchedBarcodes,
    shopBarcodes,
    wereHouseBarcodes,
    filteredShopProducts,
    filteredWereHouseProducts,
    tableProductsNew,
    inventoryUpdates,
  };
}

// order filters

export function transformShopOrders(orderResponse) {
  if (!orderResponse?.orders?.edges?.length) return [];
  return orderResponse.orders.edges.map((edge) => edge.node);
}

export function transformOrderItems(lineItemsResponse) {
  if (!lineItemsResponse?.edges?.length)
    return {
      lineItems: [],
      orderProducts: [],
    };

  const lineItems = _.map(lineItemsResponse.edges, (edge) => ({
    id: edge.node.id,
    title: edge.node.title,
    quantity: edge.node.quantity,
    originalUnitPriceSet: edge.node.originalUnitPriceSet,
    variant: edge.node.variant,
  }));

  // Filter lineItems to create orderProducts
  const orderProducts = _.map(lineItems, (item) => [
    item.title || "Unknown Product",
    `${parseFloat(item.originalUnitPriceSet.shopMoney.amount || 0).toFixed(2)} ${item.originalUnitPriceSet.shopMoney.currencyCode}`,
    `${item.quantity || 0}`,
    `${(item.quantity * parseFloat(item.originalUnitPriceSet.shopMoney.amount || 0)).toFixed(2)} ${item.originalUnitPriceSet.shopMoney.currencyCode}`,
  ]);

  return { lineItems, orderProducts };
}

export function transformOrderDetails(shopOrderArray) {
  if (!shopOrderArray?.length) return [];

  return shopOrderArray.map((order) => ({
    orderId: order.id,
    lineItems: order.lineItems,
    totalAmount: order.currentTotalPriceSet,
    shippingCharge: order.totalShippingPriceSet,
    customerId: order.customer?.id,
    fulfillmentStatus: order.displayFulfillmentStatus,
  }));
}

export function filterOrderIdAndCustomer(shopOrderArray) {
  return _.map(shopOrderArray, (order) => ({
    orderId: order.id,
    customer: {
      id: order.customer?.id || "N/A",
      email: order.customer?.email || "N/A",
      firstName: order.customer?.firstName,
      lastName: order.customer?.lastName,
      phone: order.customer?.phone,
      addresses: order.customer?.addresses,
    },
  }));
}

export function filterAndPushNewEmails(shopUsers, warehouseUsers) {
  const warehouseEmails = _.map(
    warehouseUsers,
    (user) => user.Contacts?.Email || "",
  );

  const filteredShopUsers = _.filter(shopUsers, (shopUser) => {
    const email = shopUser.customer.email;
    return email !== "N/A" && !warehouseEmails.includes(email);
  });

  const uniqueEmails = new Set();
  const uniqueShopUsers = [];

  _.each(filteredShopUsers, (shopUser) => {
    const email = shopUser.customer.email;
    if (!uniqueEmails.has(email)) {
      uniqueEmails.add(email);
      uniqueShopUsers.push(shopUser);
    }
  });

  return uniqueShopUsers;
}

export function filterWereHouseUsersIdAndEmail(usersArray) {
  return usersArray.map((user) => ({
    Id: user.Id,
    Email: user.Contacts.Email,
  }));
}

export function filterShopOrdersWithCustomerId(shopOrders, createdUsers) {
  // Filter out invalid shop orders based on email
  const validShopOrders = _.filter(shopOrders, (order) => {
    if (order?.customer?.email) {
      const email = order.customer.email;
      return email && email.trim() !== "" && email !== "N/A";
    }
    return false;
  });

  // Create a lookup map for createdUsers by email
  const createdUserMap = _.object(
    _.map(createdUsers, (user) => [user.Email, user.Id])
  );

  // Filter and process valid shop orders
  const filteredOrders = _.map(validShopOrders, (order) => {
    const customerId = _.has(createdUserMap, order.customer.email)
      ? createdUserMap[order.customer.email] // Use ID from map if email is found
      : 1421; // Default to 1421 if email not found

    return _.extend({}, order, { customerId }); // Add customerId to the order
  });

  return filteredOrders;
}


export function filterShopOrdersByTableProducts(shopOrders, tableProducts) {
  // Create a lookup map for barcodes from tableProducts
  const tableProductsMap = _.object(
    _.map(tableProducts, (product) => [product.barcode, product.variant_id]),
  );

  // Filter and process shopOrders
  return shopOrders
    .map((order) => {
      const filteredLineItems = order.lineItems.edges
        .filter((lineItemEdge) => {
          const lineItem = lineItemEdge.node;
          const variant = lineItem.variant;
          return variant && tableProductsMap[variant.barcode]; // Ensure variant exists and matches barcode
        })
        .map((lineItemEdge) => {
          const lineItem = lineItemEdge.node;
          const variant = lineItem.variant;
          return {
            ...lineItem,
            variant: {
              ...variant,
              sku_id: tableProductsMap[variant.barcode], // Add sku_id inside the variant
            },
          };
        });

      // Return the order with filtered line items
      return {
        ...order,
        lineItems: { edges: filteredLineItems.map((item) => ({ node: item })) }, // Rebuild edges
      };
    })
    .filter((order) => order.lineItems.edges.length > 0); // Exclude orders with no matching line items
}


export function filterShippedOrders(orders) {
  const allDetailsShipped = (order) => {
    return (
      order.OrderDetails?.OrderDetail?.every(
        (detail) => detail.Status === "Shipped"
      ) || false 
    );
  };

  // Filter the orders
  const shippedOrders = orders.filter((order) => allDetailsShipped(order));

  return shippedOrders;
}

// update product data

export function updateProductData(admin, shopProductArray, inventoryUpdates) {
  console.log("called");
}
