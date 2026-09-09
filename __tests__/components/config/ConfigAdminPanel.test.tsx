import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const { useConfigAdmin } = vi.hoisted(() => ({ useConfigAdmin: vi.fn() }));

vi.mock('../../../src/hooks/useConfigAdmin', () => ({ useConfigAdmin }));

import { ConfigAdminPanel } from '../../../app/components/config/ConfigAdminPanel';

const credentialFields = [
  ['PROVIDER_TOKEN_OPENAI', 'OpenAI provider token'],
  ['PROVIDER_TOKEN_ANTHROPIC', 'Anthropic provider token'],
  ['PROVIDER_TOKEN_MISTRAL', 'Mistral provider token'],
  ['PROVIDER_TOKEN_OLLAMA_CLOUD', 'Ollama Cloud provider token'],
  ['ALADDIN_OPENAI_API_KEY', 'Aladdin OpenAI API key'],
  ['ALADDIN_MISTRAL_API_KEY', 'Aladdin Mistral API key'],
  ['ALADDIN_ANTHROPIC_API_KEY', 'Aladdin Anthropic API key'],
] as const;

const ollamaApiKey = ['OLLAMA_API_KEY', 'Ollama API key'] as const;

function renderPanel() {
  const previewMutation = vi.fn().mockResolvedValue({ diff: [], valid: true, validationErrors: [] });
  const applyMutation = vi.fn().mockResolvedValue({ diff: [], valid: true, validationErrors: [] });
  const adminState = {
    snapshot: {
      fields: [
        { key: 'LLM_PROVIDER', value: 'ollama-cloud', impact: { note: 'DB configuration overrides these environment defaults.' } },
        { key: 'LLM_MODEL', value: 'glm-5.2:cloud', impact: { note: 'DB configuration overrides these environment defaults.' } },
        { key: 'OLLAMA_BASE_URL', value: 'https://ollama.com/api' },
        { key: 'OLLAMA_CHAT_MODEL', value: 'glm-5.2:cloud' },
        ...credentialFields.map(([key]) => ({ key, secret: true, value: `snapshot-${key}` })),
        { key: ollamaApiKey[0], secret: true, value: 'snapshot-ollama-api-key' },
      ],
      config: Object.fromEntries(credentialFields.map(([key]) => [key, `config-${key}`])),
    },
    status: null,
    preview: null,
    applyResult: null,
    loading: false,
    error: null,
    previewMutation,
    applyMutation,
    regenerate: vi.fn(),
    refresh: vi.fn(),
  };
  useConfigAdmin.mockImplementation(() => adminState);
  const view = render(<ConfigAdminPanel />);
  return { ...view, adminState, previewMutation, applyMutation };
}

afterEach(cleanup);

beforeEach(() => {
  useConfigAdmin.mockReset();
});

describe('ConfigAdminPanel', () => {
  it('only submits LLM provider and model after the user edits them', async () => {
    const { previewMutation, applyMutation } = renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Preview LLM update' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply LLM update' }));

    await waitFor(() => {
      expect(previewMutation).toHaveBeenCalledWith({
        target: '.env',
        changes: {
          OLLAMA_BASE_URL: 'https://ollama.com/api',
          OLLAMA_CHAT_MODEL: 'glm-5.2:cloud',
        },
      });
      expect(applyMutation).toHaveBeenCalledWith({
        target: '.env',
        changes: {
          OLLAMA_BASE_URL: 'https://ollama.com/api',
          OLLAMA_CHAT_MODEL: 'glm-5.2:cloud',
        },
      });
    });

    fireEvent.change(screen.getByLabelText('Provider'), { target: { value: 'openai' } });
    fireEvent.change(screen.getByLabelText('Model'), { target: { value: 'gpt-5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Preview LLM update' }));

    await waitFor(() => {
      expect(previewMutation).toHaveBeenLastCalledWith({
        target: '.env',
        changes: {
          LLM_PROVIDER: 'openai',
          LLM_MODEL: 'gpt-5',
          OLLAMA_BASE_URL: 'https://ollama.com/api',
          OLLAMA_CHAT_MODEL: 'glm-5.2:cloud',
        },
      });
    });
  });

  it('does not rehydrate a cleared LLM provider into a later request', async () => {
    const { adminState, previewMutation, rerender } = renderPanel();

    fireEvent.change(screen.getByLabelText('Provider'), { target: { value: '' } });
    adminState.snapshot = { ...adminState.snapshot };
    rerender(<ConfigAdminPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Preview LLM update' }));

    await waitFor(() => {
      expect(previewMutation).toHaveBeenCalled();
      expect(previewMutation.mock.calls[0][0].changes).not.toHaveProperty('LLM_PROVIDER');
    });
  });

  it('keeps credentials write-only, redacts snapshots, and only submits nonblank credential values', async () => {
    const { previewMutation, applyMutation } = renderPanel();

    for (const [, label] of [...credentialFields, ollamaApiKey]) {
      const input = screen.getByLabelText(label) as HTMLInputElement;
      expect(input).toHaveAttribute('type', 'password');
      expect(input).toHaveValue('');
    }
    for (const [key] of [...credentialFields, ollamaApiKey]) {
      expect(screen.queryByText(`snapshot-${key}`)).toBeNull();
    }
    for (const [key] of credentialFields) {
      expect(screen.queryByText(`config-${key}`)).toBeNull();
    }
    expect(screen.getByText('DB configuration overrides these environment defaults.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Preview LLM update' }));
    await waitFor(() => {
      const changes = previewMutation.mock.calls[0][0].changes;
      for (const [key] of [...credentialFields, ollamaApiKey]) {
        expect(changes).not.toHaveProperty(key);
      }
    });

    for (const [key, label] of [...credentialFields, ollamaApiKey]) {
      fireEvent.change(screen.getByLabelText(label), { target: { value: `new-${key}` } });
    }
    fireEvent.click(screen.getByRole('button', { name: 'Apply LLM update' }));

    await waitFor(() => {
      expect(applyMutation).toHaveBeenLastCalledWith({
        target: '.env',
        changes: expect.objectContaining(
          Object.fromEntries([...credentialFields, ollamaApiKey].map(([key]) => [key, `new-${key}`]))
        ),
      });
    });
    for (const [, label] of [...credentialFields, ollamaApiKey]) {
      expect(screen.getByLabelText(label)).toHaveValue('');
    }
  });
});
