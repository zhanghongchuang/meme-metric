import { MessageHandlerErrorBehavior } from '@golevelup/nestjs-rabbitmq';
import { BSC_BLOCK_EXCHANGE_NAME, EXCHANGE_NAME, SOL_BLOCK_EXCHANGE_NAME } from './rabbitMQ';

export default () => ({
  app_name: process.env.APP_NAME || 'twitter-scan',
  port: eval(process.env.PORT ?? '3000'),
  sol_redis: {
    host: process.env.SOL_REDIS_HOST || 'localhost',
    port: eval(process.env.SOL_REDIS_PORT ?? '6379'),
    db: eval(process.env.SOL_REDIS_DB ?? '1'),
    username: process.env.SOL_REDIS_USER_NAME || '',
    password: process.env.SOL_REDIS_PASSWORD || '',
    keyPrefix: `${process.env.SOL_REDIS_PREFIX}:` || 'redis:',
  },

  bsc_redis: {
    host: process.env.BSC_REDIS_HOST || 'localhost',
    port: eval(process.env.BSC_REDIS_PORT ?? '6379'),
    db: eval(process.env.BSC_REDIS_DB ?? '1'),
    username: process.env.BSC_REDIS_USER_NAME || '',
    password: process.env.BSC_REDIS_PASSWORD || '',
    keyPrefix: `${process.env.BSC_REDIS_PREFIX}:` || 'redis:',
  },

  target_redis: {
    host: process.env.TARGET_REDIS_HOST || 'localhost',
    port: eval(process.env.TARGET_REDIS_PORT ?? '6379'),
    db: eval(process.env.TARGET_REDIS_DB ?? '1'),
    username: process.env.TARGET_REDIS_USER_NAME || '',
    password: process.env.TARGET_REDIS_PASSWORD || '',
    keyPrefix: `${process.env.TARGET_REDIS_PREFIX}:` || 'redis:',
  },

  bsc_redis_common: {
    host: process.env.BSC_REDIS_COMMON_HOST || 'localhost',
    port: eval(process.env.BSC_REDIS_COMMON_PORT ?? '6379'),
    db: eval(process.env.BSC_REDIS_COMMON_DB ?? '1'),
    username: process.env.BSC_REDIS_COMMON_USER_NAME || '',
    password: process.env.BSC_REDIS_COMMON_PASSWORD || '',
    keyPrefix: process.env.BSC_REDIS_COMMON_PREFIX,
  },

  sol_redis_common: {
    host: process.env.SOL_REDIS_COMMON_HOST || 'localhost',
    port: eval(process.env.SOL_REDIS_COMMON_PORT ?? '6379'),
    db: eval(process.env.SOL_REDIS_COMMON_DB ?? '1'),
    username: process.env.SOL_REDIS_COMMON_USER_NAME || '',
    password: process.env.SOL_REDIS_COMMON_PASSWORD || '',
    keyPrefix: process.env.SOL_REDIS_COMMON_PREFIX,
  },

  bsc_redis_json: {
    host: process.env.BSC_REDIS_JSON_HOST || 'localhost',
    port: eval(process.env.BSC_REDIS_JSON_PORT ?? '6379'),
    db: eval(process.env.BSC_REDIS_JSON_DB ?? '1'),
    username: process.env.BSC_REDIS_JSON_USER_NAME || '',
    password: process.env.BSC_REDIS_JSON_PASSWORD || '',
    keyPrefix: process.env.BSC_REDIS_JSON_PREFIX,
  },

  sol_redis_json: {
    host: process.env.SOL_REDIS_JSON_HOST || 'localhost',
    port: eval(process.env.SOL_REDIS_JSON_PORT ?? '6379'),
    db: eval(process.env.SOL_REDIS_JSON_DB ?? '1'),
    username: process.env.SOL_REDIS_JSON_USER_NAME || '',
    password: process.env.SOL_REDIS_JSON_PASSWORD || '',
    keyPrefix: process.env.SOL_REDIS_JSON_PREFIX,
  },

  sol_queue_redis: {
    host: process.env.SOL_QUEUE_REDIS_HOST || 'localhost',
    port: eval(process.env.SOL_QUEUE_REDIS_PORT ?? '6379'),
    db: eval(process.env.SOL_QUEUE_REDIS_DB ?? '1'),
    username: process.env.SOL_QUEUE_REDIS_USER_NAME || '',
    password: process.env.SOL_QUEUE_REDIS_PASSWORD || '',
    keyPrefix: process.env.SOL_QUEUE_REDIS_PREFIX,
  },

  bsc_queue_redis: {
    host: process.env.BSC_QUEUE_REDIS_HOST || 'localhost',
    port: eval(process.env.BSC_QUEUE_REDIS_PORT ?? '6379'),
    db: eval(process.env.BSC_QUEUE_REDIS_DB ?? '1'),
    username: process.env.BSC_QUEUE_REDIS_USER_NAME || '',
    password: process.env.BSC_QUEUE_REDIS_PASSWORD || '',
    keyPrefix: process.env.BSC_QUEUE_REDIS_PREFIX,
  },

  sol_memestats_queue_redis: {
    host: process.env.SOL_MEMESTATS_QUEUE_REDIS_HOST || 'localhost',
    port: eval(process.env.SOL_MEMESTATS_QUEUE_REDIS_PORT ?? '6379'),
    db: eval(process.env.SOL_MEMESTATS_QUEUE_REDIS_DB ?? '1'),
    username: process.env.SOL_MEMESTATS_QUEUE_REDIS_USER_NAME || '',
    password: process.env.SOL_MEMESTATS_QUEUE_REDIS_PASSWORD || '',
    keyPrefix: process.env.SOL_MEMESTATS_QUEUE_REDIS_PREFIX,
  },

  bsc_memestats_queue_redis: {
    host: process.env.BSC_MEMESTATS_QUEUE_REDIS_HOST || 'localhost',
    port: eval(process.env.BSC_MEMESTATS_QUEUE_REDIS_PORT ?? '6379'),
    db: eval(process.env.BSC_MEMESTATS_QUEUE_REDIS_DB ?? '1'),
    username: process.env.BSC_MEMESTATS_QUEUE_REDIS_USER_NAME || '',
    password: process.env.BSC_MEMESTATS_QUEUE_REDIS_PASSWORD || '',
    keyPrefix: process.env.BSC_MEMESTATS_QUEUE_REDIS_PREFIX,
  },

  sol_mysql: {
    type: 'mysql',
    host: process.env.SOL_MYSQL_HOST || 'localhost',
    port: eval(process.env.SOL_MYSQL_PORT ?? '5432'),
    username: process.env.SOL_MYSQL_USERNAME || 'root',
    password: process.env.SOL_MYSQL_PASSWORD || 'root',
    database: process.env.SOL_MYSQL_DATABASE || 'test',
    autoLoadEntities: true,
    // logging: true,
    // synchronize: true,
    // timezone: '+08:00', // default 'local'
    // timezone: 'Z',
  },

  bsc_mysql: {
    type: 'mysql',
    host: process.env.BSC_MYSQL_HOST || 'localhost',
    port: eval(process.env.BSC_MYSQL_PORT ?? '5432'),
    username: process.env.BSC_MYSQL_USERNAME || 'root',
    password: process.env.BSC_MYSQL_PASSWORD || 'root',
    database: process.env.BSC_MYSQL_DATABASE || 'test',
    autoLoadEntities: true,
    // logging: true,
    // synchronize: true,
    // timezone: '+08:00', // default 'local'
    // timezone: 'Z',
  },

  bsc_clickhouse: {
    type: 'clickhouse',
    host: process.env.BSC_CLICKHOUSE_HOST || 'localhost',
    port: eval(process.env.BSC_CLICKHOUSE_PORT ?? '8123'),
    username: process.env.BSC_CLICKHOUSE_USERNAME || 'default',
    password: process.env.BSC_CLICKHOUSE_PASSWORD || '',
    database: process.env.BSC_CLICKHOUSE_DATABASE || 'test',
    autoLoadEntities: true,
    // logging: true,
    // synchronize: true,
    // timezone: '+08:00', // default 'local'
    // timezone: 'Z',
  },
  sol_clickhouse: {
    type: 'clickhouse',
    host: process.env.SOL_CLICKHOUSE_HOST || 'localhost',
    port: eval(process.env.SOL_CLICKHOUSE_PORT ?? '8123'),
    username: process.env.SOL_CLICKHOUSE_USERNAME || 'default',
    password: process.env.SOL_CLICKHOUSE_PASSWORD || '',
    database: process.env.SOL_CLICKHOUSE_DATABASE || 'test',
    autoLoadEntities: true,
    // logging: true,
    // synchronize: true,
    // timezone: '+08:00', // default 'local'
    // timezone: 'Z',
  },

  sol_source_mysql: {
    type: 'mysql',
    host: process.env.SOL_SOURCE_MYSQL_HOST || 'localhost',
    port: eval(process.env.SOL_SOURCE_MYSQL_PORT ?? '5432'),
    username: process.env.SOL_SOURCE_MYSQL_USERNAME || 'root',
    password: process.env.SOL_SOURCE_MYSQL_PASSWORD || 'root',
    database: process.env.SOL_SOURCE_MYSQL_DATABASE || 'test',
    autoLoadEntities: true,
    // logging: true,
    // synchronize: true,
    // timezone: '+08:00', // default 'local'
    // timezone: 'Z',
  },

  bsc_source_mysql: {
    type: 'mysql',
    host: process.env.BSC_SOURCE_MYSQL_HOST || 'localhost',
    port: eval(process.env.BSC_SOURCE_MYSQL_PORT ?? '5432'),
    username: process.env.BSC_SOURCE_MYSQL_USERNAME || 'root',
    password: process.env.BSC_SOURCE_MYSQL_PASSWORD || 'root',
    database: process.env.BSC_SOURCE_MYSQL_DATABASE || 'test',
    autoLoadEntities: true,
    // logging: true,
    // synchronize: true,
    // timezone: '+08:00', // default 'local'
    // timezone: 'Z',
  },
  sol_redis_meme: {
    host: process.env.SOL_REDIS_MEME_HOST || 'localhost',
    port: eval(process.env.SOL_REDIS_MEME_PORT ?? '6379'),
    db: eval(process.env.SOL_REDIS_MEME_DB ?? '1'),
    username: process.env.SOL_REDIS_MEME_USER_NAME || '',
    password: process.env.SOL_REDIS_MEME_PASSWORD || '',
    keyPrefix: process.env.SOL_REDIS_MEME_PREFIX,
  },

  bsc_redis_meme: {
    host: process.env.BSC_REDIS_MEME_HOST || 'localhost',
    port: eval(process.env.BSC_REDIS_MEME_PORT ?? '6379'),
    db: eval(process.env.BSC_REDIS_MEME_DB ?? '1'),
    username: process.env.BSC_REDIS_MEME_USER_NAME || '',
    password: process.env.BSC_REDIS_MEME_PASSWORD || '',
    keyPrefix: process.env.BSC_REDIS_MEME_PREFIX,
  },

  kafka: {
    brokers: process.env.KAFKA_BROKERS,
    groupId: process.env.KAFKA_GROUP_ID,
    liquidTopic: process.env.KAFKA_LIQUID_TOPIC,
    compensateTopic: process.env.KAFKA_COMPENSATE_TOPIC,
  },

  rabbitMQ: {
    exchanges: [
      {
        name: EXCHANGE_NAME,
        type: 'direct',
      },
      {
        name: SOL_BLOCK_EXCHANGE_NAME,
        type: 'fanout',
      },
      {
        name: BSC_BLOCK_EXCHANGE_NAME,
        type: 'fanout',
      },
    ],
    channels: {
      'channel-smarttag': {
        prefetchCount: 10,
      },
      'channel-multi-block': {
        prefetchCount: 2000,
      },
      'channel-metric': {
        prefetchCount: 2000,
      },
    },
    uri: process.env.RABBITMQ_URI,
    connectionInitOptions: { wait: false },
    enableDirectReplyTo: false,
    // defaultSubscribeErrorBehavior: MessageHandlerErrorBehavior.REQUEUE,
    // 默认每个队列消费者为1
    prefetchCount: 1,
    // enableBatching: true,
    // batchSize: process.env.RABBITMQ_BATCH_SIZE ? parseInt(process.env.RABBITMQ_BATCH_SIZE) : 100,
    // batchTimeout: process.env.RABBITMQ_BATCH_TIMEOUT ? parseInt(process.env.RABBITMQ_BATCH_TIMEOUT) : 1000, // 5秒超时
  
  },

  rpc: process.env.RPC_NODE,

  current_rpc: process.env.RPC_NODE_CURRENT,

  grpc: {
    enpoint: process.env.GRPC_ENPOINT,
    token: process.env.GRPC_TOKEN,
  },

  alioss: {
    accessKeyId: process.env.ALI_OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALI_OSS_ACCESS_KEY_SECRET,
    bucket: process.env.ALI_OSS_BUCKET,
    endpoint: process.env.ALI_OSS_ENDPOINT,
    region: process.env.ALI_OSS_REGION,
  },

  birdeye: process.env.BIRDEYE_API_KEY,

  solscan: process.env.SOLSCAN_API_KEY,

  BundleSize: process.env.BUNDLE_SIZE || 4,

  BscIgnoreToken: process.env.BSC_IGNORE_TOKEN || [
  '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
  '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c',
  '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
  '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',
  '0x55d398326f99059ff775485246999027b3197955',
  '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
  '0xe9e7cea3dedca5984780bafc599bd69add087d56',
  '0xc5f0f7b66764f6ec8c8dff7ba683102295e16409'
],
  SolIgnoreToken: process.env.SOL_IGNORE_TOKEN || [
  "So11111111111111111111111111111111111111112",
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
  "jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v",
  "GZvcxSGktbCASH2fKhcsgXqJk9kzr22cTviYZJrDekBc",
  "AVuStikTKaJFaqy5SwJ6SQZB5KZEQKA2cmUZSNNsETFw",
  "ByoWibc7cKzjLyqVZqpj5tfHK2bkwiNxmVgGmu9gWizc",
  "6fAEU6nSukARq5CmCc2kQEGyAiCGGgUes9a7nDkxhvBi",
  "5HVBhXZJA1665hbydMBijVDvsFEnFRgXzyD8pWQSkcem",
  "H2jy5cDD1BLyoW8LMi77ozT8WrT2M46j8BeoVKxg1281",
  "ESzQ9xRxF2kUbUqnstmoDUcVn33kJihYzjqjs9yyizuG",
  "31rgFemc47iSkmz1hGGPDWNH5NQRrdhPNPAWJGmisEjE",
  "YDLiYKG8RVnsbopb4T7iZ3EraTwE7smdCRPzZyhPkXv",
  "Hqzs1Rzxbrdzh755bsbkJYkif8VXfyugRQQjtDYeVqqi",
  "EUeqSZ2SX2vKfcvoTTJ1w6Hv7jxizk4EJzjD75mhUFR7",
  "3svx5ciYpEwnb5ZRbUzfgbGYdmUQWta5TEqWoTMp7Zmw",
  "6KAwYBdFd4WKk8TYUVMcZwkfipWKTpipi8AaXzBEzHDw",
  "C8d5SMAEBKTeyXxtJokP1W6fScK1gu63YU1gCEgs6K6N",
  "GSDoYYwh3XxdYo99ip1dMEMsHLCdXyArqQfcuEPshpX5",
  "DzycwNWKtS9KNxKo2zDsHh8bTrt8bZva2AWrtMKRLGrV",
  "bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1",
  "sSo1wxKKr6zW2hqf5hZrp2CawLibcwi1pMBqk5bg2G4",
  "vSoLxydx6akxyMD9XEcPvGYNGq6Nn66oqVb3UkGkei7",
  "7Q2afV64in6N6SeZsAAB81TJzwDoD6zpqmHkzi9Dcavn",
  "Bybit2vBJGhPF52GBdNaQfUJ6ZpThSgHBobjWZpLPb4B",
  "edge86g9cVz87xcpKpy3J77vbp4wYd9idEV562CCntt",
  "2P1M58xpmuLU8BLdstaUUhwzSzG4zeuuZYsJUaqVs7ZE",
  "aeroXvCT6tjGVNyTvZy86tFDwE4sYsKCh7FbNDcrcxF",
  "Dso1bDeDjCQxTrWHqUUi63oBvV7Mdm6WaobLbQ7gnPQ",
  "he1iusmfkpAdwvxLNGV8Y1iSbj4rUy6yMhEA3fotn9A",
  "7mPAd3G8R21rLaJdZYmdWuz4G8dH82u8zDo65Tm5QgEG",
  "6Abjngyfvu7Up44NyFdq98HpydUmgBkihMJcGFttdwtm",
  "DNaP8RT71zmxYrndCwRW4Rmxtm5ccYe7wS6zXPs2UWMF",
  "CqAcFhTFxBHSA5i8DkXFj4fLht8fakrPFNhMkZteAW18",
  "7fzYN3sUweXr4oaHtWqZuXsu8AQFUdKQfKrp71VZJxHQ",
  "9AnxPs4Ty1VfKnxcvQ8BBmaTquQzhCxQkebWAMutfZ5V",
  "82Nm6ts6TKfDBADq8w6k5KebD9dQV2MPoqy8nBtMX5Qi",
  "6MhvBr5rBY1Kou9Cqe2d1o6KubyCjm4XdRE1CRP8NcaC",
  "AShx9q6ugJtjzo6mNzJM9BEZXJ6fbKW4RoX8DxSK6cWw",
  "HuYfJHxk3B4V2EsTbSeChFqxJWTN4Z8DZdAvDG6ESR5W",
  "BNrM3AaqcHknKLxf1zZ3fWLGZbswnHNFUw4EaRPWVpa5",
  "9i5rc52j9xrwo5aMvBBwA1ZEZNnVEJUgqznu9RbUJoBM",
  "2Pb3xQUG32pwyqa2hevYX7624J2pn2NNPPEF27Yccc6i",
  "GHp8FSEqf9K93taNmKHefiuhv8G8RoUT5VjjHBjC1jDA",
  "7qqpESpnoyNn9ULhBePEK17daoPveSp96JPfefH8tqtg",
  "DS3gzjd4prK8usgb1YgBZNnffgqKqxr14ffY37cKTEuj",
  "LSTxxxnJzKDFSLr4dUkPcmCf5VyryEqzPLz5j4bpxFp",
  "58H3ZyAa5EazwiUssY9erSNrtFHThkaae3VHFvFJmLTm",
  "6g5e5sNfCwMW9axCPgZsZgERgvxKgTGGfKAXN8Bvf4vr",
  "jag58eRBC1c88LaAsRPspTMvoKJPbnzw9p9fREzHqyV",
  "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
  "BauXyH7CpLL2iYJ8oHLHN7Hpy9JgSDRzNSKuE1ju5eTb",
  "DSrGErGEcJtPFrDgzACY6wCdBRRn8sXMfK6HNwpAtmtz",
  "3R8QsMvjQqir8C9PUiCYYv9CPC1wXPHjMgWFjdW23TEH",
  "9hok9V27izVA1RcFNJhTyJdGMSizfL5W9XuVd51mdEPP",
  "8zVJRqz2ASzJHAosnZ4BCzZrxPEQxeHVr8Y2ebVLN6Xq",
  "EkhYSCJL3ZqaYAo7nb7afvpe2XGUWXustqkvPCnThXbS",
  "5yjxPtFEY3EeRKTxmgw4LitagjnjcayLh93RM4cHky4t",
  "He9R5SdCWzSHjJzd2nXRjAc43YqZayntQvntNHhrpM1h",
  "6mX3DGivzegcvvwEE1oC2EgZeL6XNXRNKY1Kaoe4rgbd",
  "GYSgPZ2XZJajWompYwEtFtrEDCJwmvTSzCnYmNvFJxUW",
  "hFSqbGRdtKZTjHrXufsB3mkpJ4oEm6ym2VbyU2qZqFP",
  "GXEmwuegSG5zVZKVtDUePsLntp7XquyWrTXE1EvEwceL",
  "USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA",
  "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
  "jucy5XJ76pHVvtPZb5TKRcGQExkwit2P5s4vY8UzmpC",
  "picobAEvs6w7QEknPce34wAE4gknZA9v5tTonnmHYdX",
  "BonK1YhkXEGLZzwtcvRTip3gAL9nCeQD7ppZBLXhtTs",
  "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
  "5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm",
  "BgYgFYq4A9a2o5S1QbWkmYVFBh7LBQL8YvugdhieFg38",
  "LAinEtNLgpmCP9Rvsf5Hn8W6EhNiKLZQti1xfWMLy6X",
  "MangmsBgFqJhW4cLUR9LxfVgMboY1xAoP8UUBiWwwuY",
  "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  "strng7mqqc1MBJJV6vMzYbEqnwVGvKKGKedeCvtktWA",
  "27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4",
  "HUBsveNpjo5pWqNkH57QzxjQASdTVXcSK7bVKTSZtcSX",
  "FpoDAvkfsYrexvFM8ryqZjG9FsDoa8SUAyfG83Rk6wLV",
  "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo",
  "Comp4ssDzXcLeu2MnLuGNNFC4cmLPMng8qWHPvzAMU1h",
  "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh",
  "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
  "pumpkinsEq8xENVZE6QgTS93EN4r9iKvNxNALS1ooyp",
  "st8QujHLPsX3d6HG9uQg9kJ91jFxUgruwsb1hyYXSNd",
  "cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij",
  "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL",
  "A1KLoBrKBde8Ty9qtNQUtq3C2ortoC3u7twggz7sEto6",
  "GRJQtWwdJmp5LLpy8JWjPgn5FnLyqSJGNhn5ZnCTFUwM",
  "pWrSoLAhue6jUxUkbWgmEy5rD9VJzkFmvfTDV5KgNuu",
  "LnTRntk2kTfWEY6cVB8K9649pgJbt6dJLS1Ns1GZ"
  ],
});
