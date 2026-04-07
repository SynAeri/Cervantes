// Multi-part freeform input component for high-mark questions
// Displays numbered sub-questions with individual text areas for structured responses

'use client';

import React, { useState } from 'react';
import type { SubQuestion } from '@/app/lib/vn-parser';

interface MultiPartResponse {
  partNumber: number;
  subQuestionText: string;
  studentAnswer: string;
  rubricDimension?: string;
}

interface MultiPartFreeformInputProps {
  subQuestions: SubQuestion[];
  onSubmit: (responses: MultiPartResponse[]) => void;
}

export function MultiPartFreeformInput({
  subQuestions,
  onSubmit,
}: MultiPartFreeformInputProps) {
  const [responses, setResponses] = useState<{ [partNumber: number]: string }>(
    {}
  );

  const handleResponseChange = (partNumber: number, value: string) => {
    setResponses(prev => ({
      ...prev,
      [partNumber]: value,
    }));
  };

  const handleSubmit = () => {
    // Validate all responses are filled
    const allFilled = subQuestions.every(
      sq => responses[sq.partNumber]?.trim().length > 0
    );

    if (!allFilled) {
      alert('Please answer all parts of the question before submitting.');
      return;
    }

    // Build structured response array
    const structuredResponses: MultiPartResponse[] = subQuestions.map(sq => ({
      partNumber: sq.partNumber,
      subQuestionText: sq.questionText,
      studentAnswer: responses[sq.partNumber],
      rubricDimension: sq.rubricDimension,
    }));

    onSubmit(structuredResponses);
  };

  const allFilled = subQuestions.every(
    sq => responses[sq.partNumber]?.trim().length > 0
  );

  return (
    <div className="vn-multipart-input">
      <div className="multipart-header">
        <p className="instruction-text">
          This is a high-mark question. Please answer each part thoroughly.
        </p>
      </div>

      <div className="sub-questions-container">
        {subQuestions.map(sq => (
          <div key={sq.partNumber} className="sub-question-block">
            <label className="sub-question-label">
              <span className="part-number">{sq.partNumber})</span>
              <span className="question-text">{sq.questionText}</span>
            </label>

            <textarea
              className="sub-question-textarea"
              value={responses[sq.partNumber] || ''}
              onChange={e => handleResponseChange(sq.partNumber, e.target.value)}
              placeholder={`Answer part ${sq.partNumber}...`}
              rows={4}
            />

            <div className="character-count">
              {responses[sq.partNumber]?.length || 0} characters
            </div>
          </div>
        ))}
      </div>

      <button
        className={`submit-button ${allFilled ? 'ready' : 'disabled'}`}
        onClick={handleSubmit}
        disabled={!allFilled}
      >
        Submit Answer
      </button>

      <style jsx>{`
        .vn-multipart-input {
          padding: 1.5rem;
          background: #FEFCF8;
          border: 1px solid #E8E2D6;
          border-radius: 8px;
          margin: 1rem 0;
        }

        .multipart-header {
          margin-bottom: 1.5rem;
        }

        .instruction-text {
          color: #8A7F72;
          font-size: 0.9rem;
          margin: 0;
        }

        .sub-questions-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .sub-question-block {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .sub-question-label {
          display: flex;
          gap: 0.5rem;
          align-items: flex-start;
          color: #1E1C18;
          font-weight: 500;
          font-size: 1rem;
        }

        .part-number {
          color: #C85A32;
          font-weight: 600;
          flex-shrink: 0;
        }

        .question-text {
          flex: 1;
        }

        .sub-question-textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #E8E2D6;
          border-radius: 6px;
          font-family: inherit;
          font-size: 1rem;
          color: #1E1C18;
          background: #FFFFFF;
          resize: vertical;
          min-height: 100px;
          transition: border-color 0.2s;
        }

        .sub-question-textarea:focus {
          outline: none;
          border-color: #C85A32;
        }

        .sub-question-textarea::placeholder {
          color: #8A7F72;
        }

        .character-count {
          text-align: right;
          font-size: 0.8rem;
          color: #8A7F72;
        }

        .submit-button {
          margin-top: 1.5rem;
          padding: 0.75rem 2rem;
          background: #C85A32;
          color: #FEFCF8;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .submit-button:hover:not(.disabled) {
          background: #A8482A;
        }

        .submit-button.disabled {
          background: #E8E2D6;
          color: #8A7F72;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
