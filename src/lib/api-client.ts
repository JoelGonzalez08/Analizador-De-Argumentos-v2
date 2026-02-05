/**
 * API client for calling the FastAPI backend from Next.js
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Log para debugging
console.log('🔗 API_BASE_URL configurada:', API_BASE_URL);

// ==================== TYPES ====================
export interface AnalysisRequest {
  text: string;
  conversation_id?: number;
}

export interface AnalysisResponse {
  analysis: string;
  argument_id?: number;
}

export interface RecommendationRequest {
  text: string;
}

export interface RecommendationResponse {
  recommendations: string;
  argument_id?: number;
}

export interface ArgumentResponse {
  id: number;
  user_id?: number;
  title?: string;
  original_text: string;
  analyzed_text?: string;
  premises?: string;
  conclusions?: string;
  recommendations?: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: Array<{
    id: number;
    conversation_id: number;
    role: string;
    content: string;
    created_at: string;
    analyses?: Array<{
      id: number;
      message_id: number;
      total_premises: number;
      total_conclusions: number;
      analyzed_at: string;
      created_at: string;
    }>;
  }>;
}

export interface ConversationCreate {
  title?: string;
}

export interface ConversationUpdate {
  title?: string;
}

// ==================== CONVERSATION ENDPOINTS ====================

/**
 * Create a new conversation
 */
export async function createConversation(
  data: ConversationCreate,
  token: string
): Promise<Conversation> {
  const response = await fetch(`${API_BASE_URL}/api/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Error creating conversation: ${response.statusText}`);
  }

  return response.json();
}

/**
 * List all conversations for current user
 */
export async function listConversations(
  token: string,
  skip = 0,
  limit = 50
): Promise<Conversation[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/conversations?skip=${skip}&limit=${limit}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Error listing conversations: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get a specific conversation
 */
export async function getConversation(
  id: number,
  token: string
): Promise<Conversation> {
  const response = await fetch(`${API_BASE_URL}/api/conversations/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Error getting conversation: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update conversation (mainly title)
 */
export async function updateConversation(
  id: number,
  data: ConversationUpdate,
  token: string
): Promise<Conversation> {
  const response = await fetch(`${API_BASE_URL}/api/conversations/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Error updating conversation: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete a conversation
 */
export async function deleteConversation(
  id: number,
  token: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/conversations/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Error deleting conversation: ${response.statusText}`);
  }
}

/**
 * Get analyses for a conversation
 */
export async function getConversationAnalyses(
  conversationId: number,
  token: string
): Promise<Array<{
  id: number;
  message_id: number;
  total_premises: number;
  total_conclusions: number;
  analyzed_at: string;
  created_at: string;
  components?: Array<{
    id: number;
    analysis_id: number;
    component_type: 'PREMISE' | 'CONCLUSION' | 'OTHER';
    text: string;
    tokens: any;
    start_pos: number;
    end_pos: number;
    sequence_order: number;
  }>;
  suggestions?: Array<{
    id: number;
    analysis_id: number;
    component_id?: number;
    component_type?: string;
    suggestion_text: string;
    explanation: string;
    original_text?: string;
    applied: boolean;
    llm_model?: string;
  }>;
}>> {
  const response = await fetch(
    `${API_BASE_URL}/api/conversations/${conversationId}/analyses`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Error getting conversation analyses: ${response.statusText}`);
  }

  return response.json();
}
