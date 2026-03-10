export class AgentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export class AgentInputError extends AgentError {
  constructor(msg: string) {
    super(msg, 'INPUT_ERROR');
    this.name = 'AgentInputError';
  }
}

export class AgentLLMError extends AgentError {
  constructor(msg: string, cause?: unknown) {
    super(msg, 'LLM_ERROR', cause);
    this.name = 'AgentLLMError';
  }
}

export class AgentPersistenceError extends AgentError {
  constructor(msg: string, cause?: unknown) {
    super(msg, 'PERSISTENCE_ERROR', cause);
    this.name = 'AgentPersistenceError';
  }
}

export class AgentTimeoutError extends AgentError {
  constructor(msg: string) {
    super(msg, 'TIMEOUT_ERROR');
    this.name = 'AgentTimeoutError';
  }
}
