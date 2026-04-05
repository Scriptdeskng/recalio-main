"""Tests for scoring logic"""
import pytest
from app.services.scoring import score_answers, XP_PER_CORRECT

def test_score_all_correct():
    """Test scoring when all answers are correct"""
    answers = [0, 1, 2, 3]
    correct_indexes = [0, 1, 2, 3]
    
    correct, percentage, xp = score_answers(answers, correct_indexes)
    
    assert correct == 4
    assert percentage == 100
    assert xp == 40  # 4 * XP_PER_CORRECT

def test_score_all_wrong():
    """Test scoring when all answers are wrong"""
    answers = [1, 2, 3, 0]
    correct_indexes = [0, 1, 2, 3]
    
    correct, percentage, xp = score_answers(answers, correct_indexes)
    
    assert correct == 0
    assert percentage == 0
    assert xp == 0

def test_score_partial():
    """Test scoring with partial correct answers"""
    answers = [0, 1, 3, 3]
    correct_indexes = [0, 1, 2, 3]
    
    correct, percentage, xp = score_answers(answers, correct_indexes)
    
    assert correct == 3
    assert percentage == 75
    assert xp == 30

def test_score_half_correct():
    """Test scoring with 50% correct"""
    answers = [0, 0, 2, 2]
    correct_indexes = [0, 1, 2, 3]
    
    correct, percentage, xp = score_answers(answers, correct_indexes)
    
    assert correct == 2
    assert percentage == 50
    assert xp == 20

def test_score_empty():
    """Test scoring with no questions"""
    answers = []
    correct_indexes = []
    
    correct, percentage, xp = score_answers(answers, correct_indexes)
    
    assert correct == 0
    assert percentage == 0
    assert xp == 0

def test_score_single_question_correct():
    """Test scoring single question correctly"""
    answers = [2]
    correct_indexes = [2]
    
    correct, percentage, xp = score_answers(answers, correct_indexes)
    
    assert correct == 1
    assert percentage == 100
    assert xp == 10

def test_score_single_question_wrong():
    """Test scoring single question incorrectly"""
    answers = [1]
    correct_indexes = [2]
    
    correct, percentage, xp = score_answers(answers, correct_indexes)
    
    assert correct == 0
    assert percentage == 0
    assert xp == 0

def test_score_rounding():
    """Test percentage rounding"""
    answers = [0, 0, 2]  # 2 out of 3 correct
    correct_indexes = [0, 1, 2]
    
    correct, percentage, xp = score_answers(answers, correct_indexes)
    
    assert correct == 2
    assert percentage == 67  # round(66.666...)
    assert xp == 20

def test_xp_per_correct_constant():
    """Verify XP_PER_CORRECT is set correctly"""
    assert XP_PER_CORRECT == 10
    assert isinstance(XP_PER_CORRECT, int)
