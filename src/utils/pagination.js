/**
 * Utilitas Pagination dan Filtering untuk Endpoint List
 */
const { Op } = require('sequelize');

/**
 * Parse pagination query params
 */
const getPagination = (query, defaultLimit = 10) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || defaultLimit));
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset,
  };
};

/**
 * Format metadata pagination untuk response
 */
const getPagingData = (data, page, limit) => {
  const { count: total, rows } = data;
  const totalPages = Math.ceil(total / limit);

  return {
    rows,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

/**
 * Parse sort param (e.g. "created_at:desc", "-created_at", "name:asc")
 */
const getOrder = (sortQuery, defaultOrder = [['id', 'DESC']]) => {
  if (!sortQuery || typeof sortQuery !== 'string') {
    return defaultOrder;
  }

  const parts = sortQuery.split(',');
  const order = parts.map((part) => {
    const trimmed = part.trim();
    if (trimmed.startsWith('-')) {
      return [trimmed.substring(1), 'DESC'];
    }
    if (trimmed.includes(':')) {
      const [col, dir] = trimmed.split(':');
      return [col, dir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'];
    }
    return [trimmed, 'ASC'];
  });

  return order.length > 0 ? order : defaultOrder;
};

/**
 * Helper search query Sequelize
 */
const getSearchClause = (search, searchableFields = []) => {
  if (!search || !searchableFields.length) {
    return {};
  }

  return {
    [Op.or]: searchableFields.map((field) => ({
      [field]: {
        [Op.like]: `%${search}%`,
      },
    })),
  };
};

module.exports = {
  getPagination,
  getPagingData,
  getOrder,
  getSearchClause,
};
