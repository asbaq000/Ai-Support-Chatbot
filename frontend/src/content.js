export const topics = [
  { title: 'Orders & delivery', subtitle: 'From checkout to your doorstep', prompt: 'How does shipping work?' },
  { title: 'Returns & refunds', subtitle: 'A little peace of mind', prompt: 'What is your return policy?' },
  { title: 'Account & access', subtitle: 'Get back to what matters', prompt: 'How do I reset my password?' },
];
export const articles = [
  { icon: 'box', title: 'Shipping & delivery', summary: 'Delivery windows and tracking details', prompt: 'How does shipping work?', body: 'For our fictional demo store, standard shipping takes 3–5 business days after dispatch. Express shipping takes 1–2 business days. A tracking link appears in the dispatch email. These are sample policies, not a real delivery promise.' },
  { icon: 'return', title: 'Returns & refunds', summary: 'How the sample return process works', prompt: 'What is your return policy?', body: 'Our sample policy allows returns of unused items in their original packaging within 30 days of delivery. For a real store, contact its support team with the order number to confirm eligibility. This demo cannot create a return or issue a refund.' },
  { icon: 'shield', title: 'Account & password help', summary: 'A safer way to get back into your account', prompt: 'How do I reset my password?', body: 'On a connected store, select “Forgot password” on its sign-in page and follow the email instructions. Check your spam folder if the email is missing. Never share a password or verification code in chat. This portfolio demo does not have an account system.' },
  { icon: 'person', title: 'Contact the support team', summary: 'Know when to bring in a person', prompt: 'I need to speak to a human', body: 'For a real business, use the verified contact details on its website. The fictional demo team has sample hours of Monday–Friday, 9:00–18:00 UTC. Assistly can explain the support pathway, but this demo does not send tickets or transfer you to a live agent.' },
];
export function demoReply(message, history = []) {
  const text = message.toLowerCase();
  if (/human|agent|contact|support team/.test(text)) return 'Of course — some questions are better handled by a person. In a connected store, you would use the support contact details on its website.\n\nSample team hours: Monday–Friday, 9:00–18:00 UTC. This demo cannot transfer chats or create tickets, but you can download this conversation to keep your notes.';
  if (/return|refund|exchange/.test(text)) return 'Happy to help. Our sample store accepts returns within 30 days of delivery, provided items are unused and in their original packaging.\n\nFor a real return, contact the store with your order number to confirm eligibility and next steps. No return or refund is processed in this demo.';
  if (/password|account|login|log in|sign in/.test(text)) return 'Let’s get you back in. On a connected store, select “Forgot password” on the sign-in page and follow the email instructions. Check your spam folder if needed.\n\nPlease don’t share passwords or verification codes here. This demo has no account access, so I can guide you but cannot reset credentials.';
  if (/shipping|delivery|deliver|dispatch/.test(text)) return 'Here’s how delivery works in our sample store:\n\nStandard: 3–5 business days after dispatch.\nExpress: 1–2 business days after dispatch.\n\nYou would receive a tracking link by email when your order ships. These are fictional demo policies; actual delivery depends on the store.';
  if (/track|order|#[a-z0-9]|^\d{4,}/.test(text)) return 'You can usually find your tracking link in the dispatch email or your store account under “Orders”.\n\nThis is a portfolio demo, so I cannot look up a real order or confirm its status. Try “How does shipping work?” to explore the sample delivery guidance.';
  if (/hours|open|weekend/.test(text)) return 'Our fictional support team is available Monday–Friday, 9:00–18:00 UTC. This sample assistant is available whenever you open the demo.\n\nFor an actual business, check its website for current hours and contact options.';
  if (/thank/.test(text)) return 'You’re very welcome! If anything else comes up, I’m right here. You can also explore the help center for our sample store policies.';
  if (/hello|^hi\b|^hey\b/.test(text)) return 'Hi! Good to see you. I can walk you through sample shipping, returns, password help, or ways to contact support. What would you like to explore?';
  if (/that|it|how long/.test(text) && history.length) {
    const previous = [...history].reverse().find(m => m.role === 'user');
    if (previous && /return|refund|ship|deliver|order|password/.test(previous.text.toLowerCase())) return demoReply(previous.text);
  }
  return 'I can help you explore shipping, returns, account access, and support contact options for our fictional store. Try one of the suggested topics below.\n\nYou’re using sample mode, which gives scripted replies. Open-ended AI assistance is available when the Gemini backend is configured.';
}
