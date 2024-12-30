export async function executeGraphQL(admin, mutation, variables = {}) {
  try {
    const response = await admin.graphql(
      mutation,
      { variables }, // Pass variables if required
    );

    const responseJson = await response.json();
    const responseData = responseJson.data;

    if (response.errors) {
      console.error("GraphQL Errors:", response.errors);
      throw new Error("Failed to execute GraphQL query/mutation.");
    }

    return responseData; // Return the data portion of the response
  } catch (error) {
    console.error("GraphQL Execution Error:", error.message);
    throw error;
  }
}



export async function fetchAllProducts(admin) {
  let allProducts = [];
  let hasNextPage = true;
  let cursor = null;

  

  while (hasNextPage) {
    try {
      const response = await admin.graphql(query, {
        after: cursor,
      });
      const productsData = response.data.products;

      console.log(response);

      // Extract products from the response
      allProducts = allProducts.concat(
        productsData.edges.map((edge) => edge.node),
      );

      // Update pagination info
      hasNextPage = productsData.pageInfo.hasNextPage;
      cursor = productsData.pageInfo.endCursor;
    } catch (error) {
      console.error("Error fetching products:", error.message);
      break;
    }
  }

  return allProducts;
}
