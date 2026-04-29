import anthropic
import json

def analyze_log(log: str, api_key: str) -> dict:
    client = anthropic.Anthropic(api_key=api_key)

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": f"""You are a DevOps incident analyzer.
Analyze this pipeline log and return ONLY a valid JSON object with exactly these keys:
- root_cause: string (what went wrong, be specific)
- fix: string (step-by-step fix instructions)
- severity: string (exactly one of: LOW, MEDIUM, HIGH, CRITICAL)

No explanation. No markdown. Only raw JSON.

Log:
{log}"""
            }
        ]
    )

    raw = message.content[0].text.strip()

    try:
        return json.loads(raw)
    except Exception:
        return {
            "root_cause": raw,
            "fix": "Could not parse structured fix. Review raw output above.",
            "severity": "MEDIUM"
        }