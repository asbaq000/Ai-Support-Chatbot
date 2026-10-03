import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ mode: 'demo' }) });
  Element.prototype.scrollIntoView = jest.fn();
});

test('runs sample chat and restores the conversation after reload', async () => {
  const view = render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Returns & refunds' }));
  await screen.findByText(/Happy to help/, {}, { timeout: 2000 });
  expect(screen.getByText('What is your return policy?')).toBeInTheDocument();
  await waitFor(() => expect(JSON.parse(localStorage.getItem('assistly.messages'))).toHaveLength(3));
  view.unmount();
  render(<App />);
  expect(screen.getByText(/Happy to help/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'New conversation', exact: true }));
  expect(screen.queryByText(/Happy to help/)).not.toBeInTheDocument();
});

test('searches articles and opens a keyboard-dismissable dialog', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Help center/ }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Search help articles' }), { target: { value: 'password' } });
  expect(screen.queryByRole('button', { name: /Shipping & delivery/ })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Account & password help/ }));
  expect(screen.getByRole('dialog')).toHaveFocus();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('recovers from corrupted saved data and saves theme selection', () => {
  localStorage.setItem('assistly.messages', 'broken-json');
  render(<App />);
  expect(screen.getByText(/your support companion/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(JSON.parse(localStorage.getItem('assistly.theme'))).toBe('dark');
});

test('shows a recoverable error if live AI fails, then resumes sample mode', async () => {
  global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ mode: 'live' }) }).mockRejectedValueOnce(new Error('offline'));
  render(<App />);
  await screen.findByText('AI configured');
  fireEvent.change(screen.getByRole('textbox', { name: 'Your message' }), { target: { value: 'How does shipping work?' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  await screen.findByRole('alert');
  fireEvent.click(screen.getByRole('button', { name: 'Use sample demo' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Your message' }), { target: { value: 'How does shipping work?' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  await screen.findByText(/Here’s how delivery works/, {}, { timeout: 2000 });
});
