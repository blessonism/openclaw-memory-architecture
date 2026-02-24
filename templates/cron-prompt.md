# [Task Name] — Cron Prompt

> Scheduled task: [brief description]

## Delivery Rules (mandatory)
After completing the report, send it via the message tool.
- channel: [channel]
- target: [chat_id]
- threadId: [thread_id]
If the report exceeds 3800 characters, split into multiple messages.
Each chunk must be semantically complete (don't break URLs or formatting).
If sending fails, retry once. If still failing, output the error — never exit silently.

## Execution Rules (mandatory)
1. All shell commands must be synchronous (no background parameter)
2. Write output files atomically: write to .tmp first, then mv to final path
3. Do not read output files before the generating process has exited
4. Generate execution log before sending report

## Task

[Detailed task instructions here]

## Execution Log

Write execution log to: `data/exec-logs/[task-name]/YYYY-MM-DD.md`

After writing the log, push to GitHub:
```bash
flock -w 60 /path/to/git.lock -c "\
  git add data/exec-logs/ && \
  git diff --cached --quiet || (\
    git -c rebase.autoStash=true pull --rebase origin main && \
    git commit -m 'exec-log: [task-name] [timestamp]' && \
    git push origin main\
  )"
```

Include the GitHub link at the end of your report:
📋 Execution log: https://github.com/[user]/[repo]/blob/main/workspace/data/exec-logs/[task-name]/YYYY-MM-DD.md
