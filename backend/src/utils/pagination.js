function drfPaginate(queryOrPage = 1, pageOrSize = 20, pageSizeArg = 20) {
  let page = 1;
  let pageSize = 20;

  if (queryOrPage && typeof queryOrPage === 'object' && !Array.isArray(queryOrPage)) {
    page = queryOrPage.page ?? queryOrPage.p ?? 1;
    pageSize = queryOrPage.page_size ?? queryOrPage.pageSize ?? 20;
  } else {
    page = queryOrPage;
    pageSize = pageOrSize ?? pageSizeArg;
  }

  const p = Math.max(1, parseInt(page, 10) || 1);
  const size = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
  const skip = (p - 1) * size;
  return { page: p, pageSize: size, skip, limit: size };
}

/** Normalize list endpoints for React (array or DRF paginated `{ results }`). */
function asList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

function drfResponse(results, total, page, pageSize, basePath = '') {
  const totalPages = Math.ceil(total / pageSize) || 1;
  return {
    count: total,
    next: page < totalPages ? `${basePath}?page=${page + 1}` : null,
    previous: page > 1 ? `${basePath}?page=${page - 1}` : null,
    results,
  };
}

function customPaginateResponse(results, total, page, pageSize, message = 'Fetched successfully') {
  const totalPages = Math.ceil(total / pageSize) || 1;
  return {
    success: true,
    message,
    pagination: {
      current_page: page,
      total_pages: totalPages,
      total_items: total,
      page_size: pageSize,
      next: page < totalPages,
      previous: page > 1,
    },
    results,
  };
}

module.exports = { drfPaginate, drfResponse, customPaginateResponse, asList };
