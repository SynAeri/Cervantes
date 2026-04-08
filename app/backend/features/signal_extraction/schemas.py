# Pydantic schemas for signal extraction feature

from pydantic import BaseModel
from typing import List, Dict, Optional

class MultipartResponse(BaseModel):
    part_number: int
    sub_question_text: str
    student_answer: str
    rubric_dimension: str
    performance: str  # strong | partial | weak
    evidence: str

class InitialResponse(BaseModel):
    type: str  # multi_choice | freeform | multipart_freeform
    selected: str
    misconception_exposed: Optional[str] = None
    multipart_responses: Optional[List[MultipartResponse]] = None

class PushbackExchange(BaseModel):
    pushback: str
    student_response_type: str
    student_response: str

class SignalExtractionRequest(BaseModel):
    trace_id: str

class RubricDimension(BaseModel):
    performance: str  # strong | partial | weak
    evidence: str
    part_number: Optional[int] = None  # which sub-question tested this dimension (for multipart only)

class SignalExtractionResult(BaseModel):
    scene_id: str
    scene_type: str
    concept: str
    character: str
    initial_response: InitialResponse
    pushback_sequence: List[PushbackExchange]
    revised_understanding: Optional[str]
    rubric_alignment: Dict[str, RubricDimension]
    reflection: str
    status: str  # mastery | revised_with_scaffolding | critical_gap
    scaffolding_needed: bool

class SignalExtractionResponse(BaseModel):
    trace_id: str
    extraction_result: SignalExtractionResult
    success: bool
