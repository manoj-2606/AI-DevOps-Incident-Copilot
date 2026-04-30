from groq import Groq
import json

def analyze_log(log: str, api_key: str) -> dict:
    client = Groq(api_key=api_key)

    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": """You are a senior DevOps incident analyzer. Always respond with ONLY raw JSON. No markdown, no explanation, no code blocks.

Severity rules — follow strictly:
- CRITICAL: complete deployment blocked, production down, security breach, data loss risk
- HIGH: pipeline failed, auth failures, state locks, infrastructure errors, exit code 1
- MEDIUM: warnings, deprecations, non-blocking issues, partial failures
- LOW: informational, minor config issues, style warnings

ACR authentication failures = HIGH minimum.
Terraform state locks in production = HIGH minimum.
Exit code 1 on main pipeline = HIGH minimum."""
            },
            {
                "role": "user",
                "content": f"""Analyze this pipeline log and return ONLY a valid JSON object with exactly these keys:
- root_cause: string (what went wrong, be specific)
- fix: string (step-by-step fix instructions)
- severity: string (exactly one of: LOW, MEDIUM, HIGH, CRITICAL)

Log:
{log}"""
            }
        ],
        temperature=0.1,
        max_tokens=1024
    )

    raw = completion.choices[0].message.content.strip()

    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        return json.loads(raw)
    except Exception:
        return {
            "root_cause": raw,
            "fix": "Could not parse structured fix. Review raw output above.",
            "severity": "MEDIUM"
        }