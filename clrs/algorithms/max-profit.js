/**
 * Let:
 * p[i][0] = maximum profit by the end of day i when we own no stock
 * p[i][1] = maximum balance by the end of day i when we own one stock
 *
 * Optimal substructure:
 *
 * To finish day i without a stock, we either:
 * 1. already had no stock, or
 * 2. sell the stock today
 *
 * p[i][0] = max(p[i - 1][0], p[i - 1][1] + prices[i])
 *
 * To finish day i with a stock, we either:
 * 1. keep the stock previously bought, or
 * 2. buy at today's price
 *
 * p[i][1] = max(p[i - 1][1], -prices[i])
 *
 * Overlapping subproblems:
 * Multiple recursive decision paths can reach the same state, such as
 * solve(i, state). Memoization or bottom-up DP computes each state only once.
 */
function maxProfit(prices) {
  if (prices.length === 0) return 0;

  const n = prices.length;
  const p = Array.from({ length: n }, () => [0, 0]);

  p[0][0] = 0;
  p[0][1] = -prices[0];

  for (let i = 1; i < n; i++) {
    // either continue not holding or sell today
    p[i][0] = Math.max(p[i - 1][0], p[i - 1][1] + prices[i]);

    // either continue holding or buy today
    p[i][1] = Math.max(p[i - 1][1], -prices[i]);
  }

  return p[n - 1][0];
}
