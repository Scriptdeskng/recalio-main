XP_PER_CORRECT = 10

def score_answers(answers: list[int], correct_indexes: list[int]) -> tuple[int, int, int]:
    correct_answers = sum(1 for selected, correct in zip(answers, correct_indexes) if selected == correct)
    total = len(correct_indexes)
    percentage = round((correct_answers / total) * 100) if total else 0
    xp = correct_answers * XP_PER_CORRECT
    return correct_answers, percentage, xp
