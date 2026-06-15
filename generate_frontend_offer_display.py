# -*- coding: utf-8 -*-
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(r"C:\Users\user\Documents\Credit card web project")
OUT = ROOT / "outputs" / "product-spec" / "assets-v20260605-v6-zh" / "frontend-offer-display-2026-06-05.png"
OUT.parent.mkdir(parents=True, exist_ok=True)

PALETTE = {
    "ink": (33, 43, 54),
    "navy": (20, 45, 78),
    "teal": (46, 122, 142),
    "mist": (240, 245, 247),
    "line": (207, 215, 222),
    "gold": (201, 161, 77),
    "gray": (95, 104, 112),
    "white": (255, 255, 255),
    "soft": (247, 250, 251),
    "green": (42, 132, 104),
}


def font(size: int, bold: bool = False):
    candidates = [
        Path("C:/Windows/Fonts/msjhbd.ttc" if bold else "C:/Windows/Fonts/msjh.ttc"),
        Path("C:/Windows/Fonts/mingliub.ttc" if bold else "C:/Windows/Fonts/mingliu.ttc"),
    ]
    for path in candidates:
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default()


F_TITLE = font(40, True)
F_H1 = font(30, True)
F_H2 = font(22, True)
F_BODY = font(18, False)
F_SMALL = font(15, False)
F_TINY = font(13, False)


def rounded(draw, box, fill, outline=None, radius=18, width=2):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def text(draw, xy, value, fnt, fill):
    draw.text(xy, value, font=fnt, fill=fill)


img = Image.new("RGB", (1600, 1120), PALETTE["white"])
draw = ImageDraw.Draw(img)

text(draw, (60, 48), "後台優惠資料在前台的顯示方式", F_TITLE, PALETTE["navy"])
text(draw, (60, 104), "範例資料：CUBE 指定通路回饋 / 現金回饋 / CUBE 卡 / 06/01-12/31 / 上架 / 本站推薦 / 分數 95", F_BODY, PALETTE["ink"])
draw.line((60, 150, 1540, 150), fill=PALETTE["line"], width=3)

rounded(draw, (60, 184, 1540, 272), PALETTE["mist"], PALETTE["line"], radius=18)
map_items = [
    ("優惠標題", "列表卡片標題 / 詳情頁主標"),
    ("分類", "出現在現金回饋分類頁"),
    ("關聯信用卡", "顯示卡名與卡面圖"),
    ("期間", "顯示優惠期間"),
    ("推薦 / 分數", "本站推薦標籤與排序"),
]
x = 86
for label, desc in map_items:
    text(draw, (x, 204), label, F_SMALL, PALETTE["navy"])
    text(draw, (x, 232), desc, F_TINY, PALETTE["gray"])
    x += 288

rounded(draw, (60, 316, 770, 1030), PALETTE["white"], PALETTE["line"], radius=24)
text(draw, (92, 348), "前台分類頁：現金回饋", F_H1, PALETTE["navy"])
text(draw, (92, 390), "使用者在現金回饋分類中看到這筆已上架優惠。", F_BODY, PALETTE["gray"])
rounded(draw, (92, 438, 738, 500), PALETTE["mist"], PALETTE["line"], radius=16)
for i, item in enumerate(["銀行：全部", "狀態：進行中", "排序：本站推薦優先"]):
    rounded(draw, (112 + i * 198, 454, 292 + i * 198, 486), PALETTE["white"], PALETTE["line"], radius=10, width=1)
    text(draw, (126 + i * 198, 462), item, F_TINY, PALETTE["ink"])

