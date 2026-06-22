# Credit Card Offer Content Patterns

## Extraction Checklist

| Question | What To Extract | Where It Usually Goes |
|---|---|---|
| What is this? | Offer title, benefit name, campaign name | `title`, `summary` |
| When? | Start/end date, weekday, limited period | `startDate`, `endDate`, `description` |
| Which card? | Eligible card, card family, new-cardholder only | `OfferCard`, `conditions` |
| Where? | Store, restaurant, country, online/offline channel | `description`, `tags` |
| What action? | Register, claim coupon, show card, bind payment, switch benefit | `description`, `conditions` |
| Threshold? | Single transaction, monthly accumulated spend, item requirement | `minSpend`, `description` |
| Reward? | Percent, price, points, miles, lounge access, transfer count | `rewardValue` |
| Limit? | Cap, quota, per coupon limit, service fee, cannot combine | `rewardCap`, `conditions` |
| Proof? | Official source URL, verification date | `sourceUrl`, `lastVerifiedAt` |

## Writing Pattern

Use this sequence inside `description` when possible:

1. Period or trigger.
2. Eligible card and channel/store.
3. Required customer action.
4. Spend/item requirement.
5. Reward or price.
6. Cap, fee, or limit.
7. Important caveat.

Example shape:

```text
活動期間：YYYY/M/D-YYYY/M/D

持[卡名]於[通路/店家]完成[動作]，[門檻]，可獲得[回饋]。[上限/費用/限制]。

注意：[登錄/領券/不可併用/官方認列限制]。
```

## Example: CUBE Dining

Bad:

```text
CUBE 卡餐飲系列活動，用於測試真實活動條件較長時是否清楚。
```

Good:

```text
每週四外出用餐任務：每週四持CUBE信用卡國內餐廳消費單筆滿NT$2,000，可獲加碼5%優惠券，每張優惠券回饋上限100點小樹點 (信用卡)。

單月餐廳消費累積滿 NT$20,000 時，可再依官方活動規則取得指定餐廳 10% 小樹點優惠券。使用前要先確認是否需要登錄或領券，並確認消費餐廳是否在國泰世華認列的國內餐廳範圍內。
```

Field hints:

- `rewardType`: `points`
- `rewardValue`: `加碼 5% 優惠券；指定餐廳最高 10% 小樹點`
- `rewardCap`: `週四外出用餐任務每張優惠券回饋上限 100 點小樹點；其他優惠券上限以官方活動頁為準。`
- `minSpend`: `每週四國內餐廳消費單筆滿 NT$2,000；指定餐廳加碼需每月餐廳消費累積滿 NT$20,000。`
- `conditions`: mention registration/coupon, restaurant recognition, official rules.

## Example: DAWHO Ootoya Dining

Bad:

```text
用於測試餐廳單店活動與信用卡關聯能否在前台相關優惠中呈現。
```

Good:

```text
活動期間：2026/5/15-2026/7/14

至大戶屋餐廳點「永豐DAWHO幣倍套餐」，結帳出示永豐DAWHO信用卡/幣倍卡，享專屬套餐優惠價$460元/份(原價$510，期間限定9折優惠)，另須支付原價之10%服務費，不得與其他店內優惠併用。

套餐內容：滑蛋豬排鍋定食/野菜豬肉鍋定食/炸腰內肉定食(3選1)+茶碗蒸1份+養生紅豆湯圓1份+紅茶(冷/熱)1杯。
```

Field hints:

- `rewardType`: `discount`
- `rewardValue`: `9 折`
- `rewardCap`: `專屬套餐優惠價 $460 元/份，原價 $510；仍須另支付原價之 10% 服務費。`
- `minSpend`: `需於大戶屋餐廳點購「永豐DAWHO幣倍套餐」。`
- `conditions`: mention showing the eligible card, non-stackable rule, and official announcement.

## Smoke Test Pattern

For each real offer page, assert exact operational phrases, not only title/card names.

Good required texts:

- activity period
- card name
- store/channel
- exact spend threshold or item name
- exact reward/price
- cap/service fee/non-stackable rule
- readable reward type label such as `點數回饋` or `折扣優惠`

Good forbidden texts:

- raw backend codes when shown to users: `points`, `cashback`, `discount`
- filler phrases: `用於測試`, `相關優惠中呈現`, `依官方活動` when used alone
