import { Redis } from "@zqlc/redis";
import { TokenEntity } from "src/database/entity/token.entity";
import { DataSource } from "typeorm";


export async function fetchTokenInfo(redis: Redis, db: DataSource, ossClient: any, tokenAddrs: string[]){
    const rsp = new Map<string, any>();
    const redisTasks = tokenAddrs.map(async (tokenAddr) => {
        const key = `token_list:${tokenAddr}`;
        const tokenInfo = await redis.hgetall(key);
        if (tokenInfo){
            rsp.set(tokenAddr, tokenInfo);
        }
    })
    await Promise.all(redisTasks);
    let missTokens = tokenAddrs.filter(tokenAddr => !rsp.has(tokenAddr));
    if (missTokens.length > 0){
        const ossTasks = missTokens.map(async (tokenAddr) => {
            const tokenInfo = await ossClient.getOssFileContent(tokenAddr);
            if (tokenInfo){
                try{
                    const info = JSON.parse(tokenInfo);
                    rsp.set(tokenAddr, info);
                }catch(e){
                    console.error(`Error parsing token info for ${tokenAddr}:`, e);
                }
            }
        })
        await Promise.all(ossTasks);
        missTokens = missTokens.filter(tokenAddr => !rsp.has(tokenAddr));
        if (missTokens.length > 0){
            const infos = await db.getRepository(TokenEntity).
            createQueryBuilder('token')
            .where('token.address IN (:...addresses)', { addresses: missTokens })
            .getMany();
            infos.forEach(info => {
                rsp.set(info.address, info);
            });
        }
    }
    return rsp;
}