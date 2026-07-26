import { access, readFile } from "node:fs/promises";

const requiredFiles = [
  "AGENTS.md",
  "AI_WORKFLOW_AI協作流程.md",
  "CURRENT_STATE_目前專案狀態.md",
  "TASK_TEMPLATE_任務模板.md",
  "HANDOFF_TEMPLATE_新對話交接模板.md",
  "ROADMAP_產品路線圖.md",
  "docs/implementation/01-ACTIVE_TASK_INDEX_目前任務索引.md",
  "docs/implementation/tasks/T15-AI_DEVELOPMENT_GOVERNANCE_AI開發治理導入.md",
  "docs/implementation/manual-test-scripts/T15-治理文件審閱清單-v1-2026-07-04.md",
  "docs/implementation/summaries/T15-AI_DEVELOPMENT_GOVERNANCE_SUMMARY_AI開發治理導入摘要-v1-2026-07-04.md",
  "docs/sop/README_SOP索引.md",
  "docs/sop/PRODUCTION_DEPLOYMENT_正式環境部署檢查.md",
  "docs/sop/LOCAL_VERIFICATION_本機驗證與快取排查.md",
  "docs/sop/AUTOMATED_VERIFICATION_自動驗證安全分級.md",
  "docs/sop/AI_VERIFICATION_POLICY_自動驗證政策.json",
  "docs/sop/CHINESE_ENCODING_中文編碼與亂碼處理.md",
];

const contentRequirements = {
  "AGENTS.md": [
    "AI_WORKFLOW_AI協作流程.md",
    "CURRENT_STATE_目前專案狀態.md",
    "01-ACTIVE_TASK_INDEX_目前任務索引.md",
    "已核准任務卡的明確 Scope 與操作授權",
  ],
  "AI_WORKFLOW_AI協作流程.md": [
    "第一層：可以自動執行",
    "第二層：可以先做",
    "第三層：必須先確認",
    "unclassified",
    ".ai-worktree-lock.json",
    "Get-NetTCPConnection",
    "任務狀態",
    "部署狀態",
    "已核准任務卡",
  ],
  "CURRENT_STATE_目前專案狀態.md": [
    "Asia/Taipei",
    "正式 Git root",
    "branch：`main`",
    "HEAD：`43b724f`",
    "任務狀態",
    "部署狀態",
    "既有未提交變更",
  ],
  "docs/implementation/00-master-task-index.md": [
    "Historical index",
    "01-ACTIVE_TASK_INDEX_目前任務索引.md",
  ],
  "docs/implementation/01-ACTIVE_TASK_INDEX_目前任務索引.md": [
    "T15-AI_DEVELOPMENT_GOVERNANCE_AI開發治理導入.md",
    "T01–T14",
  ],
  ".gitignore": [".ai-worktree-lock.json"],
};

const failures = [];
const contents = new Map();

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function getContent(path) {
  if (!contents.has(path)) {
    contents.set(path, await readFile(path, "utf8"));
  }
  return contents.get(path);
}

for (const file of requiredFiles) {
  if (!(await exists(file))) failures.push(`Missing required file: ${file}`);
}

for (const [file, expectedTexts] of Object.entries(contentRequirements)) {
  if (!(await exists(file))) {
    failures.push(`Cannot inspect missing file: ${file}`);
    continue;
  }

  const content = await getContent(file);
  for (const expectedText of expectedTexts) {
    if (!content.includes(expectedText)) {
      failures.push(`${file} is missing required text: ${expectedText}`);
    }
  }
}

const governedMarkdownFiles = requiredFiles.filter((file) => file.endsWith(".md"));
const placeholderPattern = /\b(?:TBD|TODO|PLACEHOLDER)\b/u;

for (const file of governedMarkdownFiles) {
  if (!(await exists(file))) continue;
  const content = await getContent(file);
  if (placeholderPattern.test(content)) failures.push(`${file} contains a placeholder marker`);
  if (content.includes("�")) failures.push(`${file} contains a Unicode replacement character`);
}

const policyPath = "docs/sop/AI_VERIFICATION_POLICY_自動驗證政策.json";

if (await exists(policyPath)) {
  try {
    const policy = JSON.parse(await getContent(policyPath));
    if (policy.version !== 1) failures.push("Verification policy version must be 1");
    if (policy.defaultClassification !== "unclassified") {
      failures.push("Verification policy must default to unclassified");
    }
    if (policy.policyChangeRequiresUserApproval !== true) {
      failures.push("Verification policy changes must require user approval");
    }
    if (!Array.isArray(policy.commands)) failures.push("Verification policy commands must be an array");
    if (Array.isArray(policy.commands) && policy.commands.length !== 0) {
      failures.push("Initial verification policy must not self-approve existing commands");
    }
  } catch (error) {
    failures.push(`Verification policy JSON is invalid: ${error.message}`);
  }
}

if (failures.length > 0) {
  console.error("AI governance verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("AI governance verification passed.");
}
