def build_quiz_prompt(*, input_text: str, mode: str, difficulty: str, count: int) -> str:
    source_label = "topic" if mode == "topic" else "notes"
    return f"""
Generate {count} multiple-choice quiz questions from the following {source_label}.
Difficulty: {difficulty}

Rules:
- Return valid JSON only
- Return an array
- Each item must include: tag, q, choices, correct, explanation
- Each question must have exactly 4 choices
- correct must be the zero-based index of the correct answer
- Keep the language concise and learner-friendly

Source:
{input_text}
""".strip()
