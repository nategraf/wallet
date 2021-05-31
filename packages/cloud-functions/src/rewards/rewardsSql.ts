export const verifiedUsersSql = `
SELECT identifier, ARRAY_AGG(account) AS accounts
FROM (
  SELECT identifier, account
  FROM attestations_completed
  GROUP BY identifier, account
  HAVING count(distinct issuer) >= 2
) AS verified
GROUP BY identifier;
`

function listOfAddresses(addresses: string[]) {
  return addresses.map((address) => `'${address}'`).join(', ')
}

export const walletAddressesFromAccountAddressesSql = (addresses: string[]) => `
SELECT distinct "walletAddress"
FROM account_wallet_mappings
WHERE "accountAddress" IN (${listOfAddresses(addresses)})
`

export const balancesSql = `
SELECT received.address, received.value - COALESCE(sent.value, 0) AS balance
FROM 
(SELECT "to" AS address, SUM(value) AS value FROM transfers group by "to") AS received
LEFT JOIN
(SELECT "from" AS address, SUM(value) AS value FROM transfers group by "from") AS sent
ON received.address = sent.address
`

export const averageBalancesSql = (addresses: string[], fromBlock: number, toBlock: number) => `
SELECT starting_balances.address, starting_balance, movements
FROM (
  SELECT received.address, received.value - COALESCE(sent.value, 0) AS starting_balance
  FROM (
    SELECT "to" AS address, SUM(value) AS value 
    FROM transfers 
    WHERE "blockNumber" < ${fromBlock}
    GROUP BY "to"
  ) AS received
  LEFT JOIN (
    SELECT "from" AS address, SUM(value) AS value 
    FROM transfers 
    WHERE "blockNumber" < ${fromBlock}
    GROUP BY "from"
  ) AS sent
  ON received.address = sent.address
) AS starting_balances
FULL OUTER JOIN (
  SELECT address, json_agg(json_build_array(transactions.value, transactions."blockNumber")) AS movements
  FROM (
    SELECT "to" AS address, value, "blockNumber" FROM transfers WHERE "blockNumber" >= ${fromBlock} AND "blockNumber" < ${toBlock}
    UNION ALL 
    SELECT "from" AS address, -value AS value, "blockNumber" FROM transfers WHERE "blockNumber" >= ${fromBlock} AND "blockNumber" < ${toBlock}
  ) AS transactions
  GROUP BY address
) AS transactions
ON starting_balances.address = transactions.address
WHERE starting_balances.address IN (${listOfAddresses(addresses)})
`
