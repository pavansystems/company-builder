import { NextResponse } from 'next/server';
import {
  AgentError,
  AgentInputError,
  AgentLLMError,
  AgentPersistenceError,
  AgentTimeoutError,
} from '@company-builder/core';

function getStatusCode(error: AgentError): number {
  if (error instanceof AgentInputError) return 400;
  if (error instanceof AgentLLMError) return 502;
  if (error instanceof AgentTimeoutError) return 504;
  if (error instanceof AgentPersistenceError) return 500;
  return 500;
}

export function handleAgentError(error: unknown): NextResponse {
  if (error instanceof AgentError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: getStatusCode(error) },
    );
  }

  const message = error instanceof Error ? error.message : String(error);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message,
      },
    },
    { status: 500 },
  );
}
