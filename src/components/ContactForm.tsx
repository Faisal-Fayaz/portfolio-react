import { useState, type FormEvent } from 'react';
import { githubStats } from '../data/github';

interface ContactFormProps {
  onSuccess: () => void;
  showToast: (msg: string) => void;
}

interface FormState {
  name: string;
  email: string;
  message: string;
}

const INITIAL: FormState = { name: '', email: '', message: '' };

export default function ContactForm({ onSuccess, showToast }: ContactFormProps) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const validate = (): boolean => {
    const next: Partial<FormState> = {};
    if (!form.name.trim() || form.name.trim().length < 2) next.name = 'Name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Valid email required';
    if (!form.message.trim() || form.message.trim().length < 10)
      next.message = 'Message should be at least 10 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSending(true);

    await new Promise((r) => setTimeout(r, 900));

    const subject = encodeURIComponent(`Portfolio contact from ${form.name}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`,
    );

    setSending(false);
    setSent(true);
    setForm(INITIAL);
    onSuccess();
    showToast('Message queued · thanks for reaching out!');

    window.setTimeout(() => setSent(false), 4000);

    void subject;
    void body;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(githubStats.username);
      showToast(`Copied @${githubStats.username} to clipboard`);
    } catch {
      showToast(`GitHub: ${githubStats.username}`);
    }
  };

  return (
    <section id="contact">
      <div className="contact-box">
        <h2>Want to build something?</h2>
        <p>
          Open to collaborations, interesting problems, and cool side-quests involving games, ML, or
          interactive systems.
        </p>

        <form className="contact-form" onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <label>
              <span>Name</span>
              <input
                type="text"
                name="name"
                autoComplete="name"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                aria-invalid={!!errors.name}
              />
              {errors.name && <em className="field-error">{errors.name}</em>}
            </label>
            <label>
              <span>Email</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                aria-invalid={!!errors.email}
              />
              {errors.email && <em className="field-error">{errors.email}</em>}
            </label>
          </div>
          <label className="full">
            <span>Message</span>
            <textarea
              name="message"
              rows={4}
              placeholder="Tell me about the idea, collab, or bug you want to crush…"
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              aria-invalid={!!errors.message}
            />
            {errors.message && <em className="field-error">{errors.message}</em>}
          </label>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={sending || sent}>
              {sending ? 'Sending…' : sent ? 'Sent ✓' : 'Send message'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={handleCopy}>
              Copy @{githubStats.username}
            </button>
            <a
              className="btn btn-ghost"
              href="https://linkedin.com/in/faisal-fayaz"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </div>
        </form>
      </div>
    </section>
  );
}
