function getNextProxy(proxies, cursor) {
  if (!Array.isArray(proxies) || proxies.length === 0) {
    return { proxy: null, cursor };
  }

  const nextCursor = ((Number.isInteger(cursor) ? cursor : -1) + 1) % proxies.length;
  return {
    proxy: proxies[nextCursor] || null,
    cursor: nextCursor
  };
}

module.exports = {
  getNextProxy
};
