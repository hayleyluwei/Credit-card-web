# 中文編碼與亂碼處理

最後更新：2026-07-04（Asia/Taipei）  
適用範圍：Markdown、JSON、TypeScript、Prisma、Word／PDF 產製前文字及 PowerShell 輸出

## 1. 儲存原則

- 純文字檔統一使用 UTF-8。
- 編輯中文檔案優先使用能保留 UTF-8 的補丁工具。
- 不使用不明預設編碼直接覆寫完整檔案。
- JSON 不加入註解，輸出後必須重新解析驗證。
- 已輸出的正式 Word 版本不覆蓋，依規格書流程另存版本。

## 2. PowerShell 顯示中文

讀取前設定：

```powershell
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [Console]::OutputEncoding
Get-Content -LiteralPath "文件路徑" -Raw -Encoding utf8
```

終端顯示亂碼不一定代表檔案已損壞。先用明確 UTF-8 重新讀取，再判斷是否需要修檔。

## 3. 禁止做法

- 不因終端亂碼就直接重寫整份中文文件。
- 不把問號替代字或 Unicode replacement character 當成正常內容交付。
- 不使用 shell here-string 直接覆寫大型中文正式文件。
- 不在未確認 Word 與 PDF 來源一致時分別修兩份內容。

## 4. 文字檢查

交付前搜尋：

使用能搜尋 Unicode code point `U+FFFD` 的檢查器，並另外搜尋連續問號。不要把 `U+FFFD` 字元本身複製進治理文件。

命中 `??` 時需人工判斷是否為文件刻意說明亂碼檢查；命中 Unicode replacement character（`U+FFFD`）則必須調查來源。

另檢查：

- 繁體中文是否被轉成簡體字。
- 中文標點與空格是否正常。
- Markdown code fence 是否成對。
- 檔名中的中文能否被 `rg --files` 正確列出。
- JSON、程式碼與 schema 是否仍可解析。

## 5. 發現亂碼時

1. 保留原檔，不先覆寫。
2. 確認原始 byte encoding 與讀取方式。
3. 尋找同內容的規格、Summary、Git 版本或來源文件。
4. 列出要修復的範圍與風險。
5. 正式規格或 schema 依專門流程先取得確認。
6. 用 UTF-8 修復後再次搜尋替代字元並進行格式驗證。

## 6. Word 與 PDF

Word／PDF、產品示意圖或正式規格發現中文問題時，必須依：

- `../../規格書文件修正原則.md`
- `../../規格書修改流程.md`

Word 是正式主檔，PDF 從同一份 Word 產出，不分開維護內容版本。
