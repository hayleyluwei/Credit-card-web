-- T33：移除 Neon 建立專案時附贈的範例表 playing_with_neon。
--
-- 為什麼要刪：
--   這張表不在 prisma/schema.prisma 裡，專案程式碼零引用、無任何外鍵關聯。
--   保留它會讓 prisma migrate 判定為 drift（漂移），並提議重置整個資料庫。
--
-- 為什麼用 IF EXISTS：
--   確保在從未建立過這張表的資料庫上套用時也不會失敗。
--
-- 影響範圍：
--   僅此一張表與其附屬 sequence（playing_with_neon_id_seq，由 DROP TABLE 連帶移除）。
--   本專案 11 張表（SiteSetting/AdminUser/Bank/Card/Category/Offer/OfferCard/
--   RewardTier/Channel/RewardTierChannel/Article）完全不在作用範圍內。

DROP TABLE IF EXISTS "playing_with_neon";