rounded(draw, (92, 532, 738, 800), PALETTE["white"], PALETTE["line"], radius=22)
rounded(draw, (116, 562, 250, 660), (229, 236, 241), radius=18)
text(draw, (154, 596), "CUBE", F_H2, PALETTE["navy"])
text(draw, (154, 626), "卡面圖", F_TINY, PALETTE["gray"])
text(draw, (276, 560), "CUBE 指定通路回饋", F_H2, PALETTE["ink"])
text(draw, (276, 596), "國泰世華 CUBE 卡", F_SMALL, PALETTE["gray"])
rounded(draw, (276, 628, 376, 660), PALETTE["gold"], radius=14)
text(draw, (296, 635), "本站推薦", F_TINY, PALETTE["ink"])
rounded(draw, (390, 628, 492, 660), PALETTE["mist"], PALETTE["line"], radius=14, width=1)
text(draw, (408, 635), "現金回饋", F_TINY, PALETTE["navy"])
text(draw, (276, 690), "推薦理由：適合數位消費，通路多、活動單純。", F_SMALL, PALETTE["gray"])
text(draw, (276, 720), "優惠期間：2026/06/01 - 2026/12/31", F_SMALL, PALETTE["ink"])
text(draw, (116, 746), "主打回饋", F_SMALL, PALETTE["gray"])
text(draw, (116, 774), "指定通路最高 3% 回饋", F_H2, PALETTE["teal"])
rounded(draw, (558, 746, 702, 786), PALETTE["teal"], radius=16)
text(draw, (590, 756), "查看詳情", F_SMALL, PALETTE["white"])

rounded(draw, (92, 842, 738, 946), PALETTE["soft"], PALETTE["line"], radius=18)
text(draw, (118, 864), "前台列表頁顯示重點", F_H2, PALETTE["navy"])
text(draw, (118, 900), "只顯示比較所需資訊：卡名、銀行、分類、期間、二行摘要與主打回饋。", F_SMALL, PALETTE["gray"])

rounded(draw, (830, 316, 1540, 1030), PALETTE["white"], PALETTE["line"], radius=24)
text(draw, (862, 348), "前台詳情頁：優惠完整內容", F_H1, PALETTE["navy"])
text(draw, (862, 390), "使用者點擊列表卡片後，進入完整條件與來源頁。", F_BODY, PALETTE["gray"])
rounded(draw, (862, 438, 1508, 610), PALETTE["mist"], PALETTE["line"], radius=20)
rounded(draw, (888, 468, 1030, 574), (229, 236, 241), radius=18)
text(draw, (928, 506), "CUBE", F_H2, PALETTE["navy"])
text(draw, (928, 536), "卡面圖", F_TINY, PALETTE["gray"])
text(draw, (1060, 462), "CUBE 指定通路回饋", F_H1, PALETTE["ink"])
text(draw, (1060, 506), "國泰世華 CUBE 卡 / 現金回饋", F_SMALL, PALETTE["gray"])
rounded(draw, (1060, 538, 1160, 570), PALETTE["gold"], radius=14)
text(draw, (1080, 545), "本站推薦", F_TINY, PALETTE["ink"])
rounded(draw, (1176, 538, 1260, 570), PALETTE["green"], radius=14)
text(draw, (1198, 545), "進行中", F_TINY, PALETTE["white"])

sections = [
    ("主打回饋", "指定通路最高 3% 回饋"),
    ("優惠期間", "2026/06/01 - 2026/12/31"),
    ("適用條件", "需符合指定通路與活動規則"),
    ("回饋上限", "依官方公告與帳單週期計算"),
    ("注意事項", "實際回饋、排除項目與登錄條件以官方公告為準"),
    ("官方來源", "國泰世華活動頁 / 最後更新：2026/06/05"),
]
y = 648
for label, value in sections:
    rounded(draw, (862, y, 1508, y + 52), PALETTE["soft"], PALETTE["line"], radius=14, width=1)
    text(draw, (888, y + 16), label, F_SMALL, PALETTE["navy"])
    text(draw, (1060, y + 16), value, F_SMALL, PALETTE["ink"])
    y += 62

rounded(draw, (862, 964, 1508, 1008), PALETTE["teal"], radius=16)
text(draw, (1076, 976), "前往官方網站 / 返回列表", F_BODY, PALETTE["white"])

img.save(OUT)
print(OUT)
