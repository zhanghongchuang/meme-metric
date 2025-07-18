CREATE TABLE `token_stats` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `token_address` varchar(255) NOT NULL DEFAULT '' COMMENT '代币地址',
  `create_time` int NOT NULL DEFAULT 0 COMMENT '创建时间',
  `holders` int NOT NULL DEFAULT 0 COMMENT '持有者数量',
  `total_buy_volume` decimal(36, 18) NOT NULL DEFAULT 0 COMMENT '买入总金额',
  `total_sell_volume` decimal(36, 18) NOT NULL DEFAULT 0 COMMENT '卖出总金额',
  `net_buy_volume` decimal(36, 18) NOT NULL DEFAULT 0 COMMENT '净买入金额',
  `mcap` decimal(36, 18) NOT NULL DEFAULT 0 COMMENT '市值',
  `stats_time` int NOT NULL DEFAULT 0 COMMENT '统计时间',
  `dex` int NOT NULL DEFAULT 0 COMMENT '类型',
  `buy_tx` int NOT NULL DEFAULT 0 COMMENT '买入交易数',
  `sell_tx` int NOT NULL DEFAULT 0 COMMENT '卖出交易数',
  `net_buy_tx` int NOT NULL DEFAULT 0 COMMENT '净买入交易数',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='代币统计信息表';
ALTER TABLE `token_stats` ADD COLUMN `wallet_tag` varchar(255) NOT NULL DEFAULT '' COMMENT '钱包标签';