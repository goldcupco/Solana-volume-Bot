import { Liquidity, LiquidityPoolKeysV4, MARKET_STATE_LAYOUT_V3, Market } from "@raydium-io/raydium-sdk";
import { Commitment, Connection, PublicKey } from "@solana/web3.js";

import dotenv from 'dotenv'
dotenv.config();

export class PoolKeys {
    static SOLANA_ADDRESS = 'So11111111111111111111111111111111111111112'
    // static RAYDIUM_POOL_V4_PROGRAM_ID = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'; //mainnet
    // static OPENBOOK_ADDRESS = 'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX'; //mainnet
    static SOL_DECIMALS = 9

    // In your PoolKeys class use devnet values
    static RAYDIUM_POOL_V4_PROGRAM_ID = 'HWy1jotHpo6UqeQxx47dpwWvWzWJgP5V9MRedis4ZqyW'; // Devnet Raydium V4
    static OPENBOOK_ADDRESS = 'EoTcMgcDRTJVZDMZW7UfQqskUT5kq8wBCHo4wLMaMwfp'; // Devnet OpenBook

    static async fetchMarketId(connection: Connection, baseMint: PublicKey, quoteMint: PublicKey, commitment: Commitment) {
        let accounts = await connection.getProgramAccounts(
        //    new PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX'),
              new PublicKey('EoTcMgcDRTJVZDMZW7UfQqskUT5kq8wBCHo4wLMaMwfp'),
            {
                commitment,
                filters: [
                    { dataSize: MARKET_STATE_LAYOUT_V3.span },
                    {
                        memcmp: {
                            offset: MARKET_STATE_LAYOUT_V3.offsetOf("baseMint"),
                            bytes: baseMint.toBase58(),
                        },
                    },
                    {
                        memcmp: {
                            offset: MARKET_STATE_LAYOUT_V3.offsetOf("quoteMint"),
                            bytes: quoteMint.toBase58(),
                        },
                    },
                ],
            }
        );
        if(!accounts)
        accounts = await connection.getProgramAccounts(
//            new PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX'),
              new PublicKey('EoTcMgcDRTJVZDMZW7UfQqskUT5kq8wBCHo4wLMaMwfp'),
            {
                commitment,
                filters: [
                    { dataSize: MARKET_STATE_LAYOUT_V3.span },
                    {
                        memcmp: {
                            offset: MARKET_STATE_LAYOUT_V3.offsetOf("quoteMint"),
                            bytes: baseMint.toBase58(),
                        },
                    },
                    {
                        memcmp: {
                            offset: MARKET_STATE_LAYOUT_V3.offsetOf("baseMint"),
                            bytes: quoteMint.toBase58(),
                        },
                    },
                ],
            }
        );
        console.log(accounts)
        return accounts.map(({ account }) => MARKET_STATE_LAYOUT_V3.decode(account.data))[0].ownAddress
    }

    static async fetchMarketInfo(connection: Connection, marketId: PublicKey) {
        const marketAccountInfo = await connection.getAccountInfo(marketId, "processed");
        if (!marketAccountInfo) {
            throw new Error('Failed to fetch market info for market id ' + marketId.toBase58());
        }

        return MARKET_STATE_LAYOUT_V3.decode(marketAccountInfo.data);
    }

    static async generateV4PoolInfo(baseMint: PublicKey, quoteMint: PublicKey, marketID: PublicKey) {
        const poolInfo = Liquidity.getAssociatedPoolKeys({
            version: 4,
            marketVersion: 3,
            baseMint: baseMint,
            quoteMint: quoteMint,
            baseDecimals: 0,
            quoteDecimals: this.SOL_DECIMALS,
    //        programId: new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'), //mainnet
            programId: new PublicKey('HWy1jotHpo6UqeQxx47dpwWvWzWJgP5V9MRedis4ZqyW'), //devnet
            marketId: marketID,
    //        marketProgramId: new PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX'), //mainnet
            marketProgramId: new PublicKey('EoTcMgcDRTJVZDMZW7UfQqskUT5kq8wBCHo4wLMaMwfp'), //devnet
    
        });

        return { poolInfo }
    }

    static async fetchPoolKeyInfo(connection: Connection, baseMint: PublicKey, quoteMint: PublicKey) {
        const marketId = await this.fetchMarketId(connection, baseMint, quoteMint, 'confirmed')

        const marketInfo = await this.fetchMarketInfo(connection, marketId);
        // const baseMintInfo = await connection.getParsedAccountInfo(baseMint, "confirmed") as MintInfo;
        // const baseDecimals = baseMintInfo.value.data.parsed.info.decimals

        const V4PoolInfo = await this.generateV4PoolInfo(baseMint, quoteMint, marketId)
        const lpMintInfo = await connection.getParsedAccountInfo(V4PoolInfo.poolInfo.lpMint, "confirmed") as MintInfo;

        return {
            id: V4PoolInfo.poolInfo.id,
            baseMint: baseMint,
            quoteMint: quoteMint,
            lpMint: V4PoolInfo.poolInfo.lpMint,
            baseDecimals: V4PoolInfo.poolInfo.baseDecimals,
            quoteDecimals: V4PoolInfo.poolInfo.quoteDecimals,
            lpDecimals: lpMintInfo.value.data.parsed.info.decimals,
            version: 4,
            programId: new PublicKey(this.RAYDIUM_POOL_V4_PROGRAM_ID),
            authority: V4PoolInfo.poolInfo.authority,
            openOrders: V4PoolInfo.poolInfo.openOrders,
            targetOrders: V4PoolInfo.poolInfo.targetOrders,
            baseVault: V4PoolInfo.poolInfo.baseVault,
            quoteVault: V4PoolInfo.poolInfo.quoteVault,
            withdrawQueue: new PublicKey("11111111111111111111111111111111"),
            lpVault: new PublicKey("11111111111111111111111111111111"),
            marketVersion: 3,
            marketProgramId: new PublicKey(this.OPENBOOK_ADDRESS),
            marketId: marketId,
            marketAuthority: Market.getAssociatedAuthority({ programId: new PublicKey(this.OPENBOOK_ADDRESS), marketId: marketId }).publicKey,
            marketBaseVault: marketInfo.baseVault,
            marketQuoteVault: marketInfo.quoteVault,
            marketBids: marketInfo.bids,
            marketAsks: marketInfo.asks,
            marketEventQueue: marketInfo.eventQueue,
            lookupTableAccount: PublicKey.default
        }
    }
}

interface MintInfo {
    value: {
        data: {
            parsed: {
                info: {
                    decimals: number
                }
            }
        }
    }
}