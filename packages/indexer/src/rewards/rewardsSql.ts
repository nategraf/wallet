export const movementsBetweenBlocksSql = (fromBlock: number, toBlock: number) => `
SELECT address, SUM(value) AS difference
FROM (
  SELECT "to" AS address, value 
  FROM transfers 
  WHERE "blockNumber" BETWEEN ${fromBlock} AND ${toBlock}

  UNION ALL

  SELECT "from" AS address, -value AS value 
  FROM transfers 
  WHERE "blockNumber" BETWEEN ${fromBlock} AND ${toBlock}
) AS balance_updates
GROUP BY address
`

export const usersToRewardSql = (fromBlock: number, toBlock: number) => `
SELECT 
  identifier, 
  account, 
  account_wallet_mappings."walletAddress", 
  partial_balances.value as "startingBalance",
  movements
FROM (
  SELECT identifier, account
  FROM attestations_completed
  GROUP BY identifier, account
  HAVING count(distinct issuer) >= 2
) AS verified_accounts
JOIN account_wallet_mappings ON account_wallet_mappings."accountAddress" = verified_accounts.account
LEFT JOIN partial_balances ON partial_balances.address = account_wallet_mappings."walletAddress"
LEFT JOIN (
  SELECT address, json_agg(json_build_array(transactions.value, transactions."blockNumber")) AS movements
  FROM (
    SELECT "to" AS address, value, "blockNumber" FROM transfers WHERE "blockNumber" BETWEEN ${fromBlock} AND ${toBlock}
    UNION ALL 
    SELECT "from" AS address, -value AS value, "blockNumber" FROM transfers WHERE "blockNumber" BETWEEN ${fromBlock} AND ${toBlock}
  ) AS transactions
  GROUP BY address  
) AS transactions
ON verified_accounts.account = transactions.address
`
