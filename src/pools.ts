import fetch from 'isomorphic-fetch';
import { SubGraphPools, Pools, Pool, Token } from './types';
import * as bmath from './bmath';

export class POOLS {
    async getAllPublicSwapPools(URL: string): Promise<SubGraphPools> {
        const query = `
            {
                pools0: pools (first: 1000, where: {publicSwap: true, active: true}) {
                  id
                  swapFee
                  totalWeight
                  publicSwap
                  tokens {
                    id
                    address
                    balance
                    decimals
                    symbol
                    denormWeight
                  }
                  tokensList
                },
                pools1000: pools (first: 1000, skip: 1000, where: {publicSwap: true, active: true}) {
                  id
                  swapFee
                  totalWeight
                  publicSwap
                  tokens {
                    id
                    address
                    balance
                    decimals
                    symbol
                    denormWeight
                  }
                  tokensList
                }
            }
            `;
        const result = await fetch(URL, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
            }),
        });
        const { data } = await result.json();
        let allPools = data.pools0.concat(data.pools1000);
 
        return { pools: allPools } ;
    }

    async formatPoolsBigNumber(pools: SubGraphPools): Promise<Pools> {
        let onChainPools: Pools = { pools: [] };

        for (let i = 0; i < pools.pools.length; i++) {
            let tokens: Token[] = [];

            let p: Pool = {
                id: pools.pools[i].id,
                swapFee: bmath.scale(bmath.bnum(pools.pools[i].swapFee), 18),
                totalWeight: bmath.scale(
                    bmath.bnum(pools.pools[i].totalWeight),
                    18
                ),
                tokens: tokens,
                tokensList: pools.pools[i].tokensList,
            };

            pools.pools[i].tokens.forEach(token => {
                let decimals = Number(token.decimals);

                p.tokens.push({
                    address: token.address,
                    balance: bmath.scale(bmath.bnum(token.balance), decimals),
                    decimals: decimals,
                    denormWeight: bmath.scale(
                        bmath.bnum(token.denormWeight),
                        18
                    ),
                });
            });
            onChainPools.pools.push(p);
        }

        return onChainPools;
    }
}
